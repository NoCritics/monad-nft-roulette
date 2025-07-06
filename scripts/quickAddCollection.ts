import hre from "hardhat";
import { CONTRACTS } from "../contracts.config";

const KNOWN_COLLECTION = "0x9524495D7B117eFC3Aa45C6d8455caD7Fa66766d"; // Chog The Testicule
const DEFAULT_PRICE = 1000000000000000000n; // 1 MON

async function main() {
  console.log("Adding known NFT collection to Price Oracle...\n");
  
  const walletClient = await hre.viem.getWalletClient();
  const publicClient = await hre.viem.getPublicClient();
  const [account] = await walletClient.getAddresses();
  
  const priceOracleAbi = [
    {
      inputs: [
        { name: 'collection', type: 'address' },
        { name: 'price', type: 'uint256' }
      ],
      name: 'updatePrice',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { name: 'collection', type: 'address' },
        { name: 'verified', type: 'bool' }
      ],
      name: 'setVerifiedCollection',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: 'collection', type: 'address' }],
      name: 'isVerified',
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    }
  ] as const;
  
  // Check if already verified
  const isVerified = await publicClient.readContract({
    address: CONTRACTS.priceOracle as `0x${string}`,
    abi: priceOracleAbi,
    functionName: 'isVerified',
    args: [KNOWN_COLLECTION as `0x${string}`],
  });
  
  if (isVerified) {
    console.log("✅ Collection already verified:", KNOWN_COLLECTION);
  } else {
    console.log("Adding collection:", KNOWN_COLLECTION);
    console.log("Setting price:", DEFAULT_PRICE.toString(), "wei (1 MON)");
    
    // First update the price
    const hash1 = await walletClient.writeContract({
      address: CONTRACTS.priceOracle as `0x${string}`,
      abi: priceOracleAbi,
      functionName: 'updatePrice',
      args: [KNOWN_COLLECTION as `0x${string}`, DEFAULT_PRICE],
      account,
    });
    
    console.log("Price update tx:", hash1);
    await publicClient.waitForTransactionReceipt({ hash: hash1 });
    
    // Then verify the collection
    const hash2 = await walletClient.writeContract({
      address: CONTRACTS.priceOracle as `0x${string}`,
      abi: priceOracleAbi,
      functionName: 'setVerifiedCollection',
      args: [KNOWN_COLLECTION as `0x${string}`, true],
      account,
    });
    
    console.log("Verification tx:", hash2);
    await publicClient.waitForTransactionReceipt({ hash: hash2 });
    console.log("✅ Collection added and verified successfully!");
  }
  
  console.log("\nPrice Oracle ready for testing with Chog The Testicule NFTs!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });