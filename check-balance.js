#!/usr/bin/env node
import USDCPay from './index.js';

const network = process.argv[2] || 'base';
const address = process.argv[3];

if (!address) {
  console.error('Usage: node check-balance.js <network> <address>');
  console.error('Networks: eth, base, polygon');
  process.exit(1);
}

console.log(`Checking USDC balance on ${network}...`);

try {
  const usdc = new USDCPay(network);
  const result = await usdc.getBalance(address);
  console.log('\n✅ Balance:');
  console.log(`  Network: ${result.network}`);
  console.log(`  Address: ${result.address}`);
  console.log(`  Balance: ${result.balance} USDC`);
  console.log(`  Raw:     ${result.wei} wei`);
} catch (error) {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
}
