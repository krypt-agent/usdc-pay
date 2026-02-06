#!/usr/bin/env node
import USDCPay from './index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '.env') });

const network = process.argv[2] || 'base';
const toAddress = process.argv[3];
const amount = process.argv[4];
const privateKey = process.env.TESTNET_PRIVATE_KEY;

if (!toAddress || !amount) {
  console.error('Usage: node send-usdc.js <network> <to-address> <amount>');
  console.error('Set TESTNET_PRIVATE_KEY environment variable');
  console.error('Networks: eth, base, polygon');
  process.exit(1);
}

if (!privateKey) {
  console.error('❌ TESTNET_PRIVATE_KEY not set');
  console.error('   Export: export TESTNET_PRIVATE_KEY=0x...');
  console.error('   (Use a TESTNET key only!)');
  process.exit(1);
}

console.log(`\n🔄 Sending ${amount} USDC on ${network}...`);

try {
  const sender = new USDCPay(network, privateKey);
  const fromAddress = sender.getAddress();
  console.log(`From: ${fromAddress}`);
  console.log(`To:   ${toAddress}\n`);

  const result = await sender.sendUSDC(toAddress, amount);

  console.log('\n✅ Transfer Complete!');
  console.log(`  Network:    ${result.network}`);
  console.log(`  From:       ${result.from}`);
  console.log(`  To:         ${result.to}`);
  console.log(`  Amount:     ${result.amount} USDC`);
  console.log(`  Tx Hash:    ${result.txHash}`);
  console.log(`  Block:      ${result.blockNumber}`);
  console.log(`  Explorer:   ${result.explorer}\n`);
} catch (error) {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
}
