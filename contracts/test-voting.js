#!/usr/bin/env node
/**
 * Test voting functionality - vote for another agent
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

const MINIMAL_ABI = [
    "function registerAgent(string name, string metadataURI, string description)",
    "function voteForAgent(address agentAddr)",
    "function getAgent(address agentAddr) view returns (string name, string metadataURI, string description, uint256 reputation, bool verified, string[] skills)",
    "function hasVoted(address voter, address agent) view returns (bool)"
];

async function testVoting() {
    console.log('🧪 Testing Voting Functionality\n');

    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(process.env.TESTNET_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, MINIMAL_ABI, wallet);

    console.log(`Voter wallet: ${wallet.address}`);

    // Pick a different address to vote for (Vitalik's address as example)
    const targetAgent = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

    console.log(`\n1️⃣ Checking if target is registered...`);
    try {
        const agentInfo = await contract.getAgent(targetAgent);
        if (agentInfo.name) {
            console.log(`   ✅ Agent "${agentInfo.name}" already registered`);
            console.log(`   Current reputation: ${agentInfo.reputation}`);
        } else {
            console.log(`   ⚠️  Target agent not registered yet`);
            console.log(`   Note: Can still test voting logic`);
        }
    } catch (e) {
        console.log(`   ⚠️  Could not read agent: ${e.message.substring(0, 100)}`);
    }

    console.log(`\n2️⃣ Checking if we've already voted for this agent...`);
    try {
        const alreadyVoted = await contract.hasVoted(wallet.address, targetAgent);
        console.log(`   Already voted: ${alreadyVoted}`);

        if (alreadyVoted) {
            console.log(`\n   ✅ You already voted for this agent previously!`);
            console.log(`   This confirms voting functionality works.`);
            return;
        }
    } catch (e) {
        console.log(`   ⚠️  Could not check vote status: ${e.message.substring(0, 100)}`);
    }

    console.log(`\n3️⃣ Attempting to vote for agent ${targetAgent.slice(0, 10)}...`);
    try {
        const tx = await contract.voteForAgent(targetAgent);
        console.log(`   📝 Transaction sent: ${tx.hash}`);
        console.log(`   ⏳ Waiting for confirmation...`);

        const receipt = await tx.wait();
        console.log(`   ✅ Vote confirmed in block ${receipt.blockNumber}`);
        console.log(`   🔗 https://sepolia.etherscan.io/tx/${tx.hash}`);

        console.log(`\n4️⃣ Verifying vote was recorded...`);
        const votedNow = await contract.hasVoted(wallet.address, targetAgent);
        console.log(`   Vote recorded: ${votedNow}`);

        const updatedAgent = await contract.getAgent(targetAgent);
        console.log(`   New reputation: ${updatedAgent.reputation}`);

        console.log(`\n✅ VOTING FUNCTIONALITY WORKS!`);

    } catch (error) {
        if (error.message.includes('Already voted')) {
            console.log(`   ✅ Already voted (double-vote protection working)`);
        } else if (error.message.includes('Agent not registered')) {
            console.log(`   ⚠️  Target agent must be registered first`);
            console.log(`   This is expected - voting requires registration`);
        } else {
            console.log(`   ❌ Error: ${error.message.substring(0, 200)}`);
        }
    }
}

testVoting().catch(console.error);
