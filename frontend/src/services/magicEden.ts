import axios from 'axios'

const MAGIC_EDEN_API = 'https://api-mainnet.magiceden.dev/v3/rtp/monad-testnet'

export interface CollectionData {
  id: string
  name: string
  floorPrice: number
  verified: boolean
}

export const magicEdenService = {
  async fetchCollections(limit = 100): Promise<CollectionData[]> {
    try {
      const response = await axios.get(`${MAGIC_EDEN_API}/collections/v7`, {
        params: {
          limit,
          sortBy: 'allTimeVolume',
          includeSecurityConfigs: false,
          normalizeRoyalties: false,
        },
        headers: {
          'Accept': '*/*',
          // Note: In production, add API key here
        },
      })
      
      return response.data.collections.map((col: any) => ({
        id: col.id,
        name: col.name,
        floorPrice: col.floorAsk?.price || 0,
        verified: col.magicedenVerificationStatus === 'verified',
      }))
    } catch (error) {
      console.error('Error fetching collections:', error)
      return []
    }
  },
}
