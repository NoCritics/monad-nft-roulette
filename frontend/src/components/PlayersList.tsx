import { useEffect, useState } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { CONTRACTS, NFT_ROULETTE_V2_ABI } from '../config/contracts'
import './PlayersList.css'
import './CharacterStyles.css'

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
    address: CONTRACTS.nftRouletteV2 as `0x${string}`,
    abi: NFT_ROULETTE_V2_ABI,
    functionName: 'getPlayerAddresses',
  })
  
  // Prepare contract calls for all players
  const playerInfoCalls = playerAddresses?.map(addr => ({
    address: CONTRACTS.nftRouletteV2 as `0x${string}`,
    abi: NFT_ROULETTE_V2_ABI,
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
    
    // Sort by ticket count (descending)
    playerData.sort((a, b) => b.tickets - a.tickets)
    
    setPlayers(playerData)
  }, [playerAddresses, playerInfoResults])
  
  if (players.length === 0) {
    return (
      <div className="players-list-luxury">
        {/* Mosferatu backdrop video */}
        <video 
          className="video-backdrop"
          autoPlay 
          loop 
          muted 
          playsInline
          poster="/monanimals/generated/Mosferatu_VIP_manager.png"
        >
          <source src="/mon_vids/Mosferatu__the_VIP_handler_2.mp4" type="video/mp4" />
        </video>
        
        {/* Mosferatu full backdrop image */}
        <img 
          src="/monanimals/generated/Mosferatu_VIP_manager.png" 
          alt=""
          className="mosferatu-backdrop"
        />
        
        <div className="vip-content-overlay">
          <div className="vip-header-elegant">
            <h3 className="vip-title">VIP Lounge</h3>
            <p className="vip-subtitle">Waiting for high rollers...</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="players-list-luxury">
      {/* Mosferatu backdrop video */}
      <video 
        className="video-backdrop"
        autoPlay 
        loop 
        muted 
        playsInline
        poster="/monanimals/generated/Mosferatu_VIP_manager.png"
      >
        <source src="/mon_vids/Mosferatu__the_VIP_handler_2.mp4" type="video/mp4" />
      </video>
      
      {/* Mosferatu full backdrop image */}
      <img 
        src="/monanimals/generated/Mosferatu_VIP_manager.png" 
        alt=""
        className="mosferatu-backdrop"
      />
      
      <div className="vip-content-overlay">
        <div className="vip-header-elegant">
          <h3 className="vip-title">VIP Lounge</h3>
          <p className="vip-subtitle">{players.length} Players at the Table</p>
        </div>
        
        <div className="players-container-elegant">
          {players.map((player, index) => (
            <div key={player.address} className={`player-card-luxury ${index === 0 ? 'top-player' : ''}`}>
              {index === 0 && <div className="crown-badge">👑</div>}
              
              <div className="player-rank">
                <span className="rank-number">#{index + 1}</span>
              </div>
              
              <div className="player-info">
                <div className="player-address">
                  <span className="address-text">
                    {player.address.slice(0, 6)}...{player.address.slice(-4)}
                  </span>
                </div>
                
                <div className="player-stats">
                  <div className="ticket-info">
                    <span className="ticket-count">{player.tickets}</span>
                    <span className="ticket-label">tickets</span>
                  </div>
                  
                  <div className="ticket-range">
                    <span className="range-label">Range:</span>
                    <span className="range-value">
                      {player.ticketStart.toString()}-{(player.ticketEnd - 1n).toString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="player-glow"></div>
              {index === 0 && <div className="top-player-shine"></div>}
            </div>
          ))}
        </div>
        
        <div className="vip-footer">
          <div className="total-info">
            <span className="total-label">Total Players:</span>
            <span className="total-value">{players.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
