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
  const segments = players.map((player, index) => {
    // Use a gradient of purples and golds for a luxury feel
    const hue = index % 2 === 0 ? 270 : 45 // Purple or Gold
    const saturation = 60 + (index % 3) * 10
    const lightness = 45 + (index % 2) * 10
    
    return {
      address: player.address,
      tickets: player.tickets,
      percentage: (player.tickets / totalTickets) * 100,
      color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      gradientColor: `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`
    }
  })
  
  useEffect(() => {
    if (gameState === GameState.DRAWING) {
      setIsSpinning(true)
      setShowWinner(false)
      
      // Spin for 7 seconds with easing
      const spins = 8 + Math.random() * 4 // 8-12 full rotations
      const finalRotation = spins * 360 + Math.random() * 360
      setRotation(finalRotation)
      
      // Show winner after spin
      setTimeout(() => {
        setIsSpinning(false)
        if (winner) {
          setShowWinner(true)
        }
      }, 7000)
    } else if (gameState === GameState.WAITING) {
      // Reset for new game
      setRotation(0)
      setShowWinner(false)
    }
  }, [gameState, winner])
  
  return (
    <div className="roulette-container-luxury">
      {gameState >= GameState.PREPARING && (
        <>
          <div className="roulette-stage">
            <div className="roulette-glow-ring"></div>
            <div className="roulette-outer-ring">
              <div className="roulette-pointer">
                <div className="pointer-base"></div>
                <div className="pointer-tip">▼</div>
              </div>
              
              <div className="roulette-inner-container">
                <div 
                  className={`roulette-wheel-luxury ${isSpinning ? 'spinning' : ''}`}
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <svg viewBox="0 0 400 400" className="wheel-svg">
                    <defs>
                      {segments.map((segment, index) => (
                        <radialGradient key={`gradient-${index}`} id={`gradient-${index}`}>
                          <stop offset="0%" stopColor={segment.gradientColor} />
                          <stop offset="100%" stopColor={segment.color} />
                        </radialGradient>
                      ))}
                      <filter id="shadow">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    
                    {/* Outer decorative ring */}
                    <circle cx="200" cy="200" r="195" fill="none" stroke="url(#gold-gradient)" strokeWidth="10" opacity="0.3" />
                    
                    {/* Main wheel segments */}
                    {segments.map((segment, index) => {
                      let startAngle = 0
                      for (let i = 0; i < index; i++) {
                        startAngle += (segments[i].tickets / totalTickets) * 360
                      }
                      const endAngle = startAngle + (segment.tickets / totalTickets) * 360
                      
                      const startRad = (startAngle * Math.PI) / 180
                      const endRad = (endAngle * Math.PI) / 180
                      
                      const x1 = 200 + 180 * Math.cos(startRad)
                      const y1 = 200 + 180 * Math.sin(startRad)
                      const x2 = 200 + 180 * Math.cos(endRad)
                      const y2 = 200 + 180 * Math.sin(endRad)
                      
                      const largeArc = endAngle - startAngle > 180 ? 1 : 0
                      
                      return (
                        <g key={segment.address}>
                          <path
                            d={`M 200 200 L ${x1} ${y1} A 180 180 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={`url(#gradient-${index})`}
                            stroke="rgba(255, 215, 0, 0.2)"
                            strokeWidth="2"
                            filter="url(#shadow)"
                            className="wheel-segment"
                          />
                          <text
                            x={200 + 120 * Math.cos((startRad + endRad) / 2)}
                            y={200 + 120 * Math.sin((startRad + endRad) / 2)}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize="20"
                            fontWeight="700"
                            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                          >
                            {segment.tickets}
                          </text>
                          <text
                            x={200 + 120 * Math.cos((startRad + endRad) / 2)}
                            y={200 + 120 * Math.sin((startRad + endRad) / 2) + 20}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="rgba(255,255,255,0.7)"
                            fontSize="12"
                          >
                            tickets
                          </text>
                        </g>
                      )
                    })}
                    
                    {/* Center hub */}
                    <circle cx="200" cy="200" r="70" fill="url(#hub-gradient)" stroke="var(--casino-gold)" strokeWidth="4" />
                    <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(255, 215, 0, 0.3)" strokeWidth="1" />
                    
                    <text x="200" y="190" textAnchor="middle" fill="var(--casino-gold)" fontSize="28" fontWeight="700" fontFamily="var(--font-accent)">
                      {totalTickets}
                    </text>
                    <text x="200" y="215" textAnchor="middle" fill="rgba(255, 255, 255, 0.8)" fontSize="14" fontFamily="var(--font-accent)">
                      TOTAL POT
                    </text>
                    
                    {/* Gradient definitions */}
                    <defs>
                      <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--casino-gold)" />
                        <stop offset="50%" stopColor="var(--casino-gold-light)" />
                        <stop offset="100%" stopColor="var(--casino-gold)" />
                      </linearGradient>
                      <radialGradient id="hub-gradient">
                        <stop offset="0%" stopColor="var(--monad-darker)" />
                        <stop offset="100%" stopColor="var(--casino-black)" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="roulette-decorations">
              <div className="decoration-dot"></div>
              <div className="decoration-dot"></div>
              <div className="decoration-dot"></div>
              <div className="decoration-dot"></div>
            </div>
          </div>
          
          {showWinner && winner && (
            <div className="winner-celebration">
              <div className="winner-backdrop"></div>
              <div className="winner-content">
                <div className="crown-animation">👑</div>
                <h2 className="winner-text-luxury">WINNER!</h2>
                <div className="winner-address-display">
                  <span className="address-prefix">Player</span>
                  <span className="address-value">
                    {winner.slice(0, 6)}...{winner.slice(-4)}
                  </span>
                </div>
                <div className="wins-text">Takes the Pot!</div>
              </div>
              <div className="luxury-confetti">
                {[...Array(30)].map((_, i) => (
                  <div 
                    key={i} 
                    className="confetti-piece-luxury"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${3 + Math.random() * 2}s`,
                      backgroundColor: i % 3 === 0 ? 'var(--casino-gold)' : i % 3 === 1 ? 'var(--monad-purple)' : 'var(--monad-green)'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {gameState < GameState.PREPARING && (
        <div className="pre-game-luxury">
          <div className="pot-preview-luxury">
            <div className="preview-header">
              <img 
                src="/monanimals/generated/Mokadal_fortune_teller.png" 
                alt="Fortune Teller" 
                className="preview-mascot"
              />
              <div className="preview-title-section">
                <h3 className="preview-title">Current Stakes</h3>
                <p className="preview-subtitle">Place your bets before the wheel spins</p>
              </div>
            </div>
            
            {players.length === 0 ? (
              <div className="empty-pot">
                <div className="empty-wheel">🎰</div>
                <p>No players yet - be the first!</p>
              </div>
            ) : (
              <div className="pot-visualization">
                {players.map((player, index) => {
                  const percentage = (player.tickets / totalTickets) * 100
                  const hue = index % 2 === 0 ? 270 : 45
                  
                  return (
                    <div key={player.address} className="pot-player-luxury">
                      <div className="player-info-row">
                        <span className="player-mini-address">
                          {player.address.slice(0, 6)}...{player.address.slice(-4)}
                        </span>
                        <span className="player-ticket-count">{player.tickets} tickets</span>
                        <span className="player-percentage">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="player-bar-container">
                        <div 
                          className="player-bar-luxury" 
                          style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, hsl(${hue}, 60%, 45%) 0%, hsl(${hue}, 60%, 55%) 100%)`,
                          }}
                        >
                          <div className="bar-shine"></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
