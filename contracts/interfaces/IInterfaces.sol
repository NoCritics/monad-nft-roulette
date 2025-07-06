// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC721 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IPriceOracle {
    function getPrice(address collection) external view returns (uint256);
    function isVerified(address collection) external view returns (bool);
}