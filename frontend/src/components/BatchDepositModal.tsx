import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address } from 'viem'
import { UserNFT } from '../services/nftDiscovery'
import { CONTRACTS, NFT_ROULETTE_V2_ABI, ERC721_ABI } from '../config/contracts'
import './BatchDepositModal.css'
import './CharacterStyles.css'

interface BatchDepositModalProps {
  selectedNFTs: UserNFT[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type DepositStep = 'review' | 'approvals' | 'deposit' | 'complete'
type TransactionType = 'none' | 'approval' | 'deposit'

interface ApprovalStatus {
  collection: Address
  name: string
  approved: boolean
  pending: boolean
  error?: string
}

export default function BatchDepositModalFixed({ 
  selectedNFTs, 
  isOpen, 
  onClose, 
  onSuccess 
}: BatchDepositModalProps) {
  const { address: userAddress } = useAccount()
  const [currentStep, setCurrentStep] = useState<DepositStep>('review')
  const [approvalStatuses, setApprovalStatuses] = useState<ApprovalStatus[]>([])
  const [depositTxHash, setDepositTxHash] = useState<`0x${string}` | undefined>()
  
  // Track what type of transaction we're waiting for
  const [expectedTxType, setExpectedTxType] = useState<TransactionType>('none')
  const [pendingApprovalIndex, setPendingApprovalIndex] = useState<number>(-1)
  
  const { writeContract, data: txHash, error: writeError, isPending, reset: resetWrite } = useWriteContract()
  const { isLoading: isWaitingTx, isSuccess: txSuccess, data: txReceipt } = useWaitForTransactionReceipt({
    hash: txHash,
  })
  
  // Get unique collections that need approval
  const uniqueCollections = Array.from(
    new Map(selectedNFTs.map(nft => [nft.collection, nft.collectionName])).entries()
  ).map(([address, name]) => ({ address, name }))
  
  // Initialize approval statuses
  useEffect(() => {
    if (isOpen && currentStep === 'review') {
      const statuses: ApprovalStatus[] = uniqueCollections.map(col => ({
        collection: col.address,
        name: col.name,
        approved: false,
        pending: false,
      }))
      setApprovalStatuses(statuses)
      setExpectedTxType('none')
      setPendingApprovalIndex(-1)
    }
  }, [isOpen, currentStep, selectedNFTs])
  
  // Handle transaction success - ONLY react to expected transaction type
  useEffect(() => {
    if (txSuccess && txReceipt) {
      if (expectedTxType === 'approval' && currentStep === 'approvals' && pendingApprovalIndex >= 0) {
        // Handle approval success
        setApprovalStatuses(prev => prev.map((status, index) => 
          index === pendingApprovalIndex 
            ? { ...status, approved: true, pending: false }
            : status
        ))
        
        // Reset transaction state for next action
        setExpectedTxType('none')
        setPendingApprovalIndex(-1)
        resetWrite() // Clear the transaction state
        
      } else if (expectedTxType === 'deposit' && currentStep === 'deposit') {
        // Handle deposit success
        setDepositTxHash(txHash)
        setCurrentStep('complete')
        setExpectedTxType('none')
        
        setTimeout(() => {
          onSuccess()
          handleClose()
        }, 3000)
      }
    }
  }, [txSuccess, txReceipt, expectedTxType, currentStep, pendingApprovalIndex])
  
  const handleClose = () => {
    setCurrentStep('review')
    setApprovalStatuses([])
    setDepositTxHash(undefined)
    setExpectedTxType('none')
    setPendingApprovalIndex(-1)
    resetWrite()
    onClose()
  }
  
  const getTotalTickets = () => {
    return selectedNFTs.reduce((sum, nft) => sum + nft.estimatedValue, 0)
  }
  
  const handleStartApprovals = async () => {
    setCurrentStep('approvals')
    resetWrite() // Clear any previous transaction state
  }
  
  const handleApproveCollection = async (collection: Address, index: number) => {
    try {
      setApprovalStatuses(prev => prev.map((status, i) => 
        i === index 
          ? { ...status, pending: true, error: undefined }
          : status
      ))
      
      setExpectedTxType('approval')
      setPendingApprovalIndex(index)
      
      await writeContract({
        address: collection,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [CONTRACTS.nftRouletteV2 as Address, true],
      })
    } catch (error: any) {
      console.error('Approval error:', error)
      setApprovalStatuses(prev => prev.map((status, i) => 
        i === index 
          ? { ...status, pending: false, error: error?.message || 'Failed to approve' }
          : status
      ))
      setExpectedTxType('none')
      setPendingApprovalIndex(-1)
    }
  }
  
  const handleProceedToDeposit = () => {
    resetWrite() // Clear approval transaction state
    setCurrentStep('deposit')
  }
  
  const handleDeposit = async () => {
    try {
      const collections = selectedNFTs.map(nft => nft.collection)
      const tokenIds = selectedNFTs.map(nft => BigInt(nft.tokenId))
      
      setExpectedTxType('deposit')
      
      await writeContract({
        address: CONTRACTS.nftRouletteV2 as Address,
        abi: NFT_ROULETTE_V2_ABI,
        functionName: 'depositMultipleNFTs',
        args: [collections, tokenIds],
      })
    } catch (error: any) {
      console.error('Deposit error:', error)
      setExpectedTxType('none')
    }
  }
  
  const allApprovalsComplete = approvalStatuses.every(s => s.approved)
  const anyApprovalPending = approvalStatuses.some(s => s.pending)
  
  if (!isOpen) return null
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="batch-deposit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Deposit {selectedNFTs.length} NFTs</h2>
          <button className="close-button" onClick={handleClose}>×</button>
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
                Approve each collection to allow NFT deposits:
              </p>
              
              <div className="approval-list">
                {approvalStatuses.map((status, index) => (
                  <div key={status.collection} className={`approval-item ${status.approved ? 'approved' : ''} ${status.pending ? 'pending' : ''}`}>
                    <div className="approval-icon">
                      {status.approved ? '✓' : status.pending ? '⏳' : '○'}
                    </div>
                    <div className="approval-info">
                      <span className="collection-name">{status.name}</span>
                      <span className="collection-address">{status.collection.slice(0, 6)}...{status.collection.slice(-4)}</span>
                    </div>
                    {!status.approved && !status.pending && (
                      <button 
                        className="approve-button"
                        onClick={() => handleApproveCollection(status.collection, index)}
                        disabled={anyApprovalPending || isWaitingTx}
                      >
                        Approve
                      </button>
                    )}
                    {status.pending && (
                      <span className="pending-text">Confirming...</span>
                    )}
                    {status.approved && (
                      <span className="approved-text">Approved</span>
                    )}
                    {status.error && (
                      <div className="error-text">{status.error}</div>
                    )}
                  </div>
                ))}
              </div>
              
              {writeError && (
                <div className="error-message">
                  <p>Error: {writeError.message}</p>
                </div>
              )}
              
              {allApprovalsComplete && (
                <div className="modal-actions">
                  <button onClick={handleProceedToDeposit} className="primary-button">
                    Continue to Deposit
                  </button>
                </div>
              )}
            </div>
          )}
          
          {currentStep === 'deposit' && (
            <div className="deposit-step">
              <div className="character-container">
                <img 
                  src="/monanimals/generated/Chog_high_roller.png" 
                  alt="High Roller" 
                  className="chog-dealer character-image glow"
                />
              </div>
              <h3>Ready to Deposit</h3>
              <p>Deposit {selectedNFTs.length} NFTs into the game pot</p>
              
              <div className="deposit-summary">
                <div className="summary-item">
                  <span>Total NFTs:</span>
                  <strong>{selectedNFTs.length}</strong>
                </div>
                <div className="summary-item">
                  <span>Total Tickets:</span>
                  <strong className="gold">{getTotalTickets()}</strong>
                </div>
              </div>
              
              {!isWaitingTx && !isPending && expectedTxType !== 'deposit' && (
                <button onClick={handleDeposit} className="primary-button large">
                  Deposit NFTs
                </button>
              )}
              
              {(isWaitingTx || isPending) && expectedTxType === 'deposit' && (
                <div className="waiting-message">
                  <div className="spinner large"></div>
                  <p>Transaction pending...</p>
                  {txHash && (
                    <p className="tx-hash">Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}</p>
                  )}
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
              
              {depositTxHash && (
                <p className="tx-info">
                  Transaction: {depositTxHash.slice(0, 10)}...{depositTxHash.slice(-8)}
                </p>
              )}
              
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
