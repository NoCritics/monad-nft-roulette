import hre from "hardhat";
import { CONTRACTS } from "../contracts.config";

// Script to verify V2 migration readiness
async function main() {
  console.log("🔍 V2 Migration Readiness Check\n");
  
  const publicClient = await hre.viem.getPublicClient();
  const [owner] = await hre.viem.getWalletClients();
  
  console.log("=== Current Configuration ===");
  console.log("PriceOracle:", CONTRACTS.priceOracle);
  console.log("NFTRoulette V1:", CONTRACTS.nftRoulette);
  console.log("NFTRoulette V2:", (CONTRACTS as any).nftRouletteV2 || "Not deployed yet");
  
  // Check V1 state
  console.log("\n=== V1 Contract Status ===");
  try {
    const v1GameState = await publicClient.readContract({
      address: CONTRACTS.nftRoulette as `0x${string}`,
      abi: [{
        inputs: [],
        name: 'gameState',
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'gameState',
    });
    
    const states = ['WAITING', 'COUNTDOWN', 'PREPARING', 'DRAWING', 'COMPLETE'];
    console.log("V1 Game State:", states[Number(v1GameState)]);
    
    if (Number(v1GameState) !== 0 && Number(v1GameState) !== 4) {
      console.log("⚠️  WARNING: V1 has an active game. Wait for completion before migrating!");
      return;
    }
    
    // Check V1 balance
    const v1Balance = await publicClient.getBalance({
      address: CONTRACTS.nftRoulette as `0x${string}`,
    });
    console.log("V1 Contract Balance:", hre.viem.formatEther(v1Balance), "MON");
    
  } catch (error) {
    console.error("Error checking V1:", error);
  }
  
  // Check PriceOracle
  console.log("\n=== PriceOracle Status ===");
  try {
    const collectionCount = await publicClient.readContract({
      address: CONTRACTS.priceOracle as `0x${string}`,
      abi: [{
        inputs: [],
        name: 'getCollectionCount',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'getCollectionCount',
    });
    
    console.log("Total Collections:", collectionCount.toString());
    
    const priceOracleOwner = await publicClient.readContract({
      address: CONTRACTS.priceOracle as `0x${string}`,
      abi: [{
        inputs: [],
        name: 'owner',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'owner',
    });
    
    console.log("PriceOracle Owner:", priceOracleOwner);
    console.log("Current Account:", owner.account.address);
    console.log("Owner Match:", priceOracleOwner === owner.account.address ? "✅" : "❌");
    
  } catch (error) {
    console.error("Error checking PriceOracle:", error);
  }
  
  // Migration checklist
  console.log("\n=== Migration Checklist ===");
  console.log("[ ] V1 has no active games");
  console.log("[ ] PriceOracle ownership confirmed");
  console.log("[ ] Test NFTs prepared (Chog collection)");
  console.log("[ ] Frontend backup created");
  console.log("[ ] AutoVRF script ready for update");
  
  console.log("\n=== Next Steps ===");
  console.log("1. Run: npm run deploy:v2");
  console.log("2. Update contracts.config.ts with V2 address");
  console.log("3. Run: npm run test:v2");
  console.log("4. Update frontend to use V2 components");
  console.log("5. Restart autoVRF with V2 script");
  
  console.log("\n✅ Migration readiness check complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
