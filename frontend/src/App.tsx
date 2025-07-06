import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import { useState } from 'react'
import Header from './components/Header'
import GameDisplay from './components/GameDisplay'
import NFTDeposit from './components/NFTDeposit'
import PlayersList from './components/PlayersList'
import './App.css'

const queryClient = new QueryClient()

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="app">
          <Header />
          <main className="main-content">
            <div className="game-section">
              <GameDisplay refreshTrigger={refreshTrigger} />
              <NFTDeposit onDeposit={refreshData} />
            </div>
            <div className="players-section">
              <PlayersList refreshTrigger={refreshTrigger} />
            </div>
          </main>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
