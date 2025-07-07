import hre from "hardhat";
import { CONTRACTS } from "../contracts.config";

async function main() {
  console.log("Testing multiple NFT deposit accumulation...\n");
  
  const publicClient = await hre.viem.getPublicClient();
  
  const abi = [
    {
      inputs: [{ name: 'player', type: 'address' }],
      name: 'getPlayerInfo',
      outputs: [
        { name: 'ticketStart', type: 'uint256' },
        { name: 'ticketEnd', type: 'uint256' },
        { 
          name: 'deposits', 
          type: 'tuple[]',
          components: [
            { name: 'collection', type: 'address' },
            { name: 'tokenId', type: 'uint256' }
          ]
        }
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getPlayerAddresses',
      outputs: [{ name: '', type: 'address[]' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'totalTickets',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    }
  ] as const;
  
  console.log("NFTRoulette:", CONTRACTS.nftRoulette);
  
  // Get all players
  const playerAddresses = await publicClient.readContract({
    address: CONTRACTS.nftRoulette as `0x${string}`,
    abi,
    functionName: 'getPlayerAddresses',
  });
  
  const totalTickets = await publicClient.readContract({
    address: CONTRACTS.nftRoulette as `0x${string}`,
    abi,
    functionName: 'totalTickets',
  });
  
  console.log("Total tickets in game:", totalTickets.toString());
  console.log("Number of players:", playerAddresses.length);
  
  // Check each player's ticket accumulation
  for (const player of playerAddresses) {
    const [ticketStart, ticketEnd, deposits] = await publicClient.readContract({
      address: CONTRACTS.nftRoulette as `0x${string}`,
      abi,
      functionName: 'getPlayerInfo',
      args: [player],
    });
    
    const ticketCount = Number(ticketEnd) - Number(ticketStart);
    
    console.log(`\nPlayer: ${player}`);
    console.log(`  Ticket Range: ${ticketStart} - ${ticketEnd}`);
    console.log(`  Total Tickets: ${ticketCount}`);
    console.log(`  NFTs Deposited: ${deposits.length}`);
    console.log(`  Tickets per NFT: ${deposits.length > 0 ? ticketCount / deposits.length : 0}`);
    
    if (deposits.length > 1) {
      console.log("  ✅ Multiple deposits detected!");
      console.log(`  Expected tickets: ${deposits.length * 1000}`);
      console.log(`  Actual tickets: ${ticketCount}`);
      console.log(`  ${ticketCount === deposits.length * 1000 ? '✅ CORRECT!' : '❌ INCORRECT!'}`);
    }
  }
  
  console.log("\n🔍 Summary:");
  console.log("The fix ensures that when a player deposits multiple NFTs:");
  console.log("- First deposit sets the ticketStart");
  console.log("- Each deposit extends the ticketEnd");
  console.log("- Total tickets = number of NFTs × 1000");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });