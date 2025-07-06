import hre from "hardhat";
import { CONTRACTS } from "../contracts.config";

async function main() {
  console.log("Reading NFT Collections from Price Oracle");
  console.log("========================================");
  
  const priceOracle = await hre.viem.getContractAt("PriceOracle", CONTRACTS.priceOracle as `0x${string}`);
  
  try {
    const count = await priceOracle.read.getCollectionCount();
    console.log(`Total collections: ${count}\n`);
    
    if (count === 0n) {
      console.log("No collections stored yet. Run 'npm run update-prices' to add collections.");
      return;
    }
    
    const [addresses, prices, names, verified] = await priceOracle.read.getAllCollections();
    
    console.log("Collection Details:");
    console.log("==================");
    
    for (let i = 0; i < addresses.length; i++) {
      console.log(`\n${i + 1}. ${names[i]}`);
      console.log(`   Address: ${addresses[i]}`);
      console.log(`   Price: ${prices[i].toString()} wei (${Number(prices[i]) / 1e18} MON)`);
      console.log(`   Verified: ${verified[i] ? '✅' : '❌'}`);
    }
    
    // Summary
    const verifiedCount = verified.filter(v => v).length;
    const totalValue = prices.reduce((sum, price) => sum + price, 0n);
    
    console.log("\n========================================");
    console.log(`Summary:`);
    console.log(`- Total Collections: ${addresses.length}`);
    console.log(`- Verified Collections: ${verifiedCount}`);
    console.log(`- Average Floor Price: ${addresses.length > 0 ? Number(totalValue / BigInt(addresses.length)) / 1e18 : 0} MON`);
    
  } catch (error) {
    console.error("Error reading collections. Make sure you've deployed the updated contract with getAllCollections function.");
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
