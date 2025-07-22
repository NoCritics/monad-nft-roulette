import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { discoverUserNFTs, checkBatchApprovals, UserNFT } from '../services/nftDiscovery'
import { CONTRACTS } from '../config/contracts'
import './NFTGallery.css'
import './CharacterStyles.css'

interface NFTGalleryProps {
  onDepositReady: (selectedNFTs: UserNFT[]) => void
  refreshTrigger?: number
}

export default function NFTGallery({ onDepositReady, refreshTrigger }: NFTGalleryProps) {
  const { address: userAddress, isConnected } = useAccount()
  const [nfts, setNfts] = useState<UserNFT[]>([])
  const [selectedNFTs, setSelectedNFTs] = useState<UserNFT[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [approvals, setApprovals] = useState<Map<Address, boolean>>(new Map())
  
  // Load user NFTs when wallet connects or refresh triggered
  useEffect(() => {
    if (isConnected && userAddress) {
      loadUserNFTs()
    } else {
      setNfts([])
      setSelectedNFTs([])
    }
  }, [isConnected, userAddress, refreshTrigger])
  
  // Check approvals when selection changes - Optimized: only when NFTs selected
  useEffect(() => {
    if (selectedNFTs.length > 0 && userAddress) {
      checkApprovals()
    }
  }, [selectedNFTs, userAddress])
  
  const loadUserNFTs = async () => {
    if (!userAddress) return
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('Discovering NFTs for user:', userAddress)
      const userNFTs = await discoverUserNFTs(userAddress)
      console.log(`Found ${userNFTs.length} eligible NFTs`)
      setNfts(userNFTs)
      
      // Clear selected NFTs that are no longer available
      setSelectedNFTs(prev => 
        prev.filter(selected => 
          userNFTs.some(nft => 
            nft.collection === selected.collection && 
            nft.tokenId === selected.tokenId
          )
        )
      )
    } catch (err) {
      console.error('Error loading NFTs:', err)
      setError('Failed to load your NFTs. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const checkApprovals = async () => {
    if (!userAddress) return
    
    const uniqueCollections = Array.from(new Set(selectedNFTs.map(nft => nft.collection)))
    const approvalStatuses = await checkBatchApprovals(userAddress, uniqueCollections)
    
    const newApprovals = new Map<Address, boolean>()
    uniqueCollections.forEach((collection, index) => {
      newApprovals.set(collection, approvalStatuses[index])
    })
    setApprovals(newApprovals)
  }
  
  const toggleNFTSelection = (nft: UserNFT) => {
    setSelectedNFTs(prev => {
      const isSelected = prev.some(n => 
        n.collection === nft.collection && n.tokenId === nft.tokenId
      )
      
      if (isSelected) {
        return prev.filter(n => 
          !(n.collection === nft.collection && n.tokenId === nft.tokenId)
        )
      } else {
        if (prev.length >= 10) {
          alert('You can select up to 10 NFTs per deposit')
          return prev
        }
        return [...prev, nft]
      }
    })
  }
  
  const handleProceedToDeposit = () => {
    if (selectedNFTs.length === 0) return
    onDepositReady(selectedNFTs)
  }
  
  const handleSelectAll = () => {
    const maxSelection = nfts.slice(0, 10)
    setSelectedNFTs(maxSelection)
  }
  
  const handleDeselectAll = () => {
    setSelectedNFTs([])
  }
  
  const handleRefresh = () => {
    loadUserNFTs()
  }
  
  if (loading) {
    const loadingCharacters = [
      { src: '/monanimals/generated/Salmonad_dealer.png', name: 'Salmonad' },
      { src: '/monanimals/generated/molandak_security.png', name: 'Molandak' },
      { src: '/monanimals/generated/Mokadel_fortune_teller.png', name: 'Mokadel' },
    ]
    const randomCharacter = loadingCharacters[Math.floor(Math.random() * loadingCharacters.length)]
    
    return (
      <div className="nft-gallery loading">
        <div className="loading-content">
          <img 
            src={randomCharacter.src} 
            alt="Loading"
            className="loading-character character-image"
          />
          <div className="loading-text">Discovering your NFTs...</div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="nft-gallery error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error}</p>
          <button onClick={handleRefresh} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  if (nfts.length === 0) {
    return (
      <div className="nft-gallery empty">
        <div className="empty-content">
          <img 
            src="/monanimals/generated/Mokadel_fortune_teller.png" 
            alt="No NFTs"
            className="mokadel-fortune character-image"
          />
          <h4>No eligible NFTs found in your wallet</h4>
          <p>Only NFTs from verified collections can be deposited</p>
          <button onClick={handleRefresh} className="refresh-button-subtle">
            Check Again
          </button>
        </div>
      </div>
    )
  }
  
  const totalSelectedTickets = selectedNFTs.reduce((sum, nft) => sum + nft.estimatedValue, 0)
  
  return (
    <div className="nft-gallery">
      <div className="gallery-header">
        <h4>Your Eligible NFTs</h4>
        <div className="gallery-actions">
          <button onClick={handleDeselectAll} className="action-button deselect">
            DESELECT ALL
          </button>
          <button onClick={handleRefresh} className="action-button refresh">
            🔄
          </button>
        </div>
      </div>
      
      {selectedNFTs.length > 0 && (
        <div className="selection-summary">
          <div className="summary-info">
            <span className="selected-count">{selectedNFTs.length} NFTs selected</span>
            <span className="total-tickets gold">{totalSelectedTickets} MON tickets</span>
          </div>
          <button 
            onClick={handleProceedToDeposit} 
            className="proceed-button"
          >
            PROCEED TO DEPOSIT
          </button>
        </div>
      )}
      
      <div className="nfts-grid">
        {nfts.map((nft) => {
          const isSelected = selectedNFTs.some(n => 
            n.collection === nft.collection && n.tokenId === nft.tokenId
          )
          const collectionApproved = approvals.get(nft.collection)
          
          return (
            <div 
              key={`${nft.collection}-${nft.tokenId}`} 
              className={`nft-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleNFTSelection(nft)}
            >
              <div className="nft-image-wrapper">
                <img 
                  src={nft.image} 
                  alt={nft.name}
                  className="nft-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/monanimals/generated/monad_logo_fallback.png'
                  }}
                />
                {isSelected && (
                  <div className="selected-overlay">
                    <div className="selected-check">✓</div>
                  </div>
                )}
              </div>
              
              <div className="nft-info">
                <h5 className="nft-name">{nft.name}</h5>
                <p className="nft-collection-name">{nft.collectionName}</p>
                <div className="nft-value">
                  <span className="ticket-value">{nft.estimatedValue} MON tickets</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {nfts.length > 10 && (
        <div className="gallery-footer">
          <p className="limit-notice">Select up to 10 NFTs per deposit</p>
        </div>
      )}
    </div>
  )
}
