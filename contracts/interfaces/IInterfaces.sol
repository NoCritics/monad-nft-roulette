// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC721 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function setApprovalForAll(address operator, bool approved) external;
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

interface IERC721Metadata {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}