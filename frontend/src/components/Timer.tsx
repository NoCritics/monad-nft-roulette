import { useEffect, useState } from 'react'
import { GameState } from '../config/contracts'
import './Timer.css'

interface TimerProps {
  gameState: number
  gameStartTime: number
  prepareStartTime?: number
}

export default function Timer({ gameState, gameStartTime, prepareStartTime }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [message, setMessage] = useState('')
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      
      switch (gameState) {
        case GameState.WAITING:
          setMessage('Waiting for players to join...')
          setTimeLeft(0)
          break
          
        case GameState.COUNTDOWN:
          const countdownEnd = gameStartTime + 180 // 3 minutes
          const remaining = countdownEnd - now
          if (remaining > 0) {
            setTimeLeft(remaining)
            setMessage('Game starting in')
          } else {
            setTimeLeft(0)
            setMessage('Preparing draw...')
          }
          break
          
        case GameState.PREPARING:
          if (prepareStartTime) {
            const prepareEnd = prepareStartTime + 10 // 10 seconds
            const prepRemaining = prepareEnd - now
            if (prepRemaining > 0) {
              setTimeLeft(prepRemaining)
              setMessage('🎰 ROULETTE STARTING IN')
            } else {
              setTimeLeft(0)
              setMessage('Drawing winner...')
            }
          }
          break
          
        case GameState.DRAWING:
          setMessage('🔥 SPINNING THE WHEEL!')
          setTimeLeft(0)
          break
          
        case GameState.COMPLETE:
          setMessage('🎉 WINNER SELECTED!')
          setTimeLeft(0)
          break
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [gameState, gameStartTime, prepareStartTime])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className={`timer-container ${gameState === GameState.DRAWING ? 'spinning' : ''}`}>
      <div className="timer-message">{message}</div>
      {timeLeft > 0 && (
        <div className={`timer-display ${timeLeft <= 10 ? 'urgent' : ''}`}>
          {formatTime(timeLeft)}
        </div>
      )}
      {gameState === GameState.WAITING && (
        <div className="waiting-pulse">
          <div className="pulse"></div>
          <div className="pulse"></div>
          <div className="pulse"></div>
        </div>
      )}
    </div>
  )
}
