/**
 * Demo: USDC Batch Payments with History Tracking
 */

import USDCPayBatch from './usdc-pay-batch.js';
import dotenv from 'dotenv';
dotenv.config();

async function demoBatchPayments() {
  console.log('\n🎯 USDC Pay - Batch Payments Demo\n');

  const usdc = new USDCPayBatch('eth', process.env.TESTNET_PRIVATE_KEY);
  const walletAddr = usdc.getAddress();

  console.log(`Wallet: ${walletAddr}\n`);

  // Check balance first
  const balance = await usdc.getBalance(walletAddr);
  console.log(`💰 Balance: ${balance.balance} USDC\n`);

  // Demo batch payments
  // Note: These are demo addresses - in production use real recipient addresses
  const demoPayments = [
    {
      to: '0x1234567890123456789012345678901234567890', // Demo address
      amount: '10.5',
      memo: 'Monthly subscription payment'
    },
    {
      to: '0x0987654321098765432109876543210987654321', // Demo address
      amount: '25.0',
      memo: 'Service fee for Q1'
    },
    {
      to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // Demo address
      amount: '5.5',
      memo: 'Refund processing'
    }
  ];

  console.log('📦 Demo Batch Payments:');
  console.log('   (These are demo addresses - replace with real recipients)\n');
  demoPayments.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.amount} USDC → ${p.to}`);
    console.log(`      Memo: ${p.memo}`);
  });

  console.log('\n⚠️  To execute real batch payments:');
  console.log('   1. Replace demo addresses with real recipients');
  console.log('   2. Ensure sufficient USDC balance');
  console.log('   3. Uncomment the batch execution below\n');

  // Uncomment to execute real batch:
  // const result = await usdc.sendBatchWithApproval(demoPayments, 50);
}

async function demoHistory() {
  console.log('\n📜 Payment History Demo\n');

  const usdc = new USDCPayBatch('eth', process.env.TESTNET_PRIVATE_KEY);

  // Get recent history
  const history = await usdc.getHistory(10);

  console.log('Recent payments:');
  if (history.length === 0) {
    console.log('  No payments recorded yet.\n');
  } else {
    history.forEach((p, i) => {
      console.log(`\n${i + 1}. ${new Date(p.timestamp).toLocaleString()}`);
      console.log(`   To: ${p.to}`);
      console.log(`   Amount: ${p.amount} USDC`);
      console.log(`   Network: ${p.network}`);
      console.log(`   Status: ${p.status}`);
    });
  }

  // Get total sent
  const total = await usdc.getTotalSent();
  console.log(`\n💰 Total USDC sent: ${total}`);
}

async function demoRecipientHistory() {
  console.log('\n🎯 Payment History by Recipient Demo\n');

  const usdc = new USDCPayBatch('eth', process.env.TESTNET_PRIVATE_KEY);

  // Get payments to a specific recipient
  const recipient = '0x1234567890123456789012345678901234567890'; // Demo
  const payments = await usdc.getHistoryByRecipient(recipient);

  console.log(`Payments to ${recipient}:`);
  if (payments.length === 0) {
    console.log('  No payments found to this recipient.\n');
  } else {
    payments.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.timestamp}`);
      console.log(`   Amount: ${p.amount} USDC`);
      console.log(`   Memo: ${p.memo || 'No memo'}`);
      console.log(`   TX: ${p.txHash}`);
    });
  }
}

// Run demos
const command = process.argv[2] || 'batch';

switch (command) {
  case 'batch':
    demoBatchPayments().catch(console.error);
    break;
  case 'history':
    demoHistory().catch(console.error);
    break;
  case 'recipient':
    demoRecipientHistory().catch(console.error);
    break;
  default:
    console.log(`
Usage:
  node demo-batch-payments.js batch      - Demo batch payments
  node demo-batch-payments.js history    - Demo payment history
  node demo-batch-payments.js recipient  - Demo recipient history
    `);
}
