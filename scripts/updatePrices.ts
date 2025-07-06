import hre from "hardhat";
import axios from "axios";
import * as readline from 'readline';
import { CONTRACTS } from "../contracts.config";

const MAGIC_EDEN_API = 'https://api-mainnet.magiceden.dev/v3/rtp/monad-testnet';
const LIMIT_PER_REQUEST = 20; // Magic Eden max limit

async function fetchCollections(continuation?: string) {
  try {
    const params: any = {
      limit: LIMIT_PER_REQUEST,
      sortBy: 'allTimeVolume',
      includeSecurityConfigs: false,
      normalizeRoyalties: false,
    };
    
    if (continuation) {
      params.continuation = continuation;
    }
    
    const response = await axios.get(`${MAGIC_EDEN_API}/collections/v7`, {
      params,
      headers: {
        'Accept': '*/*',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching collections:', error);
    return null;
  }
}

async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log("Magic Eden NFT Price Oracle Updater");
  console.log("====================================");
  
  const priceOracle = await hre.viem.getContractAt("PriceOracle", CONTRACTS.priceOracle as `0x${string}`);
  
  // Check current state
  try {
    const currentCount = await priceOracle.read.getCollectionCount();
    console.log(`Current collections in oracle: ${currentCount}`);
  } catch {
    console.log("Current collections in oracle: 0 (getCollectionCount not available - deploy new contract)");
  }
  
  // Ask how many batches to fetch
  const batchesToFetchStr = await askQuestion('\nHow many batches to fetch? (20 collections each, enter for 1): ');
  const batchesToFetch = parseInt(batchesToFetchStr) || 1;
  
  let continuation: string | undefined;
  let totalProcessed = 0;
  let batchNumber = 1;
  
  for (let batch = 0; batch < batchesToFetch; batch++) {
    console.log(`\nFetching batch ${batchNumber}...`);
    const data = await fetchCollections(continuation);
    
    if (!data || !data.collections || data.collections.length === 0) {
      console.log("No more collections found");
      break;
    }
    
    const collections = data.collections;
    console.log(`Found ${collections.length} collections`);
    
    // Prepare data
    const addresses: string[] = [];
    const prices: bigint[] = [];
    const names: string[] = [];
    const verifiedStatuses: boolean[] = [];
    
    for (const col of collections) {
      addresses.push(col.id);
      names.push(col.name || 'Unknown Collection');
      
      // Handle price
      let price = 0;
      if (col.floorAsk && col.floorAsk.price) {
        const priceData = col.floorAsk.price;
        
        if (typeof priceData === 'object') {
          if (priceData.amount) {
            if (typeof priceData.amount === 'object' && priceData.amount.raw) {
              price = priceData.amount.raw;
            } else {
              price = priceData.amount;
            }
          } else if (priceData.raw) {
            price = priceData.raw;
          }
        } else if (typeof priceData === 'string' || typeof priceData === 'number') {
          price = priceData;
        }
      }
      
      try {
        const priceStr = String(price).split('.')[0] || '0';
        prices.push(BigInt(priceStr));
      } catch (error) {
        prices.push(BigInt(0));
      }
      
      verifiedStatuses.push(col.magicedenVerificationStatus === 'verified' || col.isSpam === false);
    }
    
    // Update on-chain
    try {
      console.log(`Updating batch ${batchNumber} on-chain...`);
      
      // Check if new function exists, otherwise use old one
      try {
        const tx1 = await priceOracle.write.batchUpdatePricesWithNames([addresses, prices, names]);
        console.log(`✅ Updated prices and names, tx: ${tx1}`);
      } catch (error) {
        // Fallback to old function
        console.log("Using legacy update function (no names)...");
        const tx1 = await priceOracle.write.batchUpdatePrices([addresses, prices]);
        console.log(`✅ Updated prices, tx: ${tx1}`);
      }
      
      // Wait a bit to avoid "Another transaction has higher priority" error
      console.log("Waiting 5 seconds before updating verification status...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const tx2 = await priceOracle.write.batchSetVerifiedCollections([addresses, verifiedStatuses]);
      console.log(`✅ Updated verification status, tx: ${tx2}`);
      
      totalProcessed += collections.length;
    } catch (error) {
      console.error(`❌ Error updating batch ${batchNumber}:`, error);
    }
    
    // Next batch
    continuation = data.continuation;
    batchNumber++;
    
    if (!continuation) {
      console.log("\nNo more collections available on Magic Eden");
      break;
    }
  }
  
  console.log(`\n✨ Update complete! Processed ${totalProcessed} collections.`);
  
  // Show final state
  try {
    const finalCount = await priceOracle.read.getCollectionCount();
    console.log(`Total collections in oracle: ${finalCount}`);
    
    // Show sample data
    const allData = await priceOracle.read.getAllCollections();
    if (allData && allData[0] && allData[0].length > 0) {
      console.log("\nSample collections in oracle:");
      for (let i = 0; i < Math.min(5, allData[0].length); i++) {
        console.log(`- ${allData[2][i]}: ${allData[0][i].slice(0, 6)}...${allData[0][i].slice(-4)} (Price: ${allData[1][i].toString()}, Verified: ${allData[3][i]})`);
      }
    }
  } catch {
    console.log("(Deploy new contract to see collection details)");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
