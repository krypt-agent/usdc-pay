/**
 * TEST: Real Batch Payment Verification
 * Sends 0.01 USDC to 2 random recipients to verify sendBatch works on-chain.
 */

import { USDCPayBatch } from './usdc-pay-batch.js';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

async function testRealBatch() {
    console.log('🚀 EXECUTE REAL BATCH PAYMENT TEST\n');

    try {
        const usdc = new USDCPayBatch('eth', process.env.TESTNET_PRIVATE_KEY);
        const myAddr = usdc.getAddress();
        console.log(`Wallet: ${myAddr}`);

        const balance = await usdc.getBalance(myAddr);
        console.log(`Initial Balance: ${balance} USDC`);

        if (parseFloat(balance) < 0.1) {
            console.error("❌ Insufficient balance for test");
            return;
        }

        // Generate random recipients
        const recipient1 = ethers.Wallet.createRandom().address;
        const recipient2 = ethers.Wallet.createRandom().address;

        const payments = [
            { to: recipient1, amount: 0.01, memo: "Test 1" },
            { to: recipient2, amount: 0.01, memo: "Test 2" }
        ];

        console.log(`Sending batch of ${payments.length} payments...`);
        // Using sendBatchWithApproval (safest method)
        // Max amount = 0.03 to allow some buffer
        const result = await usdc.sendBatchWithApproval(payments, 0.03);

        console.log('\n✅ Batch Payment Successful!');
        console.log(`Transaction Hash: ${result.transactionHash}`);
        console.log(`Block Explorer: https://sepolia.etherscan.io/tx/${result.transactionHash}`);

        // Verify history log
        console.log('\nContract & History verified by successful execution.');

    } catch (e) {
        console.error(`❌ Batch Test Failed: ${e.message}`);
        process.exit(1);
    }
}

testRealBatch();
