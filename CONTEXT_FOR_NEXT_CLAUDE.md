# NFT Roulette Game - Context Profile for Next Claude

## Project Overview
CS:GO-style NFT roulette gambling game built on Monad Testnet where players deposit NFTs to win the entire pot. The game uses Pyth Entropy for verifiable randomness and is FULLY AUTOMATED - no user interaction except depositing NFTs and claiming winnings.

## Current Status: ✅ FULLY FUNCTIONAL
- Smart contracts deployed and verified
- Frontend working with deposit and claim functionality
- Automated game flow via backend script
- Successfully tested multiple rounds

## Key Deployed Contracts (Monad Testnet)
- **NFTRoulette**: `0x659a4a395021f97d60578e435411f49dca1d41dc`
- **PriceOracle**: `0x28de644311c63156a79da38cfcaa1870d5c6b1fc`
- **Pyth Entropy**: `0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320` (official)

## Tech Stack
- **Smart Contracts**: Solidity 0.8.28, Hardhat, OpenZeppelin
- **Frontend**: React + Vite, TypeScript, Wagmi, Monad-themed UI
- **Backend**: Node.js scripts for automation
- **VRF**: Pyth Entropy (fixed after discovering visibility modifier issue)
- **Blockchain**: Monad Testnet (Chain ID: 10143, MON as native token)

## Project Structure
```
monad-nft/
├── contracts/           # Smart contracts
│   ├── NFTRoulette.sol # Main game contract
│   ├── PriceOracle.sol # NFT price storage
│   └── interfaces/     # Contract interfaces
├── scripts/            # Backend automation
│   ├── autoVRF.ts      # ⭐ CRITICAL: Monitors and triggers state transitions
│   ├── deploy.ts       # Deployment script
│   └── various utils   # Price updates, checks, etc.
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # GameDisplay, Timer, RouletteWheel, etc.
│   │   └── config/     # Contract ABIs and addresses
│   └── package.json
├── contracts.config.ts # Contract addresses
├── hardhat.config.ts   # Hardhat configuration
└── package.json        # Root dependencies
```

## Critical Components

### 1. AutoVRF Script (MUST BE RUNNING)
```bash
npx hardhat run scripts/autoVRF.ts --network monadTestnet
```
This script:
- Monitors game state continuously
- Triggers state transitions (COUNTDOWN → PREPARING → DRAWING)
- Calls Pyth Entropy for randomness
- Runs from owner wallet (deployment wallet)

### 2. Game Flow
1. Players deposit NFTs (min 2 players to start)
2. 3-minute countdown begins automatically
3. AutoVRF triggers transition to PREPARING after 3 min
4. 10-second prepare phase
5. AutoVRF triggers VRF request
6. Pyth Entropy returns random winner
7. Winner claims all NFTs via frontend button

### 3. Known NFT Collection
- **Chog The Testicule**: `0x9524495D7B117eFC3Aa45C6d8455caD7Fa66766d`
- Price: 1 MON = 1000 tickets
- Already configured in PriceOracle

## What's Next (TODO)

### 1. Git Repository Setup
- Initialize git repo
- Create .gitignore (IMPORTANT: exclude .env, node_modules, artifacts, cache)
- Commit all code
- Push to GitHub/GitLab

### 2. Server Deployment
Frontend needs:
- Static hosting (Vercel, Netlify, or traditional server)
- Environment variables for contract addresses
- RPC endpoint configuration

Backend needs:
- VPS or dedicated server for autoVRF.ts
- PM2 or similar to keep script running 24/7
- Wallet with MON for gas fees
- Environment variables (.env file)

### 3. Environment Variables
```
PRIVATE_KEY=deployment_wallet_private_key
MONAD_RPC=https://testnet-rpc.monad.xyz
```

### 4. Deployment Checklist
- [ ] Frontend built and deployed
- [ ] Backend server running autoVRF.ts
- [ ] Contract has MON for VRF fees (0.027 MON per game)
- [ ] Owner wallet has MON for gas
- [ ] Domain/subdomain configured
- [ ] SSL certificate (if custom domain)

## Important Notes
1. **AutoVRF is CRITICAL** - Game won't progress without it
2. **Pyth Entropy works** - We fixed the callback visibility issue
3. **2-block delay** on Monad for VRF reveals
4. **Contract is upgradeable** - Has emergencyReset() for stuck games
5. **7-day claim window** - Unclaimed NFTs return to depositors

## Key Fixes We Implemented
1. Changed `entropyCallback` from `external` to `internal`
2. Changed `getEntropy` from `external` to `internal`
3. Added active pinging to trigger state transitions
4. Fixed claim flow to properly reset game
5. Added claim button to frontend

## Useful Commands
```bash
# Run frontend locally
cd frontend && npm run dev

# Run autoVRF
npx hardhat run scripts/autoVRF.ts --network monadTestnet

# Check contract state
npx hardhat run scripts/checkGameState.ts --network monadTestnet

# Add NFT collections
npx hardhat run scripts/quickAddCollection.ts --network monadTestnet
```

## Support Resources
- Monad Discord for faucet access
- Pyth Entropy docs: https://docs.pyth.network/entropy
- Contract explorer: https://testnet.monadexplorer.com

---

**Project Status**: Ready for deployment! Just needs git setup and server hosting.

Good luck with the deployment! The hard part (making everything work) is done! 🚀