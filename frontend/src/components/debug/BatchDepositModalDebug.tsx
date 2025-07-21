import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address } from 'viem'
import { UserNFT } from '../../services/nftDiscovery'
import { CONTRACTS, NFT_ROULETTE_V2_ABI, ERC721_ABI } from '../../config/contracts'
import '../BatchDepositModal.css'

interface BatchDepositModalProps {
  selectedNFTs: UserNFT[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type DepositStep = 'review' | 'approvals' | 'deposit' | 'complete'

interface ApprovalStatus {
  collection: Address
  name: string
  approved: boolean
  pending: boolean
  error?: string
}

export default function BatchDepositModalDebug({ 
  selectedNFTs, 
  isOpen, 
  onClose, 
  onSuccess 
}: BatchDepositModalProps) {
  const { address: userAddress } = useAccount()
  const [currentStep, setCurrentStep] = useState<DepositStep>('review')
  const [approvalStatuses, setApprovalStatuses] = useState<ApprovalStatus[]>([])
  const [currentApprovalIndex, setCurrentApprovalIndex] = useState(0)
  const [depositTxHash, setDepositTxHash] = useState<`0x${string}` | undefined>()
  const [debugLog, setDebugLog] = useState<string[]>([])
  
  const { writeContract, data: txHash, error: writeError, isError, isPending } = useWriteContract()
  const { isLoading: isWaitingTx, isSuccess: txSuccess, error: waitError } = useWaitForTransactionReceipt({
    hash: txHash,
  })
  
  // Debug logging
  const addDebugLog = (message: string) => {
    console.log('[BatchDeposit Debug]', message)
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }
  
  // Get unique collections that need approval
  const uniqueCollections = Array.from(
    new Map(selectedNFTs.map(nft => [nft.collection, nft.collectionName])).entries()
  ).map(([address, name]) => ({ address, name }))
  
  // Log errors
  useEffect(() => {
    if (writeError) {
      addDebugLog(`Write error: ${writeError.message}`)
      console.error('Full write error:', writeError)
    }
    if (waitError) {
      addDebugLog(`Wait error: ${waitError.message}`)
      console.error('Full wait error:', waitError)
    }
  }, [writeError, waitError])
  
  // Initialize approval statuses
  useEffect(() => {
    if (isOpen && currentStep === 'review') {
      addDebugLog('Initializing approval statuses')
      const statuses: ApprovalStatus[] = uniqueCollections.map(col => ({
        collection: col.address,
        name: col.name,
        approved: false,
        pending: false,
      }))
      setApprovalStatuses(statuses)
      addDebugLog(`Found ${uniqueCollections.length} collections to approve`)
    }
  }, [isOpen, currentStep, selectedNFTs])
  
  // Handle transaction success
  useEffect(() => {
    if (txSuccess && currentStep === 'approvals') {
      addDebugLog(`Approval success for collection ${currentApprovalIndex}`)
      // Mark current approval as complete
      setApprovalStatuses(prev => prev.map((status, index) => 
        index === currentApprovalIndex 
          ? { ...status, approved: true, pending: false }
          : status
      ))
      
      // Move to next approval or deposit step
      if (currentApprovalIndex < uniqueCollections.length - 1) {
        addDebugLog('Moving to next approval')
        setCurrentApprovalIndex(prev => prev + 1)
      } else {
        addDebugLog('All approvals done, moving to deposit')
        setCurrentStep('deposit')
      }
    } else if (txSuccess && currentStep === 'deposit') {
      addDebugLog('Deposit successful!')
      setCurrentStep('complete')
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 3000)
    }
  }, [txSuccess, currentStep, currentApprovalIndex, uniqueCollections.length])
  
  const handleClose = () => {
    setCurrentStep('review')
    setApprovalStatuses([])
    setCurrentApprovalIndex(0)
    setDepositTxHash(undefined)
    setDebugLog([])
    onClose()
  }
  
  const getTotalTickets = () => {
    return selectedNFTs.reduce((sum, nft) => sum + nft.estimatedValue, 0)
  }
  
  const handleStartApprovals = async () => {
    addDebugLog('Starting approval process')
    setCurrentStep('approvals')
    setCurrentApprovalIndex(0)
  }
  
  const handleApproveCollection = async (collection: Address) => {
    try {
      addDebugLog(`Attempting to approve collection: ${collection}`)
      addDebugLog(`Contract address: ${CONTRACTS.nftRouletteV2}`)
      addDebugLog(`User address: ${userAddress}`)
      
      setApprovalStatuses(prev => prev.map((status) => 
        status.collection === collection 
          ? { ...status, pending: true }
          : status
      ))
      
      await writeContract({
        address: collection,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [CONTRACTS.nftRouletteV2 as Address, true],
      })
      
      addDebugLog(`Approval transaction submitted for ${collection}`)
    } catch (error: any) {
      addDebugLog(`Approval error: ${error?.message || 'Unknown error'}`)
      console.error('Full approval error:', error)
      setApprovalStatuses(prev => prev.map((status) => 
        status.collection === collection 
          ? { ...status, pending: false, error: error?.message || 'Failed to approve' }
          : status
      ))
    }
  }
  
  const handleDeposit = async () => {
    try {
      addDebugLog('Starting batch deposit')
      const collections = selectedNFTs.map(nft => nft.collection)
      const tokenIds = selectedNFTs.map(nft => BigInt(nft.tokenId))
      
      addDebugLog(`Depositing ${collections.length} NFTs`)
      
      await writeContract({
        address: CONTRACTS.nftRouletteV2 as Address,
        abi: NFT_ROULETTE_V2_ABI,
        functionName: 'depositMultipleNFTs',
        args: [collections, tokenIds],
      })
      
      if (txHash) {
        setDepositTxHash(txHash)
        addDebugLog(`Deposit tx hash: ${txHash}`)
      }
    } catch (error: any) {
      addDebugLog(`Deposit error: ${error?.message || 'Unknown error'}`)
      console.error('Deposit error:', error)
    }
  }
  
  // Auto-trigger approvals with better logging
  useEffect(() => {
    if (currentStep === 'approvals' && !isWaitingTx && !isPending) {
      const currentApproval = approvalStatuses[currentApprovalIndex]
      if (currentApproval && !currentApproval.approved && !currentApproval.pending) {
        addDebugLog(`Auto-triggering approval for ${currentApproval.name} (${currentApproval.collection})`)
        handleApproveCollection(currentApproval.collection)
      }
    }
  }, [currentStep, currentApprovalIndex, approvalStatuses, isWaitingTx, isPending])
  
  // Auto-trigger deposit
  useEffect(() => {
    if (currentStep === 'deposit' && !depositTxHash && !isWaitingTx && !isPending) {
      addDebugLog('Auto-triggering deposit')
      handleDeposit()
    }
  }, [currentStep, depositTxHash, isWaitingTx, isPending])
  
  if (!isOpen) return null
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="batch-deposit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Deposit {selectedNFTs.length} NFTs (DEBUG MODE)</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        {/* Debug Panel */}
        <div style={{ 
          background: '#1a1a1a', 
          border: '1px solid #333', 
          padding: '10px', 
          margin: '10px',
          maxHeight: '150px',
          overflowY: 'auto',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <strong>Debug Log:</strong>
          {debugLog.map((log, i) => (
            <div key={i} style={{ color: '#00ff00' }}>{log}</div>
          ))}
          {writeError && (
            <div style={{ color: '#ff0000' }}>Error: {writeError.message}</div>
          )}
          <div>Contract V2: {CONTRACTS.nftRouletteV2}</div>
          <div>User: {userAddress}</div>
          <div>Is Pending: {isPending ? 'Yes' : 'No'}</div>
          <div>Is Waiting TX: {isWaitingTx ? 'Yes' : 'No'}</div>
        </div>
        
        <div className="progress-indicator">
          <div className={`progress-step ${currentStep === 'review' ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Review</span>
          </div>
          <div className={`progress-line ${currentStep !== 'review' ? 'complete' : ''}`}></div>
          <div className={`progress-step ${currentStep === 'approvals' ? 'active' : ''} ${['deposit', 'complete'].includes(currentStep) ? 'complete' : ''}`}>
            <div className="step-number">2</div>
            <span>Approve</span>
          </div>
          <div className={`progress-line ${['deposit', 'complete'].includes(currentStep) ? 'complete' : ''}`}></div>
          <div className={`progress-step ${currentStep === 'deposit' ? 'active' : ''} ${currentStep === 'complete' ? 'complete' : ''}`}>
            <div className="step-number">3</div>
            <span>Deposit</span>
          </div>
        </div>
        
        <div className="modal-body">
          {currentStep === 'review' && (
            <div className="review-step">
              <div className="review-summary">
                <div className="summary-stat">
                  <span className="stat-label">Total NFTs</span>
                  <span className="stat-value">{selectedNFTs.length}</span>
                </div>
                <div className="summary-stat highlight">
                  <span className="stat-label">Total MON Tickets</span>
                  <span className="stat-value gold">{getTotalTickets()}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Collections</span>
                  <span className="stat-value">{uniqueCollections.length}</span>
                </div>
              </div>
              
              <div className="nft-list">
                <h3>Selected NFTs</h3>
                <div className="nft-scroll-list">
                  {selectedNFTs.map((nft, index) => (
                    <div key={`${nft.collection}-${nft.tokenId}`} className="nft-list-item">
                      <img src={nft.image} alt={nft.name} className="nft-thumb" />
                      <div className="nft-details">
                        <span className="nft-name">{nft.name}</span>
                        <span className="nft-collection">{nft.collectionName}</span>
                      </div>
                      <span className="nft-tickets">{nft.estimatedValue} tickets</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="modal-actions">
                <button onClick={handleClose} className="cancel-button">Cancel</button>
                <button onClick={handleStartApprovals} className="primary-button">
                  Continue to Approval
                </button>
              </div>
            </div>
          )}
          
          {currentStep === 'approvals' && (
            <div className="approvals-step">
              <p className="step-description">
                Approving collections to allow NFT deposits...
              </p>
              
              <div className="approval-list">
                {approvalStatuses.map((status, index) => (
                  <div key={status.collection} className={`approval-item ${status.approved ? 'approved' : ''} ${status.pending ? 'pending' : ''}`}>
                    <div className="approval-icon">
                      {status.approved ? '✓' : status.pending ? '⏳' : '○'}
                    </div>
                    <span className="collection-name">{status.name}</span>
                    <div style={{ fontSize: '10px', color: '#666' }}>{status.collection}</div>
                    {status.error && <span className="error-text">{status.error}</span>}
                  </div>
                ))}
              </div>
              
              {(isWaitingTx || isPending) && (
                <div className="waiting-message">
                  <div className="spinner"></div>
                  <p>Waiting for transaction confirmation...</p>
                  <p style={{ fontSize: '12px' }}>TX Hash: {txHash}</p>
                </div>
              )}
              
              {/* Manual trigger button for debugging */}
              <button 
                onClick={() => {
                  const currentApproval = approvalStatuses[currentApprovalIndex]
                  if (currentApproval) {
                    handleApproveCollection(currentApproval.collection)
                  }
                }}
                style={{ marginTop: '10px', padding: '5px 10px' }}
              >
                Manual Trigger Approval
              </button>
            </div>
          )}
          
          {currentStep === 'deposit' && (
            <div className="deposit-step">
              <img src="/monanimals/generated/Chog_high_roller.png" alt="Depositing" className="deposit-mascot" />
              <h3>Depositing Your NFTs</h3>
              <p>Almost there! Depositing {selectedNFTs.length} NFTs to the game...</p>
              
              {(isWaitingTx || isPending) && (
                <div className="waiting-message">
                  <div className="spinner large"></div>
                  <p>Transaction pending...</p>
                </div>
              )}
              
              {depositTxHash && (
                <div className="tx-info">
                  <p>Transaction: {depositTxHash.slice(0, 10)}...{depositTxHash.slice(-8)}</p>
                </div>
              )}
            </div>
          )}
          
          {currentStep === 'complete' && (
            <div className="complete-step">
              <div className="success-animation">
                <div className="success-icon">🎉</div>
              </div>
              <h3>Success!</h3>
              <p>You've entered the game with {selectedNFTs.length} NFTs!</p>
              <p className="ticket-success">{getTotalTickets()} MON tickets added to your balance</p>
              
              <div className="confetti-wrapper">
                <div className="confetti"></div>
                <div className="confetti"></div>
                <div className="confetti"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
