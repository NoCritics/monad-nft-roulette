import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { CONTRACTS, NFT_ROULETTE_ABI, ERC721_ABI } from '../config/contracts'
import './NFTDeposit.css'

interface NFTDepositProps {
  onDeposit: () => void
}

export default function NFTDeposit({ onDeposit }: NFTDepositProps) {
  const [nftAddress, setNftAddress] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  
  const { address, isConnected } = useAccount()
  const { writeContract } = useWriteContract()
  
  const handleApprove = async () => {
    if (!nftAddress || !tokenId) return
    
    setIsApproving(true)
    try {
      await writeContract({
        address: nftAddress as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'approve',
        args: [CONTRACTS.nftRoulette as `0x${string}`, BigInt(tokenId)],
      })
      setIsApproving(false)
    } catch (error) {
      console.error('Approval failed:', error)
      setIsApproving(false)
    }
  }  
  const handleDeposit = async () => {
    if (!nftAddress || !tokenId) return
    
    try {
      await writeContract({
        address: CONTRACTS.nftRoulette as `0x${string}`,
        abi: NFT_ROULETTE_ABI,
        functionName: 'depositNFT',
        args: [nftAddress as `0x${string}`, BigInt(tokenId)],
      })
      
      setNftAddress('')
      setTokenId('')
      onDeposit()
    } catch (error) {
      console.error('Deposit failed:', error)
    }
  }
  
  if (!isConnected) {
    return (
      <div className="nft-deposit">
        <p>Connect your wallet to deposit NFTs</p>
      </div>
    )
  }
  
  return (
    <div className="nft-deposit">
      <h3>Deposit NFT</h3>
      <div className="deposit-form">
        <input
          type="text"
          placeholder="NFT Contract Address"
          value={nftAddress}
          onChange={(e) => setNftAddress(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="input"
        />
        <div className="button-group">
          <button 
            onClick={handleApprove} 
            disabled={!nftAddress || !tokenId || isApproving}
            className="approve-btn"
          >
            {isApproving ? 'Approving...' : 'Approve'}
          </button>
          <button 
            onClick={handleDeposit} 
            disabled={!nftAddress || !tokenId}
            className="deposit-btn"
          >
            Deposit
          </button>
        </div>
      </div>
    </div>
  )
}
