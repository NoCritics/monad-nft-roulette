import hre from "hardhat";
import { CONTRACTS } from "../contracts.config";

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
  console.log("🤖 Active Auto VRF Trigger Started");
  console.log("   This will actively manage game state transitions and trigger VRF");
  
  const publicClient = await hre.viem.getPublicClient();
  const walletClient = await hre.viem.getWalletClient();
  const [account] = await walletClient.getAddresses();
  
  console.log("Using wallet:", account);
  console.log("NFT Roulette:", CONTRACTS.nftRoulette);
  console.log("Monitoring and managing game state...\n");
  
  // Track last ping to avoid spamming
  let lastPingTime = 0;
  const MIN_PING_INTERVAL = 5; // Don't ping more than once per 5 seconds
  
  while (true) {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Read current game state
      const gameState = await publicClient.readContract({
        address: CONTRACTS.nftRoulette as `0x${string}`,
        abi: NFT_ROULETTE_ABI,
        functionName: 'gameState',
      });
      
      const stateNames = ['WAITING', 'COUNTDOWN', 'PREPARING', 'DRAWING', 'COMPLETE'];
      const currentState = Number(gameState);
      
      // Handle different states
      if (currentState === GameState.COUNTDOWN) {
        // Check if countdown time has elapsed
        const gameStartTime = await publicClient.readContract({
          address: CONTRACTS.nftRoulette as `0x${string}`,
          abi: NFT_ROULETTE_ABI,
          functionName: 'gameStartTime',
        });
        
        const elapsed = currentTime - Number(gameStartTime);
        console.log(`[${new Date().toLocaleTimeString()}] COUNTDOWN - ${elapsed}s elapsed (${COUNTDOWN_TIME - elapsed}s remaining)`);
        
        // If countdown is complete and enough time since last ping
        if (elapsed >= COUNTDOWN_TIME && currentTime - lastPingTime >= MIN_PING_INTERVAL) {
          console.log("⏰ Countdown complete! Triggering state transition...");
          
          try {
            const hash = await walletClient.writeContract({
              address: CONTRACTS.nftRoulette as `0x${string}`,
              abi: NFT_ROULETTE_ABI,
              functionName: 'ping',
              account,
            });
            
            console.log("Transaction sent:", hash);
            await publicClient.waitForTransactionReceipt({ hash });
            console.log("✅ State transition triggered!");
            lastPingTime = currentTime;
          } catch (error) {
            console.error("Error calling ping:", error);
          }
        }
      } else if (currentState === GameState.PREPARING) {
        // Check if prepare time has elapsed
        const prepareStartTime = await publicClient.readContract({
          address: CONTRACTS.nftRoulette as `0x${string}`,
          abi: NFT_ROULETTE_ABI,
          functionName: 'prepareStartTime',
        });
        
        const elapsed = currentTime - Number(prepareStartTime);
        console.log(`[${new Date().toLocaleTimeString()}] PREPARING - ${elapsed}s elapsed`);
        
        // If prepare time is complete and enough time since last ping
        if (elapsed >= PREPARE_TIME && currentTime - lastPingTime >= MIN_PING_INTERVAL) {
          console.log("🎲 Time to trigger VRF!");
          
          try {
            const hash = await walletClient.writeContract({
              address: CONTRACTS.nftRoulette as `0x${string}`,
              abi: NFT_ROULETTE_ABI,
              functionName: 'ping',
              account,
            });
            
            console.log("Transaction sent:", hash);
            await publicClient.waitForTransactionReceipt({ hash });
            console.log("✅ VRF triggered successfully!");
            lastPingTime = currentTime;
          } catch (error) {
            console.error("Error triggering VRF:", error);
          }
        }
      } else if (currentState === GameState.DRAWING) {
        console.log(`[${new Date().toLocaleTimeString()}] DRAWING - Waiting for Pyth Entropy callback...`);
      } else if (currentState === GameState.COMPLETE) {
        console.log(`[${new Date().toLocaleTimeString()}] COMPLETE - Game finished, waiting for reset`);
      } else if (currentState === GameState.WAITING) {
        console.log(`[${new Date().toLocaleTimeString()}] WAITING - No active game`);
      }
      
    } catch (error) {
      console.error("Error in monitoring loop:", error);
    }
    
    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

main().catch(console.error);