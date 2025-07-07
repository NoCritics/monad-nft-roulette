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
- PriceOracle: `0x4a18071cd8aa05dece9621a025cd8b0f8e4f5984`
- NFTRoulette: `0x93b9c1eb1898796c1370589bace1d97d14f5a910`

View on Monad Explorer:
- [PriceOracle](https://testnet.monadexplorer.com/address/0x4a18071cd8aa05dece9621a025cd8b0f8e4f5984)
- [NFTRoulette](https://testnet.monadexplorer.com/address/0x93b9c1eb1898796c1370589bace1d97d14f5a910)
