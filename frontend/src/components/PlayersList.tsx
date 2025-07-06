import { useEffect, useState } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { CONTRACTS, NFT_ROULETTE_ABI } from '../config/contracts'
import './PlayersList.css'

interface PlayerData {
  address: string
  ticketStart: bigint
  ticketEnd: bigint
  tickets: number
}

interface PlayersListProps {
  refreshTrigger: number
}

export default function PlayersList({ refreshTrigger }: PlayersListProps) {
  const [players, setPlayers] = useState<PlayerData[]>([])
  
  const { data: playerAddresses, refetch } = useReadContract({
    address: CONTRACTS.nftRoulette as `0x${string}`,
    abi: NFT_ROULETTE_ABI,
    functionName: 'getPlayerAddresses',
  })
  
  // Prepare contract calls for all players
  const playerInfoCalls = playerAddresses?.map(addr => ({
    address: CONTRACTS.nftRoulette as `0x${string}`,
    abi: NFT_ROULETTE_ABI,
    functionName: 'getPlayerInfo',
    args: [addr],
  })) || []
  
  const { data: playerInfoResults } = useReadContracts({
    contracts: playerInfoCalls,
  })
  
  useEffect(() => {
    refetch()
  }, [refreshTrigger, refetch])
  
  useEffect(() => {
    if (!playerAddresses || !playerInfoResults) {
      setPlayers([])
      return
    }
    
    const playerData: PlayerData[] = []
    
    for (let i = 0; i < playerAddresses.length; i++) {
      const result = playerInfoResults[i]
      if (result.status === 'success' && result.result) {
        const [ticketStart, ticketEnd] = result.result as [bigint, bigint, any]
        const tickets = Number(ticketEnd - ticketStart)
        
        playerData.push({
          address: playerAddresses[i],
          ticketStart,
          ticketEnd,
          tickets,
        })
      }
    }
    
    setPlayers(playerData)
  }, [playerAddresses, playerInfoResults])
    
  return (
    <div className="players-list">
      <h3>Players ({players.length}/10)</h3>
      {players.length === 0 ? (
        <p className="no-players">No players yet</p>
      ) : (
        <div className="players">
          {players.map((player, index) => (
            <div key={player.address} className="player-item">
              <div className="player-rank">#{index + 1}</div>
              <div className="player-info">
                <span className="player-address">
                  {player.address.slice(0, 6)}...{player.address.slice(-4)}
                </span>
                <span className="player-tickets">
                  {player.tickets} tickets
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
