import hre from "hardhat";
import { formatEther } from "viem";

async function main() {
  console.log("Starting deployment...");
  
  // Deploy PriceOracle
  console.log("Deploying PriceOracle...");
  const priceOracle = await hre.viem.deployContract("PriceOracle");
  const priceOracleAddress = priceOracle.address;
  console.log("PriceOracle deployed to:", priceOracleAddress);
  
  // Deploy NFTRoulette with Pyth Entropy address on Monad Testnet
  const PYTH_ENTROPY_ADDRESS = "0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320";
  console.log("Deploying NFTRoulette...");
  const nftRoulette = await hre.viem.deployContract("NFTRoulette", [
    PYTH_ENTROPY_ADDRESS,
    priceOracleAddress
  ]);
  const nftRouletteAddress = nftRoulette.address;
  console.log("NFTRoulette deployed to:", nftRouletteAddress);
  
  // Fund the contract for VRF fees
  const publicClient = await hre.viem.getPublicClient();
  const walletClient = await hre.viem.getWalletClient();
  
  // Get VRF fee
  const vrfFee = await publicClient.readContract({
    address: nftRouletteAddress,
    abi: [{
      inputs: [],
      name: 'getVRFFee',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    }],
    functionName: 'getVRFFee',
  });
  
  const fundAmount = vrfFee * 10n; // Fund for ~10 games
  console.log("Funding contract with", formatEther(fundAmount), "MON for VRF fees...");
  
  const [account] = await walletClient.getAddresses();
  const hash = await walletClient.sendTransaction({
    account,
    to: nftRouletteAddress,
    value: fundAmount
  });
  
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Contract funded for automatic VRF");
  
  // Wait for a few blocks before verification
  console.log("Waiting for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Verify contracts
  console.log("Verifying contracts...");
  
  try {
    await hre.run("verify:verify", {
      address: priceOracleAddress,
      constructorArguments: [],
    });
    console.log("PriceOracle verified!");
  } catch (error) {
    console.log("PriceOracle verification failed:", error);
  }  
  try {
    await hre.run("verify:verify", {
      address: nftRouletteAddress,
      constructorArguments: [PYTH_ENTROPY_ADDRESS, priceOracleAddress],
    });
    console.log("NFTRoulette verified!");
  } catch (error) {
    console.log("NFTRoulette verification failed:", error);
  }
  
  console.log("\nDeployment complete!");
  console.log("PriceOracle:", priceOracleAddress);
  console.log("NFTRoulette:", nftRouletteAddress);
  console.log("\nSave these addresses for frontend configuration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
