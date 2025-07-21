import { useEffect, useState } from 'react'
import { useReadContract, useWriteContract, useReadContracts, useAccount } from 'wagmi'
import { CONTRACTS, NFT_ROULETTE_V2_ABI, GameState } from '../config/contracts'
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
  const [isClaiming, setIsClaiming] = useState(false)
  
  const { address: userAddress } = useAccount()
  const { writeContract } = useWriteContract()

  // Read game state - Using V2 contract
  const { data: gameState, refetch: refetchGameState } = useReadContract({
    address: CONTRACTS.nftRouletteV2 as `0x${string}`,
    abi: NFT_ROULETTE_V2_ABI,
    functionName: 'gameState',
  })
  
  const { data: gameStartTime } = useReadContract({
    address: CONTRACTS.nftRouletteV2 as `0x${string}`,
    abi: NFT_ROULETTE_V2_ABI,
    functionName: 'gameStartTime',
  })
  
  const { data: prepareStartTime } = useReadContract({
    address: CONTRACTS.nftRouletteV2 as `0x${string}`,
    abi: NFT_ROULETTE_V2_ABI,
    functionName: 'prepareStartTime',
  })
  
  const { data: totalTickets } = useReadContract({
    address: CONTRACTS.nftRouletteV2 as `0x${string}`,
    abi: NFT_ROULETTE_V2_ABI,
    functionName: 'totalTickets',
  })
  
  const { data: playerCount } = useReadContract({
    address: CONTRACTS.nftRouletteV2 as `0x${string}`,
    abi: NFT_ROULETTE_V2_ABI,
    functionName: 'playerCount',
  })
  
  const { data: currentWinner, refetch: refetchWinner } = useReadContract({
    address: CONTRACTS.nftRouletteV2 as `0x${string}`,
    abi: NFT_ROULETTE_V2_ABI,
    functionName: 'currentWinner',
  })
  
  const { data: playerAddresses } = useReadContract({
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
  
  // Poll for winner when game is complete
  useEffect(() => {
    if (Number(gameState) === GameState.COMPLETE) {
      // Start polling for the actual winner
      const winnerPollInterval = setInterval(async () => {
        const result = await refetchWinner()
        // Stop polling once we have a non-zero winner
        if (result.data && result.data !== '0x0000000000000000000000000000000000000000') {
          clearInterval(winnerPollInterval)
        }
      }, 1000) // Poll every second
      
      // Cleanup
      return () => clearInterval(winnerPollInterval)
    }
  }, [gameState, refetchWinner])
  
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
        address: CONTRACTS.nftRouletteV2 as `0x${string}`,
        abi: NFT_ROULETTE_V2_ABI,
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

  // Get monanimal mascot based on game state
  const getMascot = () => {
    switch (Number(gameState)) {
      case GameState.WAITING:
        return { img: '/monanimals/generated/Salmonad_dealer.png', name: 'Salmonad the Dealer' }
      case GameState.COUNTDOWN:
        return { img: '/monanimals/generated/mouch_thecharm.png', name: 'Mouch the Lucky Charm' }
      case GameState.PREPARING:
        return { img: '/monanimals/generated/Mokadal_fortune_teller.png', name: 'Mokadal the Fortune Teller' }
      case GameState.DRAWING:
        return { img: '/monanimals/generated/Chog_high_roller.png', name: 'Chog the High Roller' }
      case GameState.COMPLETE:
        return { img: '/monanimals/generated/Mosferatu_VIP_manager.png', name: 'Mosferatu the VIP Manager' }
      default:
        return { img: '/monanimals/generated/Salmonad_dealer.png', name: 'Salmonad the Dealer' }
    }
  }

  const mascot = getMascot()
  
  return (
    <div className="game-display-luxury">
      {showNotification && (
        <div className="game-notification-luxury">
          <div className="notification-shine"></div>
          {notificationMessage}
        </div>
      )}
      
      <div className="game-header">
        <div className="game-mascot-container">
          <img src={mascot.img} alt={mascot.name} className="game-mascot" />
          <div className="mascot-speech-bubble">
            <p className="mascot-message">
              {Number(gameState) === GameState.WAITING && "Welcome to Monad Casino! Join the game!"}
              {Number(gameState) === GameState.COUNTDOWN && "Place your bets! Time is ticking!"}
              {Number(gameState) === GameState.PREPARING && "No more bets! Wheel is about to spin!"}
              {Number(gameState) === GameState.DRAWING && "Round and round it goes!"}
              {Number(gameState) === GameState.COMPLETE && "We have a winner!"}
            </p>
          </div>
        </div>
        <div className="game-title-section">
          <h2 className="game-title">
            <span className="letter">N</span>
            <span className="letter">F</span>
            <span className="letter">T</span>
            <span className="letter"> </span>
            <span className="letter">R</span>
            <span className="letter">o</span>
            <span className="letter">u</span>
            <span className="letter">l</span>
            <span className="letter">e</span>
            <span className="letter">t</span>
            <span className="letter">t</span>
            <span className="letter">e</span>
            <span className="letter"> </span>
            <span className="letter">T</span>
            <span className="letter">a</span>
            <span className="letter">b</span>
            <span className="letter">l</span>
            <span className="letter">e</span>
          </h2>
          <p className="game-subtitle">Where fortune favors the bold</p>
        </div>
      </div>

      <div className="timer-container">
        <Timer 
          gameState={Number(gameState) || 0} 
          gameStartTime={Number(gameStartTime) || 0}
          prepareStartTime={Number(prepareStartTime) || 0}
        />
      </div>
      
      <div className="roulette-section">
        <div className="roulette-glow"></div>
        <RouletteWheel
          gameState={Number(gameState) || 0}
          players={players}
          winner={currentWinner}
          totalTickets={Number(totalTickets) || 0}
        />
      </div>
      
      <div className="game-stats-luxury">
        <div className="stat-card-luxury">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-label">Players at Table</span>
            <span className="stat-value">{playerCount?.toString() || '0'}<span className="stat-max">/10</span></span>
          </div>
          <div className="stat-card-shine"></div>
        </div>
        
        <div className="stat-card-luxury golden">
          <div className="stat-icon">🎰</div>
          <div className="stat-content">
            <span className="stat-label">Total Pot</span>
            <span className="stat-value gold-text">{totalTickets?.toString() || '0'}<span className="stat-unit">MON tickets</span></span>
          </div>
          <div className="stat-card-shine"></div>
        </div>
        
        <div className="stat-card-luxury">
          <div className="stat-icon">🎲</div>
          <div className="stat-content">
            <span className="stat-label">Your Odds</span>
            <span className="stat-value">
              {userAddress && players.find(p => p.address.toLowerCase() === userAddress.toLowerCase()) ? 
                <span className="odds-value">
                  {((players.find(p => p.address.toLowerCase() === userAddress.toLowerCase())?.tickets || 0) / Number(totalTickets) * 100).toFixed(1)}%
                </span> : 
                <span className="not-playing">Not Playing</span>
              }
            </span>
          </div>
          <div className="stat-card-shine"></div>
        </div>
      </div>
      
      {Number(gameState) === GameState.COMPLETE && currentWinner && (
        <div className="winner-section-luxury">
          <div className="winner-spotlight"></div>
          {currentWinner === '0x0000000000000000000000000000000000000000' ? (
            <p className="waiting-winner">Drawing winner...</p>
          ) : (
            <>
              <div className="winner-announcement-luxury">
                <div className="crown-icon">👑</div>
                <h3 className="winner-title">WINNER</h3>
                <p className="winner-address-luxury">
                  {currentWinner.slice(0, 6)}...{currentWinner.slice(-4)}
                </p>
              </div>
              
              {userAddress && userAddress.toLowerCase() === currentWinner.toLowerCase() ? (
                <div className="winner-actions-luxury">
                  <div className="confetti-container">
                    <div className="confetti"></div>
                    <div className="confetti"></div>
                    <div className="confetti"></div>
                  </div>
                  <p className="winner-message-luxury">🎊 Congratulations! The pot is yours!</p>
                  <button 
                    className="claim-button-luxury"
                    onClick={handleClaimWinnings}
                    disabled={isClaiming}
                  >
                    <span className="button-shine"></span>
                    <span className="button-text">
                      {isClaiming ? 'Claiming...' : 'Collect Winnings'}
                    </span>
                    <span className="button-icon">💰</span>
                  </button>
                </div>
              ) : (
                <p className="non-winner-message-luxury">
                  The house always has another game...
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
