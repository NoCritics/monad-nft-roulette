import hre from "hardhat";
import { CONTRACTS } from "../contracts.config";

// Script to quickly mint and prepare test NFTs for V2 testing
async function main() {
  console.log("🎮 Setting up test NFTs for V2...\n");
  
  const [owner, testUser] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  
  // Chog collection address
  const CHOG_NFT = "0x9524495D7B117eFC3Aa45C6d8455caD7Fa66766d";
  
  console.log("Test user:", testUser.account.address);
  
  // Check if Chog is in PriceOracle
  console.log("\n=== Checking PriceOracle ===");
  try {
    const isVerified = await publicClient.readContract({
      address: CONTRACTS.priceOracle as `0x${string}`,
      abi: [{
        inputs: [{ name: 'collection', type: 'address' }],
        name: 'isVerified',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'isVerified',
      args: [CHOG_NFT as `0x${string}`],
    });
    
    console.log("Chog verified:", isVerified);
    
    if (!isVerified) {
      console.log("\n⚠️  Chog not verified! Adding to PriceOracle...");
      
      // Add Chog to PriceOracle
      const hash = await owner.writeContract({
        address: CONTRACTS.priceOracle as `0x${string}`,
        abi: [{
          inputs: [
            { name: '_collections', type: 'address[]' },
            { name: 'prices', type: 'uint256[]' },
            { name: 'names', type: 'string[]' },
          ],
          name: 'batchUpdatePricesWithNames',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        }],
        functionName: 'batchUpdatePricesWithNames',
        args: [
          [CHOG_NFT as `0x${string}`],
          [hre.viem.parseEther("1")], // 1 MON floor price
          ["Chog The Testicule"]
        ],
      });
      
      await publicClient.waitForTransactionReceipt({ hash });
      console.log("✅ Added Chog to PriceOracle");
      
      // Set as verified
      const verifyHash = await owner.writeContract({
        address: CONTRACTS.priceOracle as `0x${string}`,
        abi: [{
          inputs: [
            { name: 'collection', type: 'address' },
            { name: 'verified', type: 'bool' },
          ],
          name: 'setVerifiedCollection',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        }],
        functionName: 'setVerifiedCollection',
        args: [CHOG_NFT as `0x${string}`, true],
      });
      
      await publicClient.waitForTransactionReceipt({ hash: verifyHash });
      console.log("✅ Verified Chog collection");
    }
    
    // Get price
    const price = await publicClient.readContract({
      address: CONTRACTS.priceOracle as `0x${string}`,
      abi: [{
        inputs: [{ name: 'collection', type: 'address' }],
        name: 'getPrice',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'getPrice',
      args: [CHOG_NFT as `0x${string}`],
    });
    
    console.log("Chog floor price:", hre.viem.formatEther(price), "MON");
    
    // Calculate tickets
    const TICKET_PRICE = hre.viem.parseEther("0.001");
    const tickets = price / TICKET_PRICE;
    console.log("Each Chog NFT worth:", tickets.toString(), "MON tickets");
    
  } catch (error) {
    console.error("Error checking PriceOracle:", error);
  }
  
  // Check NFT balance
  console.log("\n=== Checking NFT Balance ===");
  try {
    const balance = await publicClient.readContract({
      address: CHOG_NFT as `0x${string}`,
      abi: [{
        inputs: [{ name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'balanceOf',
      args: [testUser.account.address],
    });
    
    console.log("Test user has", balance.toString(), "Chog NFTs");
    
    if (balance > 0n) {
      // Get token IDs
      console.log("\nToken IDs owned:");
      for (let i = 0; i < Number(balance); i++) {
        try {
          const tokenId = await publicClient.readContract({
            address: CHOG_NFT as `0x${string}`,
            abi: [{
              inputs: [
                { name: 'owner', type: 'address' },
                { name: 'index', type: 'uint256' },
              ],
              name: 'tokenOfOwnerByIndex',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            }],
            functionName: 'tokenOfOwnerByIndex',
            args: [testUser.account.address, BigInt(i)],
          });
          
          console.log(`  - Token #${tokenId}`);
          
          // Try to get tokenURI
          try {
            const tokenURI = await publicClient.readContract({
              address: CHOG_NFT as `0x${string}`,
              abi: [{
                inputs: [{ name: 'tokenId', type: 'uint256' }],
                name: 'tokenURI',
                outputs: [{ name: '', type: 'string' }],
                stateMutability: 'view',
                type: 'function',
              }],
              functionName: 'tokenURI',
              args: [tokenId],
            });
            
            console.log(`    URI: ${tokenURI}`);
          } catch (e) {
            console.log(`    URI: Not available`);
          }
        } catch (e) {
          console.log(`  - Error reading token ${i}`);
        }
      }
    } else {
      console.log("\n⚠️  No Chog NFTs found. You need to mint some first!");
      console.log("Use the NFTs2Me website or mint directly from the contract");
    }
    
  } catch (error) {
    console.error("Error checking NFT balance:", error);
  }
  
  console.log("\n📝 Test preparation complete!");
  console.log("\nNext steps:");
  console.log("1. Deploy NFTRouletteV2 using: npm run deploy:v2");
  console.log("2. Update contracts.config.ts with V2 address");
  console.log("3. Test NFT discovery in frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
