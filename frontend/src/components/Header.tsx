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
      <div className="header-content">
        <h1 className="logo">NFT Roulette</h1>
        <div className="header-right">
          {isConnected ? (
            <div className="wallet-info">
              <span className="address">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button onClick={() => disconnect()} className="disconnect-btn">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={handleConnect} className="connect-btn">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
