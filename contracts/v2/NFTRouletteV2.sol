// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
import "../interfaces/IInterfaces.sol";

/**
 * @title NFTRouletteV2
 * @notice V2 adds batch deposit functionality while preserving all V1 features
 * @dev Maintains complete backwards compatibility with V1 for autoVRF script
 */
contract NFTRouletteV2 is Ownable, ReentrancyGuard, IEntropyConsumer {
    // ========== ENUMS ==========
    // CRITICAL: Keep exact same order for autoVRF compatibility
    enum GameState {
        WAITING,
        COUNTDOWN,
        PREPARING,
        DRAWING,
        COMPLETE
    }
    
    // ========== STRUCTS ==========
    struct NFTDeposit {
        address collection;
        uint256 tokenId;
    }
    
    struct PlayerInfo {
        uint256 ticketStart;
        uint256 ticketEnd;
        NFTDeposit[] deposits;
    }
    
    // ========== STATE VARIABLES (V1) ==========
    // CRITICAL: Keep all V1 state variables in exact same order
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
    
    // ========== CONSTANTS (V1) ==========
    uint256 public constant COUNTDOWN_TIME = 3 minutes;
    uint256 public constant PREPARE_TIME = 10 seconds;
    uint256 public constant CLAIM_DEADLINE = 7 days;
    uint256 public constant MAX_PLAYERS = 10;
    uint256 public constant TICKET_PRICE = 1e15; // 0.001 MON per ticket base
    
    // ========== NEW CONSTANTS (V2) ==========
    uint256 public constant MAX_BATCH_DEPOSIT = 10;
    
    // ========== EVENTS (V1) ==========
    event NFTDeposited(address indexed player, address collection, uint256 tokenId, uint256 tickets);
    event GameStarted(uint256 startTime);
    event DrawRequested(uint64 sequenceNumber);
    event WinnerSelected(address indexed winner, uint256 winningTicket);
    event WinningsClaimed(address indexed winner, uint256 nftCount);
    event UnclaimedReturned(uint256 nftCount);
    
    // ========== NEW EVENTS (V2) ==========
    event BatchNFTDeposited(address indexed player, uint256 nftCount, uint256 totalTickets);
    
    // ========== MODIFIERS ==========
    modifier updateState() {
        _updateGameState();
        _;
    }
    
    // ========== CONSTRUCTOR ==========
    constructor(address _entropy, address _priceOracle) Ownable(msg.sender) {
        entropy = IEntropy(_entropy);
        priceOracle = IPriceOracle(_priceOracle);
        gameState = GameState.WAITING;
    }
    
    // ========== V1 CORE FUNCTIONS (PRESERVED EXACTLY) ==========
    
    function _updateGameState() private {
        if (gameState == GameState.COUNTDOWN && 
            block.timestamp >= gameStartTime + COUNTDOWN_TIME) {
            gameState = GameState.PREPARING;
            prepareStartTime = block.timestamp;
        }
        
        if (gameState == GameState.COMPLETE && 
            block.timestamp > winnerClaimDeadline && 
            currentPotNFTs.length > 0) {
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
            players[msg.sender].ticketStart = totalTickets;
        }
        
        players[msg.sender].deposits.push(NFTDeposit(collection, tokenId));
        totalTickets += tickets;
        players[msg.sender].ticketEnd = totalTickets;
        
        currentPotNFTs.push(NFTDeposit(collection, tokenId));
        
        emit NFTDeposited(msg.sender, collection, tokenId, tickets);
        
        if (playerCount == 2 && gameState == GameState.WAITING) {
            gameState = GameState.COUNTDOWN;
            gameStartTime = block.timestamp;
            emit GameStarted(gameStartTime);
        } else if (playerCount == MAX_PLAYERS && gameState == GameState.COUNTDOWN) {
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
        
        for (uint256 i = 0; i < nftCount; i++) {
            IERC721(currentPotNFTs[i].collection).safeTransferFrom(
                address(this),
                msg.sender,
                currentPotNFTs[i].tokenId
            );
        }
        
        emit WinningsClaimed(msg.sender, nftCount);
        
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
        
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            delete players[playerAddresses[i]];
        }
        delete playerAddresses;
        delete currentPotNFTs;
    }
    
    function _returnUnclaimedNFTs() private {
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
    
    function ping() external updateState {
        require(msg.sender == owner(), "Only owner can trigger");
        
        if (gameState == GameState.PREPARING && 
            block.timestamp >= prepareStartTime + PREPARE_TIME) {
            
            address provider = entropy.getDefaultProvider();
            uint256 fee = entropy.getFee(provider);
            
            require(address(this).balance >= fee, "Insufficient balance for VRF");
            
            gameState = GameState.DRAWING;
            
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
    
    // ========== V1 VIEW FUNCTIONS (PRESERVED EXACTLY) ==========
    
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
    
    function getVRFFee() external view returns (uint256) {
        address provider = entropy.getDefaultProvider();
        return entropy.getFee(provider);
    }
    
    // ========== V1 ADMIN FUNCTIONS (PRESERVED EXACTLY) ==========
    
    function fundForVRF() external payable onlyOwner {
        // Owner can fund contract for VRF fees
    }
    
    function emergencyReset() external onlyOwner {
        require(gameState == GameState.COMPLETE || gameState == GameState.DRAWING, "Not in stuck state");
        
        if (currentPotNFTs.length > 0 && currentWinner != address(0)) {
            for (uint256 i = 0; i < currentPotNFTs.length; i++) {
                try IERC721(currentPotNFTs[i].collection).safeTransferFrom(
                    address(this),
                    currentWinner,
                    currentPotNFTs[i].tokenId
                ) {} catch {
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
    
    receive() external payable {}
    
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
    
    // ========== V2 NEW FUNCTIONS ==========
    
    /**
     * @notice Deposit multiple NFTs in a single transaction
     * @param collections Array of NFT collection addresses
     * @param tokenIds Array of token IDs corresponding to collections
     * @dev Arrays must be same length and max 10 items
     */
    function depositMultipleNFTs(
        address[] calldata collections,
        uint256[] calldata tokenIds
    ) external nonReentrant updateState {
        require(collections.length == tokenIds.length, "Array length mismatch");
        require(collections.length > 0, "Empty deposit");
        require(collections.length <= MAX_BATCH_DEPOSIT, "Exceeds max batch size");
        require(gameState == GameState.WAITING || gameState == GameState.COUNTDOWN, "Cannot deposit now");
        
        // Check if new player would exceed max players
        if (players[msg.sender].deposits.length == 0) {
            require(playerCount < MAX_PLAYERS, "Max players reached");
        }
        
        uint256 batchTotalTickets = 0;
        
        // First pass: validate all NFTs and calculate total tickets
        for (uint256 i = 0; i < collections.length; i++) {
            require(priceOracle.isVerified(collections[i]), "Collection not verified");
            uint256 price = priceOracle.getPrice(collections[i]);
            uint256 tickets = price / TICKET_PRICE;
            require(tickets > 0, "NFT value too low");
            batchTotalTickets += tickets;
        }
        
        // If new player, add to game
        if (players[msg.sender].deposits.length == 0) {
            playerAddresses.push(msg.sender);
            playerCount++;
            players[msg.sender].ticketStart = totalTickets;
        }
        
        // Second pass: transfer NFTs and record deposits
        for (uint256 i = 0; i < collections.length; i++) {
            IERC721(collections[i]).transferFrom(msg.sender, address(this), tokenIds[i]);
            
            players[msg.sender].deposits.push(NFTDeposit(collections[i], tokenIds[i]));
            currentPotNFTs.push(NFTDeposit(collections[i], tokenIds[i]));
            
            uint256 price = priceOracle.getPrice(collections[i]);
            uint256 tickets = price / TICKET_PRICE;
            
            emit NFTDeposited(msg.sender, collections[i], tokenIds[i], tickets);
        }
        
        // Update ticket counts
        totalTickets += batchTotalTickets;
        players[msg.sender].ticketEnd = totalTickets;
        
        emit BatchNFTDeposited(msg.sender, collections.length, batchTotalTickets);
        
        // Check game state transitions
        if (playerCount == 2 && gameState == GameState.WAITING) {
            gameState = GameState.COUNTDOWN;
            gameStartTime = block.timestamp;
            emit GameStarted(gameStartTime);
        } else if (playerCount == MAX_PLAYERS && gameState == GameState.COUNTDOWN) {
            gameState = GameState.PREPARING;
            prepareStartTime = block.timestamp;
        }
    }
    
    /**
     * @notice Check which NFTs from given collections are approved for deposit
     * @param user Address to check approvals for
     * @param collections Array of collection addresses to check
     * @return approved Array of booleans indicating approval status
     */
    function checkBatchApprovals(
        address user,
        address[] calldata collections
    ) external view returns (bool[] memory approved) {
        approved = new bool[](collections.length);
        
        for (uint256 i = 0; i < collections.length; i++) {
            try IERC721(collections[i]).isApprovedForAll(user, address(this)) returns (bool isApproved) {
                approved[i] = isApproved;
            } catch {
                approved[i] = false;
            }
        }
        
        return approved;
    }
    
    /**
     * @notice Get all verified collections from price oracle
     * @return collections Array of collection addresses
     * @return prices Array of prices in MON
     * @return names Array of collection names
     */
    function getVerifiedCollections() external view returns (
        address[] memory collections,
        uint256[] memory prices,
        string[] memory names,
        bool[] memory verified
    ) {
        return priceOracle.getAllCollections();
    }
    
    /**
     * @notice Calculate how many MON tickets an NFT is worth
     * @param collection NFT collection address
     * @return tickets Number of MON tickets
     */
    function calculateTickets(address collection, uint256 /* tokenId */) external view returns (uint256 tickets) {
        if (!priceOracle.isVerified(collection)) {
            return 0;
        }
        
        uint256 price = priceOracle.getPrice(collection);
        tickets = price / TICKET_PRICE;
        
        return tickets;
    }
    
    /**
     * @notice Get game statistics
     * @return totalPotValue Total value of NFTs in pot (in MON)
     * @return nftCount Number of NFTs in pot
     * @return timeRemaining Seconds until next state change (0 if none)
     */
    function getGameStats() external view returns (
        uint256 totalPotValue,
        uint256 nftCount,
        uint256 timeRemaining
    ) {
        totalPotValue = totalTickets * TICKET_PRICE;
        nftCount = currentPotNFTs.length;
        
        if (gameState == GameState.COUNTDOWN) {
            uint256 elapsed = block.timestamp - gameStartTime;
            if (elapsed < COUNTDOWN_TIME) {
                timeRemaining = COUNTDOWN_TIME - elapsed;
            }
        } else if (gameState == GameState.PREPARING) {
            uint256 elapsed = block.timestamp - prepareStartTime;
            if (elapsed < PREPARE_TIME) {
                timeRemaining = PREPARE_TIME - elapsed;
            }
        }
        
        return (totalPotValue, nftCount, timeRemaining);
    }
}
