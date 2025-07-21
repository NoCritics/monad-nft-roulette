# NFT Roulette V2 - Deployment & Migration Guide

## 🚀 V2 Features

- **Batch Deposits**: Deposit up to 10 NFTs in a single transaction
- **NFT Discovery**: Visual gallery showing all eligible NFTs in user's wallet
- **Smart Approvals**: Batch approval checking and management
- **Enhanced UX**: No more manual typing of addresses and token IDs
- **Backwards Compatible**: All V1 functionality preserved

## 📋 Deployment Steps

### 1. Compile Contracts
```bash
npm run compile
```

### 2. Deploy NFTRouletteV2
```bash
npm run deploy:v2
```

This will:
- Deploy NFTRouletteV2 contract
- Fund it with 0.27 MON for VRF fees
- Display the new contract address

### 3. Update Configuration
After deployment, update `contracts.config.ts`:
```typescript
export const CONTRACTS = {
  priceOracle: '0x4a18071cd8aa05dece9621a025cd8b0f8e4f5984',
  nftRoulette: '0x93b9c1eb1898796c1370589bace1d97d14f5a910', // V1 (keep for reference)
  nftRouletteV2: '0x... // YOUR V2 ADDRESS HERE', // V2 - NEW!
};
```

### 4. Test V2 Functionality
```bash
npm run test:v2
```

This will verify:
- Contract deployment
- Backward compatibility
- New V2 functions
- Price oracle integration

### 5. Setup Test NFTs (Optional)
```bash
npm run setup-test-nfts
```

This ensures your Chog NFT is properly configured in PriceOracle.

### 6. Update AutoVRF Script
Stop the old autoVRF and start V2 version:
```bash
# On your VPS
pm2 stop nft-roulette-vrf
pm2 start scripts/autoVRFv2.ts --name nft-roulette-vrf-v2
pm2 save
```

### 7. Update Frontend Configuration
In `frontend/src/config/contracts.ts`, the V2 ABI is already included. Just ensure the contract address is updated after deployment.

## 🎮 Frontend Changes

The frontend now includes:

1. **NFTGallery Component**: Shows all eligible NFTs with visual previews
2. **BatchDepositModal**: Handles multi-NFT deposits with progress tracking
3. **NFTDepositV2**: Enhanced deposit interface with gallery integration
4. **NFT Discovery Service**: Automatically finds and displays user's eligible NFTs

### Using V2 in Frontend

1. Replace `NFTDeposit` with `NFTDepositV2` in App.tsx:
```typescript
import NFTDepositV2 from './components/NFTDepositV2'

// In the JSX:
<NFTDepositV2 onDeposit={refreshData} />
```

2. Update contract references to use V2:
```typescript
// Change from:
CONTRACTS.nftRoulette
// To:
CONTRACTS.nftRouletteV2
```

## 🔧 Testing Checklist

- [ ] Deploy V2 contract
- [ ] Update contracts.config.ts
- [ ] Test single NFT deposit (V1 compatibility)
- [ ] Test batch NFT deposit (V2 feature)
- [ ] Verify NFT discovery works
- [ ] Check approval management
- [ ] Confirm autoVRF still triggers correctly
- [ ] Test game flow end-to-end

## 📝 Contract Addresses (After Deployment)

| Contract | Address | Version |
|----------|---------|---------|
| PriceOracle | 0x4a18071cd8aa05dece9621a025cd8b0f8e4f5984 | Shared |
| NFTRoulette (V1) | 0x93b9c1eb1898796c1370589bace1d97d14f5a910 | V1 |
| NFTRouletteV2 | 0x... (UPDATE AFTER DEPLOY) | V2 |

## 🚨 Important Notes

1. **Gas Costs**: Batch deposits save gas compared to multiple single deposits
2. **Max Batch Size**: 10 NFTs per transaction (can do multiple transactions)
3. **Approval Pattern**: One approval per collection (not per NFT)
4. **VRF Compatibility**: V2 maintains exact same VRF interface for autoVRF script

## 🐛 Troubleshooting

### NFTs Not Showing
- Ensure collections are in PriceOracle
- Check that collections are verified
- Verify user owns NFTs from those collections

### Approval Issues
- Each collection needs separate approval
- Use `setApprovalForAll` for collections
- Check approval status in BatchDepositModal

### Frontend Not Loading NFTs
- Check browser console for errors
- Ensure RPC is accessible
- Verify contract addresses are correct

## 🎯 Next Steps

After successful deployment:
1. Test with real NFTs
2. Monitor first few games
3. Gather user feedback
4. Consider additional features (sorting, filtering, etc.)
