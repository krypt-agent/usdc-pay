#!/usr/bin/env node
import USDCPay from './index.js';

console.log('🧪 USDC Pay Skill Test\n');

// Test 1: Read-only balance check (Ethereum Sepolia)
console.log('Test 1: Checking USDC contract address on Ethereum Sepolia...');
try {
  const usdc = new USDCPay('eth');
  console.log('  ✅ USDC Pay initialized on Ethereum Sepolia');
  console.log(`  📄 USDC Contract: ${usdc.network.usdc}`);

  // Check balance of USDC contract itself (should have 0)
  const balance = await usdc.getBalance(usdc.network.usdc);
  console.log(`  💰 Balance: ${balance.balance} USDC`);
} catch (error) {
  console.error(`  ❌ Failed: ${error.message}`);
}

// Test 2: Read-only balance check (Base Sepolia)
console.log('\nTest 2: Checking USDC contract address on Base Sepolia...');
try {
  const usdc = new USDCPay('base');
  console.log('  ✅ USDC Pay initialized on Base Sepolia');
  console.log(`  📄 USDC Contract: ${usdc.network.usdc}`);

  const balance = await usdc.getBalance(usdc.network.usdc);
  console.log(`  💰 Balance: ${balance.balance} USDC`);
} catch (error) {
  console.error(`  ❌ Failed: ${error.message}`);
}

// Test 3: Address check
console.log('\nTest 3: Checking sample address on Ethereum Sepolia...');
try {
  const usdc = new USDCPay('eth');
  const testAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'; // USDC contract
  const balance = await usdc.getBalance(testAddress);
  console.log(`  ✅ Address: ${testAddress}`);
  console.log(`  💰 Balance: ${balance.balance} USDC`);
  console.log(`  📊 Raw: ${balance.wei}`);
} catch (error) {
  console.error(`  ❌ Failed: ${error.message}`);
}

console.log('\n✅ All tests completed!');
console.log('\nTo test transfers:');
console.log('  1. Set TESTNET_PRIVATE_KEY environment variable');
console.log('  2. Get testnet USDC from faucet');
console.log('  3. Run: node send-usdc.js base <recipient> <amount>');
