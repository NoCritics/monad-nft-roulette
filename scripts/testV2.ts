import hre from "hardhat";
import { CONTRACTS } from "../contracts.config";

// Test script for NFTRouletteV2 functionality
async function main() {
  console.log("🧪 Testing NFTRouletteV2 Functionality...\n");
  
  const [owner, player1, player2] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  
  // Contract addresses (update these after deployment)
  const NFT_ROULETTE_V2 = "0x... // UPDATE AFTER DEPLOYMENT";
  const PRICE_ORACLE = CONTRACTS.priceOracle;
  
  // Your test NFT collection (Chog)
  const TEST_NFT = "0x9524495D7B117eFC3Aa45C6d8455caD7Fa66766d"; // Your Chog collection
  
  console.log("Test accounts:");
  console.log("Owner:", owner.account.address);
  console.log("Player1:", player1.account.address);
  console.log("Player2:", player2.account.address);
  
  // Test 1: Check V2 deployment and basic functions
  console.log("\n=== Test 1: Checking V2 deployment ===");
  try {
    const gameState = await publicClient.readContract({
      address: NFT_ROULETTE_V2 as `0x${string}`,
      abi: [{
        inputs: [],
        name: 'gameState',
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'gameState',
    });
    console.log("✅ Game state:", gameState); // Should be 0 (WAITING)
    
    const vrfFee = await publicClient.readContract({
      address: NFT_ROULETTE_V2 as `0x${string}`,
      abi: [{
        inputs: [],
        name: 'getVRFFee',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'getVRFFee',
    });
    console.log("✅ VRF Fee:", hre.viem.formatEther(vrfFee), "MON");
  } catch (error) {
    console.error("❌ Error checking deployment:", error);
  }
  
  // Test 2: Get verified collections
  console.log("\n=== Test 2: Getting verified collections ===");
  try {
    const collections = await publicClient.readContract({
      address: NFT_ROULETTE_V2 as `0x${string}`,
      abi: [{
        inputs: [],
        name: 'getVerifiedCollections',
        outputs: [
          { name: 'collections', type: 'address[]' },
          { name: 'prices', type: 'uint256[]' },
          { name: 'names', type: 'string[]' },
          { name: 'verified', type: 'bool[]' },
        ],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'getVerifiedCollections',
    });
    
    console.log("✅ Found", collections[0].length, "collections");
    
    // Find Chog collection
    const chogIndex = collections[0].findIndex(
      addr => addr.toLowerCase() === TEST_NFT.toLowerCase()
    );
    
    if (chogIndex !== -1) {
      console.log("✅ Found Chog collection:");
      console.log("  Name:", collections[2][chogIndex]);
      console.log("  Price:", hre.viem.formatEther(collections[1][chogIndex]), "MON");
      console.log("  Verified:", collections[3][chogIndex]);
    }
  } catch (error) {
    console.error("❌ Error getting collections:", error);
  }
  
  // Test 3: Calculate tickets
  console.log("\n=== Test 3: Calculating tickets ===");
  try {
    const tickets = await publicClient.readContract({
      address: NFT_ROULETTE_V2 as `0x${string}`,
      abi: [{
        inputs: [
          { name: 'collection', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
        ],
        name: 'calculateTickets',
        outputs: [{ name: 'tickets', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'calculateTickets',
      args: [TEST_NFT as `0x${string}`, 1n],
    });
    
    console.log("✅ NFT #1 worth", tickets.toString(), "MON tickets");
  } catch (error) {
    console.error("❌ Error calculating tickets:", error);
  }
  
  // Test 4: Check batch approval
  console.log("\n=== Test 4: Checking batch approvals ===");
  try {
    const approvals = await publicClient.readContract({
      address: NFT_ROULETTE_V2 as `0x${string}`,
      abi: [{
        inputs: [
          { name: 'user', type: 'address' },
          { name: 'collections', type: 'address[]' },
        ],
        name: 'checkBatchApprovals',
        outputs: [{ name: 'approved', type: 'bool[]' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'checkBatchApprovals',
      args: [
        player1.account.address,
        [TEST_NFT as `0x${string}`]
      ],
    });
    
    console.log("✅ Approval status:", approvals);
  } catch (error) {
    console.error("❌ Error checking approvals:", error);
  }
  
  // Test 5: Single deposit (backwards compatibility)
  console.log("\n=== Test 5: Testing single deposit (V1 compatibility) ===");
  console.log("⚠️  This would require having NFTs and approvals set up");
  console.log("Run this manually after minting test NFTs");
  
  // Test 6: Batch deposit
  console.log("\n=== Test 6: Testing batch deposit (V2 feature) ===");
  console.log("⚠️  This would require having multiple NFTs and approvals");
  console.log("Example call:");
  console.log(`
  await walletClient.writeContract({
    address: NFT_ROULETTE_V2,
    abi: NFT_ROULETTE_V2_ABI,
    functionName: 'depositMultipleNFTs',
    args: [
      [collection1, collection2], // addresses
      [tokenId1, tokenId2]        // token IDs
    ],
  });
  `);
  
  // Test 7: Game stats
  console.log("\n=== Test 7: Getting game stats ===");
  try {
    const stats = await publicClient.readContract({
      address: NFT_ROULETTE_V2 as `0x${string}`,
      abi: [{
        inputs: [],
        name: 'getGameStats',
        outputs: [
          { name: 'totalPotValue', type: 'uint256' },
          { name: 'nftCount', type: 'uint256' },
          { name: 'timeRemaining', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'getGameStats',
    });
    
    console.log("✅ Game Stats:");
    console.log("  Total pot value:", hre.viem.formatEther(stats[0]), "MON");
    console.log("  NFT count:", stats[1].toString());
    console.log("  Time remaining:", stats[2].toString(), "seconds");
  } catch (error) {
    console.error("❌ Error getting game stats:", error);
  }
  
  console.log("\n🎉 Basic V2 tests complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Update contracts.config.ts with V2 address");
  console.log("2. Update frontend to use V2 contract");
  console.log("3. Test with actual NFTs");
  console.log("4. Update autoVRF script");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
