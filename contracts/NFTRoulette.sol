// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
import "./interfaces/IInterfaces.sol";

contract NFTRoulette is Ownable, ReentrancyGuard, IEntropyConsumer {
    enum GameState {
        WAITING,
        COUNTDOWN,
        PREPARING,
        DRAWING,
        COMPLETE
    }
    
    struct NFTDeposit {
        address collection;
        uint256 tokenId;
    }
    
    struct PlayerInfo {
        uint256 ticketStart;
        uint256 ticketEnd;
        NFTDeposit[] deposits;
    }
    
    IEntropy public immutable entropy;
    IPriceOracle public immutable priceOracle;
    
    GameState public gameState;
    uint256 public gameStartTime;
    uint256 public prepareStartTime;
    uint256 public totalTickets;
    uint256 public playerCount;
    
    address public currentWinner;
    uint256 public winnerClaimDeadline;
    NFTDeposit[] public currentPotNFTs;
    
    mapping(address => PlayerInfo) public players;
    address[] public playerAddresses;
    
    uint256 public constant COUNTDOWN_TIME = 3 minutes;
    uint256 public constant PREPARE_TIME = 10 seconds;
    uint256 public constant CLAIM_DEADLINE = 7 days;
    uint256 public constant MAX_PLAYERS = 10;
    uint256 public constant TICKET_PRICE = 1e15; // 0.001 MON per ticket base
    
    event NFTDeposited(address indexed player, address collection, uint256 tokenId, uint256 tickets);
    event GameStarted(uint256 startTime);
    event DrawRequested(uint64 sequenceNumber);
    event WinnerSelected(address indexed winner, uint256 winningTicket);
    event WinningsClaimed(address indexed winner, uint256 nftCount);
    event UnclaimedReturned(uint256 nftCount);
    
    modifier updateState() {
        _updateGameState();
        _;
    }
    
    constructor(address _entropy, address _priceOracle) Ownable(msg.sender) {
        entropy = IEntropy(_entropy);
        priceOracle = IPriceOracle(_priceOracle);
        gameState = GameState.WAITING;
    }
    
    function _updateGameState() private {
        if (gameState == GameState.COUNTDOWN && 
            block.timestamp >= gameStartTime + COUNTDOWN_TIME) {
            gameState = GameState.PREPARING;
            prepareStartTime = block.timestamp;
        }
        
        // Removed VRF trigger from here - will be in ping()
        
        if (gameState == GameState.COMPLETE && 
            block.timestamp > winnerClaimDeadline && 
            currentPotNFTs.length > 0) {
            // Return unclaimed NFTs to players
            _returnUnclaimedNFTs();
            emit UnclaimedReturned(currentPotNFTs.length);
            _resetGame();
        }
    }
    
    function depositNFT(address collection, uint256 tokenId) external nonReentrant updateState {
        require(gameState == GameState.WAITING || gameState == GameState.COUNTDOWN, "Cannot deposit now");
        require(playerCount < MAX_PLAYERS, "Max players reached");
        require(priceOracle.isVerified(collection), "Collection not verified");
        
        IERC721(collection).transferFrom(msg.sender, address(this), tokenId);
        
        uint256 price = priceOracle.getPrice(collection);
        uint256 tickets = price / TICKET_PRICE;
        require(tickets > 0, "NFT value too low");
        
        if (players[msg.sender].deposits.length == 0) {
            playerAddresses.push(msg.sender);
            playerCount++;
        }
        
        players[msg.sender].deposits.push(NFTDeposit(collection, tokenId));
        players[msg.sender].ticketStart = totalTickets;
        totalTickets += tickets;
        players[msg.sender].ticketEnd = totalTickets;
        
        currentPotNFTs.push(NFTDeposit(collection, tokenId));
        
        emit NFTDeposited(msg.sender, collection, tokenId, tickets);
        
        if (playerCount == 2 && gameState == GameState.WAITING) {
            gameState = GameState.COUNTDOWN;
            gameStartTime = block.timestamp;
            emit GameStarted(gameStartTime);
        } else if (playerCount == MAX_PLAYERS && gameState == GameState.COUNTDOWN) {
            // Skip straight to preparing
            gameState = GameState.PREPARING;
            prepareStartTime = block.timestamp;
        }
    }
    
    function entropyCallback(
        uint64 /* sequenceNumber */,
        address /* provider */,
        bytes32 randomNumber
    ) internal override {
        require(msg.sender == address(entropy), "Only entropy can call");
        require(gameState == GameState.DRAWING, "Not in drawing state");
        
        uint256 winningTicket = uint256(randomNumber) % totalTickets;
        
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            address player = playerAddresses[i];
            if (winningTicket >= players[player].ticketStart && 
                winningTicket < players[player].ticketEnd) {
                currentWinner = player;
                break;
            }
        }
        
        gameState = GameState.COMPLETE;
        winnerClaimDeadline = block.timestamp + CLAIM_DEADLINE;
        
        emit WinnerSelected(currentWinner, winningTicket);
    }
    
    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }
    
    function claimWinnings() external nonReentrant updateState {
        require(gameState == GameState.COMPLETE, "Game not complete");
        require(msg.sender == currentWinner, "Not the winner");
        require(block.timestamp <= winnerClaimDeadline, "Claim deadline passed");
        require(currentPotNFTs.length > 0, "No NFTs to claim");
        
        uint256 nftCount = currentPotNFTs.length;
        
        // Transfer all NFTs to winner BEFORE resetting
        for (uint256 i = 0; i < nftCount; i++) {
            IERC721(currentPotNFTs[i].collection).safeTransferFrom(
                address(this),
                msg.sender,
                currentPotNFTs[i].tokenId
            );
        }
        
        emit WinningsClaimed(msg.sender, nftCount);
        
        // Reset game AFTER transferring NFTs
        _resetGame();
    }
    
    function _resetGame() private {
        gameState = GameState.WAITING;
        gameStartTime = 0;
        prepareStartTime = 0;
        totalTickets = 0;
        playerCount = 0;
        currentWinner = address(0);
        winnerClaimDeadline = 0;
        
        // Clear player data
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            delete players[playerAddresses[i]];
        }
        delete playerAddresses;
        
        // Always clear the pot NFTs after a game completes
        delete currentPotNFTs;
    }
    
    function _returnUnclaimedNFTs() private {
        // Return NFTs to original depositors
        uint256 nftIndex = 0;
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            address player = playerAddresses[i];
            uint256 depositCount = players[player].deposits.length;
            
            for (uint256 j = 0; j < depositCount; j++) {
                if (nftIndex < currentPotNFTs.length) {
                    IERC721(currentPotNFTs[nftIndex].collection).safeTransferFrom(
                        address(this),
                        player,
                        currentPotNFTs[nftIndex].tokenId
                    );
                    nftIndex++;
                }
            }
        }
    }
    
    function getPlayerInfo(address player) external view returns (
        uint256 ticketStart,
        uint256 ticketEnd,
        NFTDeposit[] memory deposits
    ) {
        PlayerInfo memory info = players[player];
        return (info.ticketStart, info.ticketEnd, info.deposits);
    }
    
    function getCurrentPotNFTs() external view returns (NFTDeposit[] memory) {
        return currentPotNFTs;
    }
    
    function getPlayerAddresses() external view returns (address[] memory) {
        return playerAddresses;
    }
    
    function getCurrentGameState() external view returns (GameState) {
        return gameState;
    }
    
    function fundForVRF() external payable onlyOwner {
        // Owner can fund contract for VRF fees
    }
    
    function getVRFFee() external view returns (uint256) {
        address provider = entropy.getDefaultProvider();
        return entropy.getFee(provider);
    }
    
    function ping() external updateState {
        // Only owner can trigger VRF to ensure it's automated properly
        require(msg.sender == owner(), "Only owner can trigger");
        
        // Only trigger VRF when conditions are met
        if (gameState == GameState.PREPARING && 
            block.timestamp >= prepareStartTime + PREPARE_TIME) {
            
            address provider = entropy.getDefaultProvider();
            uint256 fee = entropy.getFee(provider);
            
            require(address(this).balance >= fee, "Insufficient balance for VRF");
            
            gameState = GameState.DRAWING;
            
            // Generate user random number from block data
            bytes32 userRandomNumber = keccak256(abi.encodePacked(
                block.timestamp, 
                block.prevrandao,
                totalTickets,
                playerCount
            ));
            
            uint64 sequenceNumber = entropy.requestWithCallback{value: fee}(
                provider,
                userRandomNumber
            );
            
            emit DrawRequested(sequenceNumber);
        }
    }
    
    receive() external payable {}
    
    // Emergency function to reset stuck game
    function emergencyReset() external onlyOwner {
        require(gameState == GameState.COMPLETE || gameState == GameState.DRAWING, "Not in stuck state");
        
        // If there are NFTs and a winner, try to send to winner
        if (currentPotNFTs.length > 0 && currentWinner != address(0)) {
            for (uint256 i = 0; i < currentPotNFTs.length; i++) {
                try IERC721(currentPotNFTs[i].collection).safeTransferFrom(
                    address(this),
                    currentWinner,
                    currentPotNFTs[i].tokenId
                ) {} catch {
                    // If transfer fails, return to original depositor
                    if (i < playerAddresses.length) {
                        try IERC721(currentPotNFTs[i].collection).safeTransferFrom(
                            address(this),
                            playerAddresses[i % playerAddresses.length],
                            currentPotNFTs[i].tokenId
                        ) {} catch {}
                    }
                }
            }
        }
        
        _resetGame();
    }
    
    // Required for receiving NFTs via safeTransferFrom
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
