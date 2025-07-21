import { useState } from 'react'
import { useAccount } from 'wagmi'
import NFTGallery from './NFTGallery'
import BatchDepositModal from './BatchDepositModal' // Using main version
import { UserNFT } from '../services/nftDiscovery'
import './NFTDepositV2.css'
import './CharacterStyles.css'

interface NFTDepositV2Props {
  onDeposit: () => void
}

export default function NFTDepositV2({ onDeposit }: NFTDepositV2Props) {
  const { isConnected } = useAccount()
  const [selectedNFTs, setSelectedNFTs] = useState<UserNFT[]>([])
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [galleryRefreshTrigger, setGalleryRefreshTrigger] = useState(0)
  
  const handleNFTsSelected = (nfts: UserNFT[]) => {
    setSelectedNFTs(nfts)
    setShowDepositModal(true)
  }
  
  const handleDepositSuccess = () => {
    setSelectedNFTs([])
    setShowDepositModal(false)
    // Refresh the gallery to remove deposited NFTs
    setGalleryRefreshTrigger(prev => prev + 1)
    onDeposit() // Trigger parent refresh
  }
  
  if (!isConnected) {
    return (
      <div className="nft-deposit-v2">
        <div className="deposit-mascot">
          <img 
            src="/monanimals/generated/molandak_security.png" 
            alt="Security" 
            className="security-mascot character-image glow"
          />
        </div>
        <p className="connect-message">Connect your wallet to enter the game</p>
      </div>
    )
  }
  
  return (
    <div className="nft-deposit-v2">
      <div className="deposit-header">
        <div className="character-container">
          <img 
            src="/monanimals/generated/mouch_thecharm.png" 
            alt="Lucky Mouch" 
            className="mouch-charm character-image"
          />
        </div>
        <div className="deposit-title-section">
          <h3 className="deposit-title">Choose Your NFTs</h3>
          <p className="deposit-subtitle">Select up to 10 NFTs to place your bet</p>
        </div>
        <button 
          className="manual-toggle"
          onClick={() => setShowManualInput(!showManualInput)}
          title="Manual input"
        >
          ⚙️
        </button>
      </div>
      
      {showManualInput ? (
        <div className="manual-input-section">
          <p className="manual-notice">Manual NFT deposit is currently disabled. Please use the gallery below.</p>
          <button onClick={() => setShowManualInput(false)} className="back-to-gallery">
            Back to Gallery
          </button>
        </div>
      ) : (
        <NFTGallery 
          onDepositReady={handleNFTsSelected} 
          refreshTrigger={galleryRefreshTrigger}
        />
      )}
      
      <BatchDepositModal
        selectedNFTs={selectedNFTs}
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={handleDepositSuccess}
      />
    </div>
  )
}
