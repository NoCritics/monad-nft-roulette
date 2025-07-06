import { useEffect, useState } from 'react'
import { GameState } from '../config/contracts'
import './RouletteWheel.css'

interface RouletteWheelProps {
  gameState: number
  players: Array<{
    address: string
    tickets: number
  }>
  winner?: string
  totalTickets: number
}

export default function RouletteWheel({ gameState, players, winner, totalTickets }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [showWinner, setShowWinner] = useState(false)
  
  // Create segments for each player based on their tickets
  const segments = players.map((player, index) => ({
    address: player.address,
    tickets: player.tickets,
    percentage: (player.tickets / totalTickets) * 100,
    color: `hsl(${(index * 360) / players.length}, 70%, 50%)`
  }))
  
  useEffect(() => {
    if (gameState === GameState.DRAWING) {
      setIsSpinning(true)
      setShowWinner(false)
      
      // Spin for 5 seconds
      const spins = 5 + Math.random() * 5 // 5-10 full rotations
      const finalRotation = spins * 360 + Math.random() * 360
      setRotation(finalRotation)
      
      // Show winner after spin
      setTimeout(() => {
        setIsSpinning(false)
        if (winner) {
          setShowWinner(true)
        }
      }, 5000)
    }
  }, [gameState, winner])
  
  return (
    <div className="roulette-container">
      {gameState >= GameState.PREPARING && (
        <>
          <div className="roulette-wrapper">
            <div className="roulette-pointer">▼</div>
            <div 
              className={`roulette-wheel ${isSpinning ? 'spinning' : ''}`}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
                {segments.map((segment, index) => {
                  let startAngle = 0
                  for (let i = 0; i < index; i++) {
                    startAngle += (segments[i].tickets / totalTickets) * 360
                  }
                  const endAngle = startAngle + (segment.tickets / totalTickets) * 360
                  
                  const startRad = (startAngle * Math.PI) / 180
                  const endRad = (endAngle * Math.PI) / 180
                  
                  const x1 = 100 + 100 * Math.cos(startRad)
                  const y1 = 100 + 100 * Math.sin(startRad)
                  const x2 = 100 + 100 * Math.cos(endRad)
                  const y2 = 100 + 100 * Math.sin(endRad)
                  
                  const largeArc = endAngle - startAngle > 180 ? 1 : 0
                  
                  return (
                    <g key={segment.address}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={segment.color}
                        stroke="rgba(26, 26, 46, 0.5)"
                        strokeWidth="2"
                      />
                      <text
                        x={100 + 60 * Math.cos((startRad + endRad) / 2)}
                        y={100 + 60 * Math.sin((startRad + endRad) / 2)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="600"
                      >
                        {segment.tickets}
                      </text>
                    </g>
                  )
                })}
                <circle cx="100" cy="100" r="30" fill="var(--monad-darker)" stroke="var(--monad-accent)" strokeWidth="3" />
                <text x="100" y="95" textAnchor="middle" fill="var(--monad-accent)" fontSize="16" fontWeight="700">
                  {totalTickets}
                </text>
                <text x="100" y="110" textAnchor="middle" fill="var(--monad-accent)" fontSize="10">
                  TICKETS
                </text>
              </svg>
            </div>
          </div>
          
          {showWinner && winner && (
            <div className="winner-announcement">
              <div className="winner-text">🎉 WINNER! 🎉</div>
              <div className="winner-address">
                {winner.slice(0, 6)}...{winner.slice(-4)}
              </div>
              <div className="confetti">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="confetti-piece"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${3 + Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {gameState < GameState.PREPARING && (
        <div className="pre-game">
          <div className="pot-preview">
            <h3>Current Pot</h3>
            <div className="pot-grid">
              {players.map(player => (
                <div key={player.address} className="pot-player">
                  <div className="player-bar" style={{
                    width: `${(player.tickets / totalTickets) * 100}%`,
                    background: `hsl(${Math.random() * 360}, 70%, 50%)`
                  }} />
                  <span className="player-label">
                    {player.address.slice(0, 6)}... ({player.tickets})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
