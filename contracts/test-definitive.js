#!/usr/bin/env node
/**
 * DEFINITIVE VOTING TEST
 * 
 * Strategy:
 * 1. Load main wallet (User A)
 * 2. Generate a fresh random wallet (User B)
 * 3. User A sends some ETH to User B (so B can pay gas)
 * 4. User A registers "Agent A"
 * 5. User B registers "Agent B"
 * 6. User B votes for User A
 * 7. Verify User A's reputation increased
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const CONTRACT_ADDRESS = '0x83523475944d205CE065793bb659D7Ef7f6c53D0';
const RPC = 'https://ethereum-sepolia.publicnode.com';

// Import full ABI from the deployment artifact
const abiPath = path.resolve(__dirname, 'AgentIdentityRegistry.json');
const FULL_ABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));


async function runDefinitiveTest() {
    console.log('🚀 STARTING DEFINITIVE MULTI-WALLET TEST\n');

    // Setup Provider
    const provider = new ethers.JsonRpcProvider(RPC);

    // 1. Setup Main Wallet (User A)
    const walletA = new ethers.Wallet(process.env.TESTNET_PRIVATE_KEY, provider);
    console.log(`👤 User A (Main): ${walletA.address}`);

    // 2. Generate Random Wallet (User B)
    const walletB = ethers.Wallet.createRandom().connect(provider);
    console.log(`👤 User B (New):  ${walletB.address}`);

    // Check Balances
    const balA = await provider.getBalance(walletA.address);
    console.log(`💰 Balance A: ${ethers.formatEther(balA)} ETH`);

    if (balA < ethers.parseEther("0.005")) {
        console.error("❌ Not enough ETH in main wallet to run test. Need ~0.005 ETH.");
        return;
    }

    // 3. Fund User B
    console.log(`\n💸 Sending 0.002 ETH from A to B for gas...`);
    const txFund = await walletA.sendTransaction({
        to: walletB.address,
        value: ethers.parseEther("0.002")
    });
    console.log(`   Tx: ${txFund.hash}`);
    await txFund.wait();
    console.log(`   ✅ Funded User B`);

    // Setup Contracts
    const contractA = new ethers.Contract(CONTRACT_ADDRESS, FULL_ABI, walletA);
    const contractB = new ethers.Contract(CONTRACT_ADDRESS, FULL_ABI, walletB);

    // 4. Register Agent A (if needed)
    console.log(`\n📝 Checking Agent A registration...`);
    const agentAInfo = await contractA.getAgent(walletA.address);
    if (!agentAInfo.name) {
        console.log(`   Registering Agent A...`);
        const txRegA = await contractA.registerAgent("Agent A", "ipfs://a", "Main Agent");
        await txRegA.wait();
        console.log(`   ✅ Registered Agent A`);
    } else {
        console.log(`   ✅ Agent A already registered`);
    }

    // 5. Register Agent B
    console.log(`\n📝 Registering Agent B...`);
    const txRegB = await contractB.registerAgent("Agent B", "ipfs://b", "Secondary Agent");
    console.log(`   Tx: ${txRegB.hash}`);
    await txRegB.wait();
    console.log(`   ✅ Registered Agent B`);

    // 6. User B Votes for User A
    console.log(`\n🗳️  User B voting for User A...`);
    const initialRep = (await contractA.getAgent(walletA.address)).reputation;
    console.log(`   Initial Reputation (A): ${initialRep}`);

    const txVote = await contractB.voteForAgent(walletA.address);
    console.log(`   Tx: ${txVote.hash}`);
    await txVote.wait();
    console.log(`   ✅ Vote Cast!`);

    // 7. Verify Result
    console.log(`\n🔍 Verifying results...`);
    const finalRep = (await contractA.getAgent(walletA.address)).reputation;
    console.log(`   Final Reputation (A):   ${finalRep}`);

    const hasVoted = await contractA.hasVoted(walletB.address, walletA.address);
    console.log(`   Recorded in contract:   ${hasVoted}`);

    if (finalRep > initialRep && hasVoted) {
        console.log(`\n✅ SUCCESS: Cross-agent voting is PROVEN to work!`);
    } else {
        console.error(`\n❌ FAILURE: Reputation did not increase or vote not recorded.`);
    }
}

runDefinitiveTest().catch(console.error);
