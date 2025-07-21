// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Existing interfaces (keep for compatibility)
interface IERC721 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function balanceOf(address owner) external view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
}

interface IPriceOracle {
    function getPrice(address collection) external view returns (uint256);
    function isVerified(address collection) external view returns (bool);
    function getAllCollections() external view returns (
        address[] memory addresses,
        uint256[] memory prices,
        string[] memory names,
        bool[] memory verified
    );
}

// V2 Interfaces for frontend
interface INFTRouletteV2 {
    struct NFTDeposit {
        address collection;
        uint256 tokenId;
    }
    
    function depositMultipleNFTs(
        address[] calldata collections,
        uint256[] calldata tokenIds
    ) external;
    
    function checkBatchApprovals(
        address user,
        address[] calldata collections
    ) external view returns (bool[] memory approved);
    
    function getVerifiedCollections() external view returns (
        address[] memory collections,
        uint256[] memory prices,
        string[] memory names,
        bool[] memory verified
    );
    
    function calculateTickets(address collection, uint256 tokenId) external view returns (uint256 tickets);
    
    function getGameStats() external view returns (
        uint256 totalPotValue,
        uint256 nftCount,
        uint256 timeRemaining
    );
}

// ERC721 Metadata interface for NFT discovery
interface IERC721Metadata {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}
