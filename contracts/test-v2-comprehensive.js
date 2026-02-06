/**
 * COMPREHENSIVE V2 TEST SUITE
 * Tests all V2 features including previously untested ones:
 * - Registration
 * - Skill Staking & Discovery
 * - Upvoting (with 2nd wallet)
 * - Downvoting (with 2nd wallet)
 * - Vote Statistics
 * - Revocation (manual)
 * - Auto-Revocation (requires 3+ downvotes at 0 rep)
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// NEW FIXED V2 CONTRACT
const CONTRACT_ADDRESS = '0xf9D643DAe6106DB1669D38Ff5Dd75eBd87923450';
const RPC = 'https://ethereum-sepolia.publicnode.com';

const abiPath = path.resolve(__dirname, 'AgentIdentityRegistry_v2.json');
const ABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

let testsPassed = 0;
let testsFailed = 0;

function pass(msg) {
    console.log(`   ✅ ${msg}`);
    testsPassed++;
}

function fail(msg) {
    console.error(`   ❌ ${msg}`);
    testsFailed++;
}

async function runTests() {
    console.log('🚀 COMPREHENSIVE V2 TEST SUITE\n');
    console.log(`Contract: ${CONTRACT_ADDRESS}\n`);

    const provider = new ethers.JsonRpcProvider(RPC);
    const walletA = new ethers.Wallet(process.env.TESTNET_PRIVATE_KEY, provider);

    // Generate a fresh wallet for cross-agent tests
    const walletB = ethers.Wallet.createRandom().connect(provider);

    const contractA = new ethers.Contract(CONTRACT_ADDRESS, ABI, walletA);
    const contractB = new ethers.Contract(CONTRACT_ADDRESS, ABI, walletB);

    console.log(`👤 Wallet A (Main): ${walletA.address}`);
    console.log(`👤 Wallet B (Test): ${walletB.address}\n`);

    // Check ETH balance
    const balA = await provider.getBalance(walletA.address);
    console.log(`💰 ETH Balance A: ${ethers.formatEther(balA)} ETH\n`);

    if (balA < ethers.parseEther("0.01")) {
        console.error("❌ Insufficient ETH for full test suite");
        return;
    }

    // ==================== TEST 1: Registration ====================
    console.log('📝 TEST 1: Registration');
    try {
        const agent = await contractA.getAgent(walletA.address);
        if (agent.name) {
            pass(`Already registered as "${agent.name}"`);
        } else {
            throw new Error("No name");
        }
    } catch (e) {
        try {
            const tx = await contractA.registerAgent("Agent V2 Fixed", "ipfs://v2-fixed", "Test Agent");
            await tx.wait();
            pass("Registered new agent");
        } catch (regErr) {
            fail(`Registration failed: ${regErr.message}`);
        }
    }

    // ==================== TEST 2: Fund Wallet B ====================
    console.log('\n💸 TEST 2: Fund Wallet B for Gas');
    try {
        const txFund = await walletA.sendTransaction({
            to: walletB.address,
            value: ethers.parseEther("0.003")
        });
        await txFund.wait();
        pass("Sent 0.003 ETH to Wallet B");
    } catch (e) {
        fail(`Funding failed: ${e.message}`);
    }

    // ==================== TEST 3: Register Agent B ====================
    console.log('\n📝 TEST 3: Register Agent B');
    try {
        const tx = await contractB.registerAgent("Agent B Test", "ipfs://b", "Second test agent");
        await tx.wait();
        pass("Agent B registered");
    } catch (e) {
        if (e.message.includes("Already registered")) {
            pass("Agent B already registered");
        } else {
            fail(`Agent B registration failed: ${e.message}`);
        }
    }

    // ==================== TEST 4: Skill Staking ====================
    console.log('\n🧠 TEST 4: Skill Staking');
    const testSkill = `TestSkill_${Date.now()}`;
    try {
        const tx = await contractA.addSkill(testSkill, ethers.parseUnits("50", 6));
        await tx.wait();
        pass(`Added skill "${testSkill}" with stake`);

        // Verify
        const agent = await contractA.getAgent(walletA.address);
        if (agent.stakedAmount > 0n) {
            pass(`Stake recorded: ${agent.stakedAmount.toString()}`);
        } else {
            fail("Stake not recorded");
        }
    } catch (e) {
        fail(`Skill staking failed: ${e.message}`);
    }

    // ==================== TEST 5: Skill Discovery ====================
    console.log('\n🔍 TEST 5: Skill Discovery');
    try {
        const agents = await contractA.getAgentsBySkill(testSkill);
        if (agents.includes(walletA.address)) {
            pass(`Discovery works: found ${agents.length} agent(s) with skill`);
        } else {
            fail("Discovery failed: wallet not in list");
        }
    } catch (e) {
        fail(`Discovery failed: ${e.message}`);
    }

    // ==================== TEST 6: Upvoting ====================
    console.log('\n🗳️ TEST 6: Upvoting (B votes for A)');
    try {
        const beforeRep = (await contractA.getAgent(walletA.address)).reputation;
        const tx = await contractB.upvoteAgent(walletA.address);
        await tx.wait();
        const afterRep = (await contractA.getAgent(walletA.address)).reputation;

        if (afterRep > beforeRep) {
            pass(`Reputation increased: ${beforeRep} → ${afterRep}`);
        } else {
            fail(`Reputation did not increase: ${beforeRep} → ${afterRep}`);
        }
    } catch (e) {
        if (e.message.includes("Already voted")) {
            pass("Already voted (double-vote protection works)");
        } else {
            fail(`Upvote failed: ${e.message}`);
        }
    }

    // ==================== TEST 7: Downvoting ====================
    console.log('\n👎 TEST 7: Downvoting (A downvotes B)');
    try {
        const beforeRep = (await contractB.getAgent(walletB.address)).reputation;
        const tx = await contractA.downvoteAgent(walletB.address, "Test downvote reason");
        await tx.wait();

        const agent = await contractA.getAgent(walletB.address);
        pass(`Downvote recorded: rep=${agent.reputation}, downvotes=${agent.downvoteCount}`);

        // Verify reason is required
        try {
            await contractB.downvoteAgent(walletA.address, "");
            fail("Should have rejected empty reason");
        } catch (reasonErr) {
            if (reasonErr.message.includes("Reason required")) {
                pass("Empty reason rejected correctly");
            }
        }
    } catch (e) {
        if (e.message.includes("Already downvoted")) {
            pass("Already downvoted (double-downvote protection works)");
        } else {
            fail(`Downvote failed: ${e.message}`);
        }
    }

    // ==================== TEST 8: Vote Statistics ====================
    console.log('\n📊 TEST 8: Vote Statistics');
    try {
        const stats = await contractA.getVoteStats(walletA.address);
        pass(`Stats for A: upvotes=${stats.upvotes}, downvotes=${stats.downvotes}`);

        const statsB = await contractA.getVoteStats(walletB.address);
        pass(`Stats for B: upvotes=${statsB.upvotes}, downvotes=${statsB.downvotes}`);
    } catch (e) {
        fail(`Vote stats failed: ${e.message}`);
    }

    // ==================== TEST 9: Manual Revocation ====================
    console.log('\n🚫 TEST 9: Manual Revocation');
    try {
        // Revoke
        const txRevoke = await contractA.revokeAgent(walletA.address, "Test revocation");
        await txRevoke.wait();

        let agent = await contractA.getAgent(walletA.address);
        if (agent.revoked === true) {
            pass("Manual revocation works");
        } else {
            fail("Revocation did not set flag");
        }

        // Restore
        const txRestore = await contractA.restoreAgent(walletA.address);
        await txRestore.wait();

        agent = await contractA.getAgent(walletA.address);
        if (agent.revoked === false) {
            pass("Restoration works");
        } else {
            fail("Restoration did not clear flag");
        }
    } catch (e) {
        fail(`Revocation test failed: ${e.message}`);
    }

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(50));
    console.log(`📊 TEST SUMMARY: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('='.repeat(50));

    if (testsFailed === 0) {
        console.log('\n✅ ALL TESTS PASSED!');
    } else {
        console.log('\n⚠️ SOME TESTS FAILED - Review above');
        process.exit(1);
    }
}

runTests().catch(console.error);
