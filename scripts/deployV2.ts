import hre from "hardhat";
import { CONTRACTS } from "../contracts.config";
import { parseEther, formatEther } from "viem";

async function main() {
  console.log("🚀 Deploying NFTRouletteV2...");
  
  // Get deployer
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  
  console.log("Deploying with account:", deployer.account.address);
  
  // Entropy address on Monad testnet (from Pyth docs)
  const ENTROPY_ADDRESS = "0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320";
  
  // Use existing PriceOracle
  console.log("Using existing PriceOracle:", CONTRACTS.priceOracle);
  
  // Deploy NFTRouletteV2
  console.log("\nDeploying NFTRouletteV2...");
  const nftRouletteV2 = await hre.viem.deployContract("NFTRouletteV2", [
    ENTROPY_ADDRESS,
    CONTRACTS.priceOracle
  ]);
  
  console.log("NFTRouletteV2 deployed to:", nftRouletteV2.address);
  
  // Fund contract with MON for VRF fees (0.27 MON = ~10 games)
  console.log("\nFunding contract with MON for VRF fees...");
  const fundAmount = parseEther("0.27");
  
  const fundTx = await deployer.sendTransaction({
    to: nftRouletteV2.address,
    value: fundAmount
  });
  
  await publicClient.waitForTransactionReceipt({ hash: fundTx });
  console.log("Funded with 0.27 MON");
  
  // Get VRF fee to verify
  const vrfFee = await nftRouletteV2.read.getVRFFee();
  console.log("VRF fee per game:", formatEther(vrfFee), "MON");
  
  // Check initial state
  const gameState = await nftRouletteV2.read.gameState();
  console.log("\nInitial game state:", gameState); // Should be 0 (WAITING)
  
  console.log("\n✅ Deployment complete!");
  console.log("\n📝 Update your contracts.config.ts with:");
  console.log(`export const CONTRACTS = {
  priceOracle: '${CONTRACTS.priceOracle}',
  nftRoulette: '${CONTRACTS.nftRoulette}', // V1 (keep for reference)
  nftRouletteV2: '${nftRouletteV2.address}', // V2 - NEW!
};`);
  
  console.log("\n⚠️  Remember to:");
  console.log("1. Update frontend to use V2 contract");
  console.log("2. Update autoVRF script to monitor V2 address");
  console.log("3. Test with your Chog NFT before going live");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
