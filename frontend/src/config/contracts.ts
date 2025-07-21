import { CONTRACTS } from '../../../contracts.config'
export { CONTRACTS }

export const PRICE_ORACLE_ABI = [
  {
    inputs: [{ name: 'collection', type: 'address' }],
    name: 'getPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'collection', type: 'address' }],
    name: 'isVerified',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllCollections',
    outputs: [
      { name: 'addresses', type: 'address[]' },
      { name: 'prices', type: 'uint256[]' },
      { name: 'names', type: 'string[]' },
      { name: 'verified', type: 'bool[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCollectionCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// V1 ABI - Keep for GameDisplay compatibility
export const NFT_ROULETTE_ABI = [
  {
    inputs: [
      { name: 'collection', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'depositNFT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'gameState',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentGameState',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'gameStartTime',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'prepareStartTime',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalTickets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'playerCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'currentWinner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimWinnings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'getPlayerInfo',
    outputs: [
      { name: 'ticketStart', type: 'uint256' },
      { name: 'ticketEnd', type: 'uint256' },
      {
        name: 'deposits',
        type: 'tuple[]',
        components: [
          { name: 'collection', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentPotNFTs',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'collection', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPlayerAddresses',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ping',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// V2 ABI - includes all V1 functions plus new batch functions
export const NFT_ROULETTE_V2_ABI = [
  ...NFT_ROULETTE_ABI,
  {
    inputs: [
      { name: 'collections', type: 'address[]' },
      { name: 'tokenIds', type: 'uint256[]' },
    ],
    name: 'depositMultipleNFTs',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'collections', type: 'address[]' },
    ],
    name: 'checkBatchApprovals',
    outputs: [
      { name: 'approved', type: 'bool[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getVerifiedCollections',
    outputs: [
      { name: 'collections', type: 'address[]' },
      { name: 'prices', type: 'uint256[]' },
      { name: 'names', type: 'string[]' },
      { name: 'verified', type: 'bool[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'collection', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'calculateTickets',
    outputs: [
      { name: 'tickets', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGameStats',
    outputs: [
      { name: 'totalPotValue', type: 'uint256' },
      { name: 'nftCount', type: 'uint256' },
      { name: 'timeRemaining', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getVRFFee',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const ERC721_ABI = [
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export enum GameState {
  WAITING = 0,
  COUNTDOWN = 1,
  PREPARING = 2,
  DRAWING = 3,
  COMPLETE = 4,
}

// Use V2 contract as default
export const ACTIVE_NFT_ROULETTE_ADDRESS = CONTRACTS.nftRouletteV2
export const ACTIVE_NFT_ROULETTE_ABI = NFT_ROULETTE_V2_ABI
