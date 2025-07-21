import hre from "hardhat";
import { CONTRACTS } from "../contracts.config";

// V2-compatible autoVRF script
const NFT_ROULETTE_ABI = [
  {
    inputs: [],
    name: 'gameState',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'gameStartTime',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'prepareStartTime',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ping',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const GameState = {
  WAITING: 0,
  COUNTDOWN: 1,
  PREPARING: 2,
  DRAWING: 3,
  COMPLETE: 4
};

const COUNTDOWN_TIME = 180; // 3 minutes
const PREPARE_TIME = 10; // 10 seconds

async function main() {
  console.log("🤖 Auto VRF Trigger Started (V2 Compatible)");
  console.log("   This will actively manage game state transitions and trigger VRF");
  
  const publicClient = await hre.viem.getPublicClient();
  const walletClient = await hre.viem.getWalletClient();
  const [account] = await walletClient.getAddresses();
  
  // Use V2 contract if available, fallback to V1
  const NFT_ROULETTE_ADDRESS = (CONTRACTS as any).nftRouletteV2 || CONTRACTS.nftRoulette;
  
  console.log("Using wallet:", account);
  console.log("NFT Roulette:", NFT_ROULETTE_ADDRESS);
  console.log("Version:", (CONTRACTS as any).nftRouletteV2 ? "V2" : "V1");
  console.log("Monitoring and managing game state...\n");
  
  // Track last ping to avoid spamming
  let lastPingTime = 0;
  const MIN_PING_INTERVAL = 5; // Don't ping more than once per 5 seconds
  
  // Track last state for better logging
  let lastLoggedState = -1;
  
  while (true) {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Read current game state
      const gameState = await publicClient.readContract({
        address: NFT_ROULETTE_ADDRESS as `0x${string}`,
        abi: NFT_ROULETTE_ABI,
        functionName: 'gameState',
      });
      
      const stateNames = ['WAITING', 'COUNTDOWN', 'PREPARING', 'DRAWING', 'COMPLETE'];
      const currentState = Number(gameState);
      
      // Only log state changes to reduce noise
      if (currentState !== lastLoggedState) {
        console.log(`\n[${new Date().toLocaleTimeString()}] State changed to: ${stateNames[currentState]}`);
        lastLoggedState = currentState;
      }
      
      // Handle different states
      if (currentState === GameState.COUNTDOWN) {
        // Check if countdown time has elapsed
        const gameStartTime = await publicClient.readContract({
          address: NFT_ROULETTE_ADDRESS as `0x${string}`,
          abi: NFT_ROULETTE_ABI,
          functionName: 'gameStartTime',
        });
        
        const elapsed = currentTime - Number(gameStartTime);
        const remaining = COUNTDOWN_TIME - elapsed;
        
        // Log countdown progress every 30 seconds
        if (elapsed % 30 === 0) {
          console.log(`[${new Date().toLocaleTimeString()}] COUNTDOWN - ${remaining}s remaining`);
        }
        
        // If countdown is complete and enough time since last ping
        if (elapsed >= COUNTDOWN_TIME && currentTime - lastPingTime >= MIN_PING_INTERVAL) {
          console.log("⏰ Countdown complete! Triggering state transition...");
          
          try {
            const hash = await walletClient.writeContract({
              address: NFT_ROULETTE_ADDRESS as `0x${string}`,
              abi: NFT_ROULETTE_ABI,
              functionName: 'ping',
              account,
            });
            
            console.log("Transaction sent:", hash);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            console.log("✅ State transition triggered! Gas used:", receipt.gasUsed.toString());
            lastPingTime = currentTime;
          } catch (error: any) {
            console.error("Error calling ping:", error.message || error);
          }
        }
      } else if (currentState === GameState.PREPARING) {
        // Check if prepare time has elapsed
        const prepareStartTime = await publicClient.readContract({
          address: NFT_ROULETTE_ADDRESS as `0x${string}`,
          abi: NFT_ROULETTE_ABI,
          functionName: 'prepareStartTime',
        });
        
        const elapsed = currentTime - Number(prepareStartTime);
        
        // Log prepare countdown
        if (elapsed < PREPARE_TIME) {
          console.log(`[${new Date().toLocaleTimeString()}] PREPARING - ${PREPARE_TIME - elapsed}s until VRF`);
        }
        
        // If prepare time is complete and enough time since last ping
        if (elapsed >= PREPARE_TIME && currentTime - lastPingTime >= MIN_PING_INTERVAL) {
          console.log("🎲 Time to trigger VRF!");
          
          try {
            const hash = await walletClient.writeContract({
              address: NFT_ROULETTE_ADDRESS as `0x${string}`,
              abi: NFT_ROULETTE_ABI,
              functionName: 'ping',
              account,
            });
            
            console.log("Transaction sent:", hash);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            console.log("✅ VRF triggered successfully! Gas used:", receipt.gasUsed.toString());
            lastPingTime = currentTime;
          } catch (error: any) {
            console.error("Error triggering VRF:", error.message || error);
          }
        }
      } else if (currentState === GameState.DRAWING) {
        // Just log once when entering drawing state
        if (lastLoggedState !== currentState) {
          console.log("Waiting for Pyth Entropy callback...");
        }
      } else if (currentState === GameState.COMPLETE) {
        // Log winner info once
        if (lastLoggedState !== currentState) {
          try {
            const winner = await publicClient.readContract({
              address: NFT_ROULETTE_ADDRESS as `0x${string}`,
              abi: [{
                inputs: [],
                name: 'currentWinner',
                outputs: [{ name: '', type: 'address' }],
                stateMutability: 'view',
                type: 'function',
              }],
              functionName: 'currentWinner',
            });
            
            if (winner && winner !== '0x0000000000000000000000000000000000000000') {
              console.log("🎉 Winner:", winner);
            }
          } catch (error) {
            // Ignore errors reading winner
          }
        }
      }
      
    } catch (error: any) {
      console.error("Error in monitoring loop:", error.message || error);
      // Wait a bit longer on errors
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

main().catch(console.error);
