# NFT Roulette V2 - Monad Casino 🎰

A fully decentralized NFT gambling game on Monad Testnet featuring batch deposits, visual NFT selection, and Monad-themed casino experience.

🎮 **Live Demo**: [https://monafarms.xyz](https://monafarms.xyz)

## 🌟 V2 Features

### Smart Contract Enhancements
- **Batch NFT Deposits**: Deposit up to 10 NFTs in a single transaction
- **Automatic Approval Management**: Smart handling of collection approvals
- **Enhanced Game Stats**: Comprehensive game state tracking
- **Backward Compatible**: All V1 functions preserved

### UI/UX Improvements
- **Visual NFT Gallery**: See and select your NFTs visually
- **Multi-Step Deposit Flow**: Guided process with progress tracking
- **Monad Casino Theme**: Purple luxury casino aesthetics
- **VIP Player Lounge**: Enhanced player list with rankings
- **Monanimal Integration**: 6 mascots as casino staff (coming soon)

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Monad testnet MON tokens
- NFTs on Monad testnet

### Installation

```bash
# Clone repository
git clone https://github.com/NoCritics/monad-nft-roulette.git
cd monad-nft-roulette

# Install dependencies
npm install
npm run frontend:install
```

### Deployment

```bash
# Deploy V2 contracts
npm run deploy:v2

# Update contract addresses in contracts.config.ts
# Then update frontend/src/config/contracts.ts
```

### Running the Application

```bash
# Start frontend (separate terminals)
npm run frontend

# Start AutoVRF (CRITICAL - must run 24/7)
npm run auto-vrf:v2
```

### Price Oracle Management

```bash
# Update NFT collection prices
npm run update-prices

# View stored collections
npm run read-collections

# Add specific collection
npm run quick-add
```

## 🎯 Game Mechanics

1. **Entry**: Minimum 2 players to start
2. **Countdown**: 3-minute timer or max 10 players
3. **Drawing**: Pyth Entropy VRF ensures fairness
4. **Winner**: Takes all NFTs in the pot
5. **Claim**: 7-day window to claim winnings

## 📋 V2 Contract Addresses

Deployed on Monad Testnet:
- **PriceOracle**: `0x4a18071cd8aa05dece9621a025cd8b0f8e4f5984`
- **NFTRoulette V2**: `0x0913f17bc6d58fd74d4a14d5c599ff4eb716087b`

View on Monad Explorer:
- [PriceOracle](https://testnet.monadexplorer.com/address/0x4a18071cd8aa05dece9621a025cd8b0f8e4f5984)
- [NFTRoulette V2](https://testnet.monadexplorer.com/address/0x0913f17bc6d58fd74d4a14d5c599ff4eb716087b)

## 🛠️ Technical Stack

- **Smart Contracts**: Solidity 0.8.28
- **Randomness**: Pyth Entropy VRF
- **Price Oracle**: Magic Eden API integration
- **Frontend**: React + TypeScript + Vite
- **Web3**: Wagmi v2 + RainbowKit
- **Styling**: Tailwind CSS + Custom Casino Theme

## 📊 Key Improvements in V2

| Feature | V1 | V2 |
|---------|----|----|
| NFT Deposits | Single only | Batch (up to 10) |
| NFT Selection | Manual entry | Visual gallery |
| Approval Flow | Manual | Automatic |
| Gas per 10 NFTs | 10 transactions | 1-2 transactions |
| User Experience | Basic | Premium casino |

## 🤖 Critical Scripts

### AutoVRF V2
```bash
npm run auto-vrf:v2
```
**⚠️ MUST RUN 24/7** - Manages game state transitions and VRF triggers

### Production Deployment
```bash
# With PM2
pm2 start npm --name "nft-roulette-vrf" -- run auto-vrf:v2
```

## 🎨 Monanimal Casino Staff

- **Salmonad** 🐟 - The Empathetic Dealer
- **Molandak** 🦔 - The Security Guard  
- **Chog** 🐱 - The High Roller
- **Mouch** 🪰 - The Lucky Charm
- **Mokadel** 🦎 - The Fortune Teller
- **Mosferatu** 🦇 - The Night Manager

## 📈 Roadmap

- [x] V2 Smart Contract
- [x] Batch NFT Deposits
- [x] Visual NFT Gallery
- [x] Casino UI Theme
- [ ] Animated Monanimals
- [ ] Sound Effects
- [ ] Leaderboard System
- [ ] Tournament Mode

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Monad Team for the testnet
- Pyth Network for Entropy VRF
- Magic Eden for price data
- Monad community for the monanimals

---

Built with 💜 for the Monad ecosystem