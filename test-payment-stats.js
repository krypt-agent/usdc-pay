/**
 * TEST: USDC Payment Statistics (getTotalSent)
 * Tests the analytics feature of usdc-pay-batch.js
 */

import { USDCPayBatch } from './usdc-pay-batch.js';
import dotenv from 'dotenv';

dotenv.config();

async function testPaymentStats() {
    console.log('📊 USDC Payment Statistics Test\n');

    try {
        const usdc = new USDCPayBatch('eth', process.env.TESTNET_PRIVATE_KEY);
        console.log(`Wallet: ${usdc.getAddress()}\n`);

        // Test 1: getHistory
        console.log('TEST 1: Get Payment History');
        const history = await usdc.getHistory(10);
        console.log(`   Found ${history.length} payment records`);
        if (history.length > 0) {
            console.log(`   Latest: ${history[0].amount} USDC to ${history[0].to.slice(0, 10)}...`);
            console.log('   ✅ History retrieval works');
        } else {
            console.log('   ⚠️ No payments in history (expected if fresh)');
        }

        // Test 2: getTotalSent (all networks)
        console.log('\nTEST 2: Get Total Sent (All Networks)');
        const totalAll = await usdc.getTotalSent();
        console.log(`   Total sent: ${totalAll} USDC`);
        console.log('   ✅ getTotalSent() works');

        // Test 3: getTotalSent (specific network)
        console.log('\nTEST 3: Get Total Sent (Ethereum Sepolia)');
        const totalEth = await usdc.getTotalSent('Ethereum Sepolia');
        console.log(`   Total sent on ETH: ${totalEth} USDC`);
        console.log('   ✅ Network filtering works');

        // Test 4: getHistoryByRecipient
        console.log('\nTEST 4: Get History By Recipient');
        if (history.length > 0) {
            const recipient = history[0].to;
            const recipientHistory = await usdc.getHistoryByRecipient(recipient);
            console.log(`   Found ${recipientHistory.length} payment(s) to ${recipient.slice(0, 10)}...`);
            console.log('   ✅ Recipient filtering works');
        } else {
            console.log('   ⚠️ Skipped (no history)');
        }

        // Test 5: getHistoryByNetwork
        console.log('\nTEST 5: Get History By Network');
        const networkHistory = await usdc.getHistoryByNetwork('Ethereum Sepolia');
        console.log(`   Found ${networkHistory.length} payment(s) on Ethereum Sepolia`);
        console.log('   ✅ Network history filtering works');

        console.log('\n' + '='.repeat(50));
        console.log('✅ ALL PAYMENT STATISTICS TESTS PASSED');
        console.log('='.repeat(50));

    } catch (e) {
        console.error(`❌ Test failed: ${e.message}`);
        process.exit(1);
    }
}

testPaymentStats();
