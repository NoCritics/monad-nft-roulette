import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import { useState } from 'react'
import Header from './components/Header'
import GameDisplay from './components/GameDisplay'
import NFTDepositV2 from './components/NFTDepositV2' // V2 Component
import PlayersList from './components/PlayersList'
import VideoBackdrop from './components/VideoBackdrop'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      staleTime: 30000, // 30 seconds before considering data stale
      gcTime: 300000, // 5 minutes cache time (renamed from cacheTime)
      retry: 1, // Only retry once on failure instead of default 3 times
      refetchOnMount: true, // Still refetch on component mount
      refetchOnReconnect: true, // Refetch when network reconnects
    }
  }
})

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <VideoBackdrop />
        <div className="app">
          <Header />
          
          {/* Decorative Casino Elements */}
          <div className="casino-chips">
            <div className="casino-chip"></div>
            <div className="casino-chip"></div>
            <div className="casino-chip"></div>
          </div>
          
          <div className="floating-cards">
            <div className="floating-card"></div>
            <div className="floating-card"></div>
            <div className="floating-card"></div>
          </div>
          
          <main className="main-content">
            <div className="game-section">
              <GameDisplay refreshTrigger={refreshTrigger} />
              <NFTDepositV2 onDeposit={refreshData} /> {/* V2 NFT Deposit with Gallery */}
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
