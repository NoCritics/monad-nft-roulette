import hre from "hardhat";
import { CONTRACTS } from "../contracts.config";

async function main() {
  console.log("Manual NFT Collection Adder");
  console.log("===========================");
  
  const priceOracle = await hre.viem.getContractAt("PriceOracle", CONTRACTS.priceOracle as `0x${string}`);
  
  // Your NFT collection details
  const collections = [
    {
      address: "0x9524495D7B117eFC3Aa45C6d8455caD7Fa66766d",
      name: "Chog The Testicule",
      price: "1000000000000000000", // 1 MON (reasonable test price)
      verified: true
    }
  ];
  
  console.log("Adding the following collections:");
  collections.forEach((col, i) => {
    console.log(`${i + 1}. ${col.name}`);
    console.log(`   Address: ${col.address}`);
    console.log(`   Price: ${col.price} wei (${Number(col.price) / 1e18} MON)`);
    console.log(`   Verified: ${col.verified ? '✅' : '❌'}`);
  });
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise<string>((resolve) => {
    readline.question('\nProceed with adding? (y/n): ', (answer: string) => {
      readline.close();
      resolve(answer.toLowerCase());
    });
  });
  
  if (answer !== 'y') {
    console.log("Cancelled");
    return;
  }
  
  // Prepare arrays
  const addresses = collections.map(c => c.address);
  const prices = collections.map(c => BigInt(c.price));
  const names = collections.map(c => c.name);
  const verifiedStatuses = collections.map(c => c.verified);
  
  try {
    // Update prices and names
    console.log("\nUpdating prices and names...");
    const tx1 = await priceOracle.write.batchUpdatePricesWithNames([addresses, prices, names]);
    console.log(`✅ Updated prices and names, tx: ${tx1}`);
    
    // Wait to avoid priority error
    console.log("Waiting 5 seconds...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Update verification status
    console.log("Updating verification status...");
    const tx2 = await priceOracle.write.batchSetVerifiedCollections([addresses, verifiedStatuses]);
    console.log(`✅ Updated verification status, tx: ${tx2}`);
    
    console.log("\n✨ Successfully added your NFT collection!");
    
    // Show new total
    const count = await priceOracle.read.getCollectionCount();
    console.log(`Total collections in oracle: ${count}`);
    
  } catch (error: any) {
    console.error("Error:", error);
    if (error.message?.includes("Another transaction has higher priority")) {
      console.log("\n⚠️  Got priority error. Try running 'npm run update-verification' separately");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
