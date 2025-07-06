import { useEffect, useState } from 'react'
import { useReadContract, useWriteContract, useReadContracts, useAccount } from 'wagmi'
import { CONTRACTS, NFT_ROULETTE_ABI, GameState } from '../config/contracts'
import Timer from './Timer'
import RouletteWheel from './RouletteWheel'
import './GameDisplay.css'

interface GameDisplayProps {
  refreshTrigger: number
}

export default function GameDisplay({ refreshTrigger }: GameDisplayProps) {
  const [players, setPlayers] = useState<Array<{address: string, tickets: number}>>([])
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [effectiveGameState, setEffectiveGameState] = useState(0)
  const [isClaiming, setIsClaiming] = useState(false)
  
  const { address: userAddress } = useAccount()
  const { writeContract } = useWriteContract()
  // Read game state
  const { data: gameState, refetch: refetchGameState } = useReadContract({
    address: CONTRACTS.nftRoulette as `0x${string}`,
    abi: NFT_ROULETTE_ABI,
    functionName: 'gameState',
  })
  
  const { data: gameStartTime } = useReadContract({
    address: CONTRACTS.nftRoulette as `0x${string}`,
    abi: NFT_ROULETTE_ABI,
    functionName: 'gameStartTime',
  })
  
  const { data: prepareStartTime } = useReadContract({
    address: CONTRACTS.nftRoulette as `0x${string}`,
    abi: NFT_ROULETTE_ABI,
    functionName: 'prepareStartTime',
  })
  
  const { data: totalTickets } = useReadContract({
    address: CONTRACTS.nftRoulette as `0x${string}`,
    abi: NFT_ROULETTE_ABI,
    functionName: 'totalTickets',
  })
  
  const { data: playerCount } = useReadContract({
    address: CONTRACTS.nftRoulette as `0x${string}`,
    abi: NFT_ROULETTE_ABI,
    functionName: 'playerCount',
  })
  
  const { data: currentWinner } = useReadContract({
    address: CONTRACTS.nftRoulette as `0x${string}`,
    abi: NFT_ROULETTE_ABI,
    functionName: 'currentWinner',
  })
  
  const { data: playerAddresses } = useReadContract({
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
  
  // Update players data
  useEffect(() => {
    if (!playerAddresses || !playerInfoResults) {
      setPlayers([])
      return
    }
    
    const playerData: Array<{address: string, tickets: number}> = []
    
    for (let i = 0; i < playerAddresses.length; i++) {
      const result = playerInfoResults[i]
      if (result.status === 'success' && result.result) {
        const [ticketStart, ticketEnd] = result.result as [bigint, bigint, any]
        const tickets = Number(ticketEnd - ticketStart)
        
        playerData.push({
          address: playerAddresses[i],
          tickets,
        })
      }
    }
    
    setPlayers(playerData)
  }, [playerAddresses, playerInfoResults])
  
  // Watch for game state changes
  useEffect(() => {
    let prevState = Number(gameState)
    const interval = setInterval(async () => {
      await refetchGameState()
      const newState = Number(gameState)
      
      if (newState !== prevState && newState !== undefined) {
        prevState = newState
        // Show notification for state changes
        switch (newState) {
          case GameState.COUNTDOWN:
            showGameNotification('🎮 Game Starting! 3 minutes countdown begins!')
            break
          case GameState.PREPARING:
            showGameNotification('🎰 Get Ready! Roulette starting in 10 seconds!')
            break
          case GameState.DRAWING:
            showGameNotification('🔥 SPINNING THE WHEEL!')
            break
          case GameState.COMPLETE:
            showGameNotification('🎉 We have a WINNER!')
            break
        }
      }
    }, 2000) // Check every 2 seconds for state updates
    
    return () => clearInterval(interval)
  }, [gameState, refetchGameState])
  
  // Refresh on trigger
  useEffect(() => {
    refetchGameState()
  }, [refreshTrigger, refetchGameState])
  
  const showGameNotification = (message: string) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 5000)
  }
  
  const handleClaimWinnings = async () => {
    if (!userAddress || !currentWinner || userAddress.toLowerCase() !== currentWinner.toLowerCase()) {
      showGameNotification('❌ You are not the winner!')
      return
    }
    
    try {
      setIsClaiming(true)
      showGameNotification('📝 Claiming your winnings...')
      
      await writeContract({
        address: CONTRACTS.nftRoulette as `0x${string}`,
        abi: NFT_ROULETTE_ABI,
        functionName: 'claimWinnings',
      })
      
      showGameNotification('🎉 Winnings claimed successfully!')
      // Refresh game state after claim
      setTimeout(() => refetchGameState(), 3000)
    } catch (error) {
      console.error('Error claiming winnings:', error)
      showGameNotification('❌ Failed to claim winnings. Please try again.')
    } finally {
      setIsClaiming(false)
    }
  }
  
  return (
    <div className="game-display-enhanced">
      {showNotification && (
        <div className="game-notification">
          {notificationMessage}
        </div>
      )}
      
      <Timer 
        gameState={Number(gameState) || 0} 
        gameStartTime={Number(gameStartTime) || 0}
        prepareStartTime={Number(prepareStartTime) || 0}
      />
      
      <RouletteWheel
        gameState={Number(gameState) || 0}
        players={players}
        winner={currentWinner}
        totalTickets={Number(totalTickets) || 0}
      />
      
      <div className="game-stats">
        <div className="stat-card">
          <span className="stat-label">Players</span>
          <span className="stat-value">{playerCount?.toString() || '0'}/10</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Pot</span>
          <span className="stat-value">{totalTickets?.toString() || '0'} tickets</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Your Chances</span>
          <span className="stat-value">
            {userAddress && players.find(p => p.address.toLowerCase() === userAddress.toLowerCase()) ? 
              `${((players.find(p => p.address.toLowerCase() === userAddress.toLowerCase())?.tickets || 0) / Number(totalTickets) * 100).toFixed(1)}%` : 
              'Not playing'}
          </span>
        </div>
      </div>
      
      {Number(gameState) === GameState.COMPLETE && currentWinner && (
        <div className="game-complete-actions">
          {currentWinner === '0x0000000000000000000000000000000000000000' ? (
            <p>Waiting for winner selection...</p>
          ) : (
            <>
              <p className="winner-announcement">
                🏆 Winner: {currentWinner.slice(0, 6)}...{currentWinner.slice(-4)}
              </p>
              {userAddress && userAddress.toLowerCase() === currentWinner.toLowerCase() ? (
                <div className="winner-actions">
                  <p className="winner-message">🎉 Congratulations! You won!</p>
                  <button 
                    className="claim-button"
                    onClick={handleClaimWinnings}
                    disabled={isClaiming}
                  >
                    {isClaiming ? 'Claiming...' : 'Claim Winnings'}
                  </button>
                </div>
              ) : (
                <p className="non-winner-message">Better luck next time!</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
