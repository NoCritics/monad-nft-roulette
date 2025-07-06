// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PriceOracle is Ownable {
    mapping(address => uint256) public collectionPrices;
    mapping(address => bool) public verifiedCollections;
    mapping(address => string) public collectionNames;
    address[] public collections;
    
    event PriceUpdated(address indexed collection, uint256 price);
    event CollectionVerified(address indexed collection, bool verified);
    
    constructor() Ownable(msg.sender) {}
    
    function updatePrice(address collection, uint256 price) external onlyOwner {
        collectionPrices[collection] = price;
        emit PriceUpdated(collection, price);
    }
    
    function batchUpdatePrices(
        address[] calldata _collections,
        uint256[] calldata prices
    ) external onlyOwner {
        require(_collections.length == prices.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _collections.length; i++) {
            collectionPrices[_collections[i]] = prices[i];
            emit PriceUpdated(_collections[i], prices[i]);
        }
    }
    
    function setVerifiedCollection(address collection, bool verified) external onlyOwner {
        verifiedCollections[collection] = verified;
        emit CollectionVerified(collection, verified);
    }
    
    function batchSetVerifiedCollections(
        address[] calldata _collections,
        bool[] calldata verified
    ) external onlyOwner {
        require(_collections.length == verified.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _collections.length; i++) {
            verifiedCollections[_collections[i]] = verified[i];
            emit CollectionVerified(_collections[i], verified[i]);
        }
    }
    
    function getPrice(address collection) external view returns (uint256) {
        return collectionPrices[collection];
    }
    
    function isVerified(address collection) external view returns (bool) {
        return verifiedCollections[collection];
    }
    
    function batchUpdatePricesWithNames(
        address[] calldata _collections,
        uint256[] calldata prices,
        string[] calldata names
    ) external onlyOwner {
        require(_collections.length == prices.length && _collections.length == names.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _collections.length; i++) {
            address collection = _collections[i];
            
            // Add to collections array if not already present
            if (collectionPrices[collection] == 0 && !isInArray(collection)) {
                collections.push(collection);
            }
            
            collectionPrices[collection] = prices[i];
            collectionNames[collection] = names[i];
            emit PriceUpdated(collection, prices[i]);
        }
    }
    
    function isInArray(address collection) private view returns (bool) {
        for (uint256 i = 0; i < collections.length; i++) {
            if (collections[i] == collection) return true;
        }
        return false;
    }
    
    function getAllCollections() external view returns (
        address[] memory addresses,
        uint256[] memory prices,
        string[] memory names,
        bool[] memory verified
    ) {
        uint256 length = collections.length;
        addresses = new address[](length);
        prices = new uint256[](length);
        names = new string[](length);
        verified = new bool[](length);
        
        for (uint256 i = 0; i < length; i++) {
            address collection = collections[i];
            addresses[i] = collection;
            prices[i] = collectionPrices[collection];
            names[i] = collectionNames[collection];
            verified[i] = verifiedCollections[collection];
        }
        
        return (addresses, prices, names, verified);
    }
    
    function getCollectionCount() external view returns (uint256) {
        return collections.length;
    }
}
