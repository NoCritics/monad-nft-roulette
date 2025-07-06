# File Classification: Essential vs Testing/Debug

## ✅ ESSENTIAL FILES (Keep these!)

### Contracts
```
contracts/
├── NFTRoulette.sol         # Main game contract
├── PriceOracle.sol         # NFT price oracle
└── interfaces/
    └── IInterfaces.sol     # Required interfaces
```

### Scripts (Essential for operation)
```
scripts/
├── autoVRF.ts              # ⭐ CRITICAL - Must run continuously
├── deploy.ts               # Deploy contracts
├── quickAddCollection.ts   # Add NFT collections to oracle
└── updatePrices.ts         # Update NFT prices (if using Magic Eden)
```

### Frontend (All needed)
```
frontend/
├── src/
│   ├── components/         # All UI components
│   ├── config/            # Contract ABIs and configs
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── public/                # Static assets
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Configuration Files
```
├── contracts.config.ts     # Contract addresses
├── hardhat.config.ts      # Hardhat configuration
├── package.json           # Root dependencies
├── package-lock.json      # Lock file
├── tsconfig.json          # TypeScript config
├── remappings.txt         # Solidity remappings
├── .env                   # Environment variables (PRIVATE!)
└── CONTEXT_FOR_NEXT_CLAUDE.md  # Deployment guide
```

## 🧪 TESTING/DEBUG FILES (Can delete these!)

### Test Contracts (Not needed)
```
contracts/
├── SimplePythTest.sol     # Used to test Pyth Entropy
└── CoinFlip.sol          # Test implementation from docs
```

### Debug/Diagnostic Scripts
```
scripts/
├── checkState.ts          # Check contract state
├── checkGameState.ts      # Check game state
├── checkNFTOwnership.ts   # Debug NFT ownership
├── checkPriceOracle.ts    # Check oracle state
├── checkRevelation.ts     # Debug Pyth revelations
├── checkTransaction.ts    # Analyze transactions
├── debugCallback.ts       # Debug Pyth callback
├── investigateState.ts    # Investigate contract state
├── manualCallback.ts      # Manual callback testing
├── revealCallback.ts      # Test reveal callback
├── testCoinFlipExact.ts   # Test coin flip
├── testPythDirectly.ts    # Direct Pyth test
├── verifyFixed.ts         # Verify contract fix
├── verifyNewContract.ts   # Verify deployment
├── analyzePythDocs.ts     # Documentation analysis
└── fixChogCollection.ts   # One-time fix script
```

### Other Test/Temp Files
```
├── VRF_FALLBACK_CODE.sol  # Unused fallback code
├── How to Generate Random Numbers in EVM Contracts Using Pyth Entropy.docx
├── Magic eden instructions.txt
├── Magic Eden price api.txt
├── Monad oracles.txt
├── Deploy instructions.txt
├── Verify instructions.txt
└── README.md              # If auto-generated
```

## 📁 Auto-generated (Git should ignore)
```
├── artifacts/             # Compiled contracts
├── cache/                # Hardhat cache
├── node_modules/         # Dependencies
├── frontend/node_modules/ # Frontend dependencies
├── frontend/dist/        # Built frontend
└── .claude-server-commander-logs/  # Tool logs
```

## 🚨 IMPORTANT .gitignore
Create a `.gitignore` file with:
```
# Dependencies
node_modules/
frontend/node_modules/

# Build outputs
artifacts/
cache/
frontend/dist/
frontend/build/

# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/
.idea/

# Logs
*.log
.claude-server-commander-logs/

# OS
.DS_Store
Thumbs.db

# Hardhat
typechain/
typechain-types/

# Testing
coverage/
coverage.json
```

## Summary
- **Keep**: All contracts (except test ones), essential scripts, entire frontend, config files
- **Delete**: All the check/test/debug scripts, test contracts, instruction files
- **Most important**: Keep `autoVRF.ts` running on your server!
