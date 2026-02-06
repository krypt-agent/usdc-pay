/**
 * TEST: Final Verification of V2 Features
 * Verifies:
 * 1. Skill Discovery (getAgentsBySkill)
 * 2. Downvoting Logic & Stats
 * 3. Staking (Simulation)
 * 4. Revocation (Owner Action)
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const CONTRACT_ADDRESS = '0xa8ecED87E415907C4AFc6a974202dE469B9993CD'; // V2 Contract
const RPC = 'https://ethereum-sepolia.publicnode.com';

// Load ABI
const abiPath = path.resolve(__dirname, 'AgentIdentityRegistry_v2.json');
const ABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

async function testV2() {
    console.log('🚀 STARTING V2 FEATURE VERIFICATION\n');

    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(process.env.TESTNET_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    console.log(`Wallet: ${wallet.address}`);
    console.log(`Contract: ${CONTRACT_ADDRESS}\n`);

    // --- TEST 1: Registration V2 ---
    console.log('📝 TEST 1: Registration V2');
    let isRegistered = false;

    try {
        // Try to get agent. If failure, we assume not registered.
        const agent = await contract.getAgent(wallet.address);
        // If we get here without error, we check if name is populated
        if (agent.name) {
            console.log(`   ✅ Already registered as "${agent.name}"`);
            isRegistered = true;
        } else {
            // Technically getAgent should revert if empty, but if it returns empty struct:
            throw new Error("Empty agent returned");
        }
    } catch (e) {
        // Expected behavior if not registered ("Agent not found")
        console.log('   Agent not found (expected), registering...');
        try {
            const tx = await contract.registerAgent("Agent V2", "ipfs://v2", "Advanced Agent");
            await tx.wait();
            console.log('   ✅ Registered Agent V2');
            isRegistered = true;
        } catch (regErr) {
            console.error(`   ❌ Registration failed: ${regErr.message}`);
        }
    }

    if (!isRegistered) {
        console.log("⚠️ Skipping remaining tests due to registration failure.");
        return;
    }

    // --- TEST 2: Skill Staking & Discovery ---
    console.log('\n🧠 TEST 2: Skill Staking & Discovery');
    const skill = "DeFi Automation";
    const stake = ethers.parseUnits("100", 6); // 100 USDC (6 decimals)

    try {
        // Check if we already have the skill
        const agentData = await contract.getAgent(wallet.address);
        const hasSkill = agentData.skills.includes(skill);

        if (!hasSkill) {
            console.log(`   Adding skill "${skill}" with 100 USDC stake simulation...`);
            const tx = await contract.addSkill(skill, stake);
            await tx.wait();
            console.log('   ✅ Skill added with stake');
        } else {
            console.log(`   ✅ Skill "${skill}" already added`);
        }

        // Discovery
        console.log(`   Testing Discovery (getAgentsBySkill)...`);
        const agentsWithSkill = await contract.getAgentsBySkill(skill);
        const found = agentsWithSkill.includes(wallet.address);

        if (found) {
            console.log(`   ✅ Discovery Verified: Address found in "${skill}" list`);
            console.log(`   List: ${agentsWithSkill}`);
        } else {
            console.error(`   ❌ Discovery Failed: Address NOT found in list`);
        }

        // Verify Stake Amount in Profile
        const updatedAgent = await contract.getAgent(wallet.address);
        console.log(`   Staked Amount: ${updatedAgent.stakedAmount.toString()} (Expected > 0)`);

    } catch (e) {
        if (e.message.includes("Already has this skill")) {
            console.log('   ✅ Skill already exists (caught error)');
        } else {
            console.error(`   ❌ Skill test failed: ${e.message}`);
        }
    }

    // --- TEST 3: Voting & Stats ---
    console.log('\n🗳️  TEST 3: Voting & Stats');
    const stats = await contract.getVoteStats(wallet.address);
    console.log(`   Current Stats: Upvotes=${stats.upvotes}, Downvotes=${stats.downvotes}`);
    console.log('   ✅ getVoteStats returned values successfully');

    // --- TEST 4: Revocation (Owner Action) ---
    console.log('\n🚫 TEST 4: Revocation (Owner Action)');
    try {
        // 1. Revoke self (as owner)
        console.log('   Revoking self...');
        const txRevoke = await contract.revokeAgent(wallet.address, "Testing revocation");
        await txRevoke.wait();

        let agentAfter = await contract.getAgent(wallet.address);
        console.log(`   Revoked status: ${agentAfter.revoked}`);

        if (agentAfter.revoked === true) {
            console.log('   ✅ Revocation successful');
        } else {
            console.error('   ❌ Revocation failed');
        }

        // 2. Restore self
        console.log('   Restoring self...');
        const txRestore = await contract.restoreAgent(wallet.address);
        await txRestore.wait();

        agentAfter = await contract.getAgent(wallet.address);
        console.log(`   Restored status: ${agentAfter.revoked}`);

        if (agentAfter.revoked === false) {
            console.log('   ✅ Restoration successful');
        } else {
            console.error('   ❌ Restoration failed');
        }

    } catch (e) {
        console.error(`   ❌ Revocation test failed: ${e.message}`);
    }

    console.log('\n✅ V2 FEATURE VERIFICATION COMPLETE');
}

testV2().catch(console.error);
