import hre from "hardhat";
import { CONTRACTS } from "../contracts.config";

async function main() {
  console.log("🔍 NFT Roulette V2 Diagnostics\n");
  
  const publicClient = await hre.viem.getPublicClient();
  
  // Contract addresses
  console.log("Contract Addresses:");
  console.log("  Price Oracle:", CONTRACTS.priceOracle);
  console.log("  NFT Roulette V1:", CONTRACTS.nftRoulette);
  console.log("  NFT Roulette V2:", CONTRACTS.nftRouletteV2);
  console.log("\n");
  
  // Check if V2 contract exists
  try {
    const code = await publicClient.getBytecode({
      address: CONTRACTS.nftRouletteV2 as `0x${string}`,
    });
    
    if (code && code !== '0x') {
      console.log("✅ NFT Roulette V2 contract is deployed");
      console.log(`   Bytecode length: ${code.length} characters\n`);
    } else {
      console.log("❌ NFT Roulette V2 contract NOT found at address!");
      return;
    }
  } catch (error) {
    console.log("❌ Error checking V2 contract:", error);
    return;
  }
  
  // Check contract balance for VRF
  const balance = await publicClient.getBalance({
    address: CONTRACTS.nftRouletteV2 as `0x${string}`,
  });
  console.log(`💰 V2 Contract Balance: ${balance} wei (${Number(balance) / 1e18} MON)\n`);
  
  // Check verified collections
  const priceOracleAbi = [
    {
      inputs: [],
      name: 'getAllCollections',
      outputs: [
        { name: 'addresses', type: 'address[]' },
        { name: 'prices', type: 'uint256[]' },
        { name: 'names', type: 'string[]' },
        { name: 'verified', type: 'bool[]' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const;
  
  try {
    const result = await publicClient.readContract({
      address: CONTRACTS.priceOracle as `0x${string}`,
      abi: priceOracleAbi,
      functionName: 'getAllCollections',
    });
    
    const [addresses, prices, names, verified] = result;
    
    console.log("📋 Verified Collections:");
    for (let i = 0; i < addresses.length; i++) {
      if (verified[i]) {
        console.log(`   ${names[i] || 'Unknown'}: ${addresses[i]}`);
        console.log(`     Price: ${prices[i]} wei (${Number(prices[i]) / 1e18} MON)`);
        console.log(`     Tickets: ${Number(prices[i]) / 1e15}\n`);
      }
    }
    
    if (!verified.some(v => v)) {
      console.log("   ⚠️  No verified collections found!");
    }
  } catch (error) {
    console.log("❌ Error reading collections:", error);
  }
  
  // Test NFT collection address
  const testCollection = "0x9524495D7B117eFC3Aa45C6d8455caD7Fa66766d"; // Chog The Testicule
  console.log(`\n🧪 Testing specific collection: ${testCollection}`);
  
  try {
    const erc721Abi = [
      {
        inputs: [],
        name: 'name',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const;
    
    const name = await publicClient.readContract({
      address: testCollection as `0x${string}`,
      abi: erc721Abi,
      functionName: 'name',
    });
    
    console.log(`   Collection Name: ${name}`);
  } catch (error) {
    console.log("   ❌ Error reading collection name:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
