Monad NFT Roulette Casino - Complete Project Context
🎰 Project Overview
Name: Monad Casino - NFT Roulette
URL: https://monafarms.xyz
Purpose: CS:GO-style NFT gambling game on Monad Testnet where players deposit NFTs, receive MON tickets based on floor price, and winner takes all NFTs via Pyth Entropy VRF.
Mission: Built for Monad Foundation Mission 5 - creating novel NFT mechanics with Monad lore integration.
🏗️ Architecture Overview
Smart Contracts (Deployed on Monad Testnet)

NFTRoulette.sol - 0x93b9c1eb1898796c1370589bace1d97d14f5a910

Main game contract
Handles NFT deposits, game states, winner selection
Uses Pyth Entropy for VRF (0.027 MON per game)
Game states: WAITING → COUNTDOWN (3min) → PREPARING (10s) → DRAWING → COMPLETE
Max 10 players per game
Accumulation rate: 100% of NFT value converts to tickets


PriceOracle.sol - 0x4a18071cd8aa05dece9621a025cd8b0f8e4f5984

Returns mock floor prices for NFT collections
Used to calculate MON tickets from NFT deposits



Frontend Stack

Framework: React + Vite + TypeScript
Web3: wagmi v2 + viem
Styling: Custom CSS with luxury casino theme
Key Components:

GameDisplay - Main game interface with Monanimal mascots
RouletteWheel - Animated wheel with player segments
NFTDeposit - Manual NFT deposit interface
PlayersList - VIP lounge showing all players
Timer - Game state countdown display
Header - Monad Casino branding



Backend Service

autoVRF.ts - Critical 24/7 service that:

Monitors game state changes
Triggers prepareToStart() after countdown
Calls requestRandomnessAndDraw() for VRF
Runs via PM2 on VPS



📁 Project Structure
C:\Users\Vladislav\source\repos\monad-nft\
├── contracts/               # Hardhat project
│   ├── NFTRoulette.sol     # Main game contract
│   └── PriceOracle.sol     # Price oracle contract
├── scripts/
│   ├── autoVRF.ts          # Critical backend service
│   ├── deploy.ts           # Deployment script
│   └── quickAddCollection.ts # Add NFT collections
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── config/         # Contract ABIs & addresses
│   │   └── App.tsx         # Main app component
│   └── public/
│       └── monanimals/     # Mascot images
│           ├── original/   # Base Monanimals
│           └── generated/  # AI-enhanced versions
├── instructions/           # Documentation folder
└── contracts.config.ts     # Contract addresses
🖥️ VPS Deployment Details
Server: 193.233.165.142 (Ubuntu 20.04)
Domain: monafarms.xyz (Namecheap, DNS configured)
Internal hostname: 1064971.xorek.cloud
SSH: ssh root@193.233.165.142 (password: 161299)
Server Structure:
/root/
├── monad-nft-roulette/     # Git repository
│   ├── frontend/           # Frontend source
│   ├── scripts/            # Backend scripts
│   └── .env               # Private key for autoVRF
└── /var/www/monafarms/     # Nginx web root
Running Services:

Nginx - Serves frontend with SSL (Let's Encrypt)
PM2 - Runs autoVRF.ts as "nft-roulette-vrf"
Certbot - Auto-renews SSL certificates

Key Commands:
bash# Check autoVRF status
pm2 status
pm2 logs nft-roulette-vrf

# Update frontend
cd /root/monad-nft-roulette
git pull
cd frontend
npm run build
cp -r dist/* /var/www/monafarms/
chown -R www-data:www-data /var/www/monafarms

# Restart autoVRF
pm2 restart nft-roulette-vrf
🎨 Recent Visual Overhaul
Monanimal Integration:

Salmonad (Dealer) - Header logo & waiting state
Mouch (Lucky Charm) - NFT deposit section & countdown
Mokadal (Fortune Teller) - Pre-game pot preview & preparing
Chog (High Roller) - During spin animation
Mosferatu (VIP Manager) - VIP lounge & winner announcement

Design Features:

Luxury purple/gold casino theme
Animated gradient backgrounds with sparkle effects
Glassmorphism cards with depth
Speech bubbles for mascot interactions
Floating casino chips and cards
Winner celebration with confetti
Premium button designs with shimmer effects

🔧 Recent Fixes Applied

UI Fixes:

✅ Speech bubble no longer blocks "NFT Roulette Table" title
✅ Changed all "NFTs" references to "MON tickets" or "tickets"
✅ Added luxury casino visual theme throughout

Winner Announcement Timing Fix:

✅ Fixed circular dependency race condition in GameDisplay.tsx
✅ Winner announcement now displays correctly immediately after roulette spin
✅ Removed currentWinner from useEffect dependency array to prevent polling interruption
✅ Improved winner polling logic with async/await pattern for reliable data fetching
✅ No more 0x000... placeholder addresses showing

Technical Details of Fix:
- Located in frontend/src/components/GameDisplay.tsx lines 130-143
- Changed useEffect dependency array from [gameState, currentWinner, refetchWinner] to [gameState, refetchWinner]
- Updated polling logic to use result.data from refetch instead of stale closure values
- Winner polling now continues uninterrupted until real winner address is fetched


💡 Current UX Pain Points

NFT Deposit Flow:

Users must manually enter collection address & token ID
No visual preview of NFT being deposited
Single NFT deposits only
Two-step process (approve then deposit)


Missing Features for Better UX:

No NFT discovery (seeing user's NFTs)
No batch deposits
No visual NFT gallery
Limited feedback during transactions



🚀 Future Development Areas
Smart Contract Enhancements Needed:
solidity// Suggested new functions:
- batchDeposit(address[] collections, uint256[] tokenIds)
- getSupportedCollections()
- getUserDeposits(address user)
Frontend Improvements:

NFT Discovery System

Integrate Alchemy/Moralis SDK
Show user's NFTs with thumbnails
Multi-select with batch operations


Enhanced Game Experience

WebSocket for real-time updates
Sound effects integration
More elaborate winner celebrations
Game history tracking



📝 Important Notes
Contract Funding:

NFTRoulette contract needs MON for VRF fees
Each game costs 0.027 MON
Currently funded with 0.27 MON (good for ~10 games)
Send MON directly to: 0x93b9c1eb1898796c1370589bace1d97d14f5a910

Git Repository:

GitHub: https://github.com/NoCritics/monad-nft-roulette
Main branch only, no dev branch
Public repository

Environment Variables:

.env file contains private key for autoVRF service
Uses same deployment wallet for all operations

Critical Dependencies:

autoVRF.ts MUST run 24/7 or games won't progress
Pyth Entropy oracle must be operational
Monad testnet RPC must be accessible

🧪 Testing Game Flow

Deploy test NFT collection
Mint NFTs to test wallets
Approve and deposit NFTs
Wait for countdown → prepare → draw → complete
Winner should display immediately without 0x000... issue
Check logs: pm2 logs nft-roulette-vrf

🎯 Mission 5 Compliance

✅ Novel NFT mechanics (gambling with floor price conversion)
✅ Uses Monad lore (Monanimals as mascots)
✅ Open source (public GitHub repo)
✅ Not seeking financial gains (testnet only)
✅ Completely novel approach to NFT utility
