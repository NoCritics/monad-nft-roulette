# NFT Roulette - Monad Testnet

A decentralized NFT roulette game on Monad Testnet with Magic Eden price integration.

## Setup

1. **Install dependencies**:
   ```
   npm install
   npm run frontend:install
   ```

2. **Deploy contracts**:
   ```
   npm run deploy
   ```

3. **Update contract addresses**:
   - Copy deployed addresses from deploy output
   - Update `frontend/src/config/contracts.ts`

4. **Start frontend**:
   ```
   npm run frontend
   ```

5. **Update NFT prices** (run periodically):
   ```
   npm run update-prices
   ```
   - Interactive: asks how many batches to fetch (20 collections per batch)
   - Stores collection names, prices, and verification status

6. **View stored collections**:
   ```
   npm run read-collections
   ```

## Features

- Minimum 2 players to start
- 3-minute countdown or max 10 players
- VRF-based random selection via Pyth Entropy
- Magic Eden price oracle integration
- 1-week claim period
- Monad-themed UI

## Contract Addresses

Deployed on Monad Testnet:
- PriceOracle: `0xdf66e7aa572a378ad2f2d33eaaac6f5f6691b0e7`
- NFTRoulette: `0x1e45467bad4542e3aa315a01810a360b95077b3a`

View on Monad Explorer:
- [PriceOracle](https://testnet.monadexplorer.com/address/0xdf66e7aa572a378ad2f2d33eaaac6f5f6691b0e7)
- [NFTRoulette](https://testnet.monadexplorer.com/address/0x1e45467bad4542e3aa315a01810a360b95077b3a)
