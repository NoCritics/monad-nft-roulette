import { Address } from 'viem'
import { readContract, readContracts } from 'wagmi/actions'
import { config } from '../config/wagmi'
import { CONTRACTS, PRICE_ORACLE_ABI, ERC721_ABI } from '../config/contracts'

export interface NFTMetadata {
  name: string
  description?: string
  image?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

export interface UserNFT {
  collection: Address
  collectionName: string
  tokenId: string
  name: string
  image: string
  description?: string
  estimatedValue: number // in MON tickets
  floorPrice: bigint // in wei
  metadata?: NFTMetadata
}

export interface CollectionInfo {
  address: Address
  name: string
  price: bigint
  verified: boolean
}

// Cache for NFT metadata
const metadataCache = new Map<string, { data: NFTMetadata; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Get all verified collections from PriceOracle
 */
export async function getVerifiedCollections(): Promise<CollectionInfo[]> {
  try {
    const result = await readContract(config, {
      address: CONTRACTS.priceOracle as Address,
      abi: PRICE_ORACLE_ABI,
      functionName: 'getAllCollections',
    })
    
    const [addresses, prices, names, verified] = result as [Address[], bigint[], string[], boolean[]]
    
    const collections: CollectionInfo[] = []
    for (let i = 0; i < addresses.length; i++) {
      if (verified[i]) {
        collections.push({
          address: addresses[i],
          name: names[i] || `Collection ${i}`,
          price: prices[i],
          verified: verified[i],
        })
      }
    }
    
    return collections
  } catch (error) {
    console.error('Error fetching verified collections:', error)
    return []
  }
}

/**
 * Check user's balance for each collection
 */
export async function checkUserBalances(
  userAddress: Address,
  collections: CollectionInfo[]
): Promise<Map<Address, bigint>> {
  const balanceMap = new Map<Address, bigint>()
  
  try {
    // Batch read all balances
    const balanceCalls = collections.map(col => ({
      address: col.address,
      abi: ERC721_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    }))
    
    const results = await readContracts(config, {
      contracts: balanceCalls,
    })
    
    results.forEach((result, index) => {
      if (result.status === 'success' && result.result) {
        balanceMap.set(collections[index].address, result.result as bigint)
      }
    })
  } catch (error) {
    console.error('Error checking balances:', error)
  }
  
  return balanceMap
}

/**
 * Get user's token IDs for a specific collection
 */
export async function getUserTokenIds(
  userAddress: Address,
  collectionAddress: Address,
  balance: bigint
): Promise<string[]> {
  const tokenIds: string[] = []
  
  try {
    // For ERC721Enumerable, use tokenOfOwnerByIndex
    // First, check if the contract supports enumeration
    const tokenCalls = []
    const balanceNum = Number(balance)
    
    for (let i = 0; i < balanceNum; i++) {
      tokenCalls.push({
        address: collectionAddress,
        abi: ERC721_ABI,
        functionName: 'tokenOfOwnerByIndex',
        args: [userAddress, BigInt(i)],
      })
    }
    
    const results = await readContracts(config, {
      contracts: tokenCalls,
    })
    
    results.forEach((result) => {
      if (result.status === 'success' && result.result) {
        tokenIds.push(result.result.toString())
      }
    })
  } catch (error) {
    console.error('Error fetching token IDs:', error)
    // Fallback: Try to get tokens through events or other methods
    // For now, we'll return empty array
  }
  
  return tokenIds
}

/**
 * Fetch NFT metadata from tokenURI
 */
export async function fetchNFTMetadata(
  collectionAddress: Address,
  tokenId: string
): Promise<NFTMetadata | null> {
  const cacheKey = `${collectionAddress}-${tokenId}`
  
  // Check cache first
  const cached = metadataCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  
  try {
    // Get tokenURI
    const tokenURI = await readContract(config, {
      address: collectionAddress,
      abi: [
        {
          inputs: [{ name: 'tokenId', type: 'uint256' }],
          name: 'tokenURI',
          outputs: [{ name: '', type: 'string' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    })
    
    if (!tokenURI) return null
    
    // Handle different URI formats
    let metadataUrl = tokenURI as string
    
    // Convert IPFS URLs to HTTP gateway
    if (metadataUrl.startsWith('ipfs://')) {
      metadataUrl = metadataUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    
    // Fetch metadata
    const response = await fetch(metadataUrl)
    if (!response.ok) throw new Error('Failed to fetch metadata')
    
    const metadata = await response.json()
    
    // Process image URL
    if (metadata.image && metadata.image.startsWith('ipfs://')) {
      metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    
    // Cache the result
    metadataCache.set(cacheKey, {
      data: metadata,
      timestamp: Date.now(),
    })
    
    return metadata
  } catch (error) {
    console.error('Error fetching NFT metadata:', error)
    return null
  }
}

/**
 * Calculate MON tickets for an NFT
 */
export function calculateTickets(floorPrice: bigint): number {
  const TICKET_PRICE = BigInt(1e15) // 0.001 MON per ticket
  return Number(floorPrice / TICKET_PRICE)
}

/**
 * Discover all user's eligible NFTs
 */
export async function discoverUserNFTs(userAddress: Address): Promise<UserNFT[]> {
  const userNFTs: UserNFT[] = []
  
  try {
    // Step 1: Get verified collections
    const collections = await getVerifiedCollections()
    console.log(`Found ${collections.length} verified collections`)
    
    // Step 2: Check user balances
    const balances = await checkUserBalances(userAddress, collections)
    
    // Step 3: For each collection with balance > 0, get token IDs
    for (const collection of collections) {
      const balance = balances.get(collection.address)
      if (!balance || balance === 0n) continue
      
      console.log(`User has ${balance} NFTs in ${collection.name}`)
      
      // Get token IDs
      const tokenIds = await getUserTokenIds(userAddress, collection.address, balance)
      
      // Step 4: For each token, create UserNFT object
      for (const tokenId of tokenIds) {
        // Fetch metadata (with fallback)
        const metadata = await fetchNFTMetadata(collection.address, tokenId)
        
        const userNFT: UserNFT = {
          collection: collection.address,
          collectionName: collection.name,
          tokenId,
          name: metadata?.name || `${collection.name} #${tokenId}`,
          image: metadata?.image || '/monad-logo.png', // Fallback to Monad logo
          description: metadata?.description,
          estimatedValue: calculateTickets(collection.price),
          floorPrice: collection.price,
          metadata,
        }
        
        userNFTs.push(userNFT)
      }
    }
    
    return userNFTs
  } catch (error) {
    console.error('Error discovering user NFTs:', error)
    return []
  }
}

/**
 * Check approval status for multiple collections
 */
export async function checkBatchApprovals(
  userAddress: Address,
  collections: Address[],
  spenderAddress: Address
): Promise<Map<Address, boolean>> {
  const approvalMap = new Map<Address, boolean>()
  
  try {
    const approvalCalls = collections.map(collection => ({
      address: collection,
      abi: ERC721_ABI,
      functionName: 'isApprovedForAll',
      args: [userAddress, spenderAddress],
    }))
    
    const results = await readContracts(config, {
      contracts: approvalCalls,
    })
    
    results.forEach((result, index) => {
      if (result.status === 'success') {
        approvalMap.set(collections[index], result.result as boolean)
      } else {
        approvalMap.set(collections[index], false)
      }
    })
  } catch (error) {
    console.error('Error checking approvals:', error)
    // Default to false for all
    collections.forEach(col => approvalMap.set(col, false))
  }
  
  return approvalMap
}
