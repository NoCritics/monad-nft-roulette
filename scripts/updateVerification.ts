import hre from "hardhat";
import { CONTRACTS } from "../contracts.config";

async function main() {
  console.log("Updating Verification Status for Existing Collections");
  console.log("====================================================");
  
  const priceOracle = await hre.viem.getContractAt("PriceOracle", CONTRACTS.priceOracle as `0x${string}`);
  
  try {
    const [addresses, prices, names, verified] = await priceOracle.read.getAllCollections();
    console.log(`Found ${addresses.length} collections in oracle\n`);
    
    if (addresses.length === 0) {
      console.log("No collections to update");
      return;
    }
    
    // Show current status
    console.log("Current verification status:");
    let unverifiedCount = 0;
    for (let i = 0; i < addresses.length; i++) {
      if (!verified[i]) {
        console.log(`❌ ${names[i]} (${addresses[i].slice(0, 6)}...${addresses[i].slice(-4)})`);
        unverifiedCount++;
      }
    }
    
    if (unverifiedCount === 0) {
      console.log("✅ All collections are already verified!");
      return;
    }
    
    console.log(`\nFound ${unverifiedCount} unverified collections`);
    
    // Ask if user wants to verify all
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      readline.question('Verify all collections? (y/n): ', (answer: string) => {
        readline.close();
        resolve(answer.toLowerCase());
      });
    });
    
    if (answer !== 'y') {
      console.log("Cancelled");
      return;
    }
    
    // Set all to verified
    const verifiedStatuses = new Array(addresses.length).fill(true);
    
    console.log("\nUpdating verification status...");
    try {
      const tx = await priceOracle.write.batchSetVerifiedCollections([addresses, verifiedStatuses]);
      console.log(`✅ Transaction successful: ${tx}`);
    } catch (error: any) {
      if (error.message?.includes("Another transaction has higher priority")) {
        console.log("\n⚠️  Got 'Another transaction has higher priority' error");
        console.log("This is a Monad-specific issue. Try:");
        console.log("1. Waiting a few seconds and running again");
        console.log("2. Increasing gas price");
        console.log("3. Updating in smaller batches");
      } else {
        console.error("Error:", error);
      }
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
