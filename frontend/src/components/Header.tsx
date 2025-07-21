import { useAccount, useConnect, useDisconnect } from 'wagmi'
import './Header.css'

export default function Header() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    const injected = connectors.find(c => c.id === 'injected')
    if (injected) {
      connect({ connector: injected })
    }
  }

  return (
    <header className="header">
      <div className="header-glow"></div>
      <div className="header-content">
        <div className="logo-section">
          <div className="logo-container">
            <img 
              src="/logo.png" 
              alt="Monad Casino" 
              className="logo-mascot"
            />
            <div className="logo-text">
              <h1 className="logo-title">Monad Casino</h1>
              <p className="logo-subtitle">
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
              </p>
            </div>
          </div>
        </div>
        
        <div className="header-center">
          <div className="casino-status">
            <div className="status-light"></div>
            <span className="status-text">LIVE TABLES</span>
          </div>
        </div>

        <div className="header-right">
          {isConnected ? (
            <div className="wallet-container">
              <div className="wallet-info">
                <div className="wallet-balance">
                  <span className="balance-label">Player ID</span>
                  <span className="address">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                <button onClick={() => disconnect()} className="disconnect-btn">
                  <span className="btn-text">Leave Casino</span>
                  <span className="btn-icon">🚪</span>
                </button>
              </div>
              <div className="vip-badge">
                <img 
                  src="/monanimals/generated/Mosferatu_VIP_manager.png" 
                  alt="VIP Status" 
                  className="vip-icon"
                />
              </div>
            </div>
          ) : (
            <button onClick={handleConnect} className="connect-btn premium-connect">
              <span className="btn-shine"></span>
              <span className="btn-text">Enter Casino</span>
              <span className="btn-icon">🎰</span>
            </button>
          )}
        </div>
      </div>
      <div className="header-border"></div>
    </header>
  )
}
