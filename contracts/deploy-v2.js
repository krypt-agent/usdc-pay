/**
 * Deploy AgentIdentityRegistry V2
 * Enhanced with: skill discovery, downvotes, revocation, staking
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const solc = require('solc');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const NETWORKS = {
  eth: {
    name: 'Ethereum Sepolia',
    rpc: 'https://ethereum-sepolia.publicnode.com',
    explorer: 'https://sepolia.etherscan.io'
  },
  base: {
    name: 'Base Sepolia',
    rpc: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org'
  },
  polygon: {
    name: 'Polygon Amoy',
    rpc: 'https://rpc-amoy.polygon.technology',
    explorer: 'https://amoy.polygonscan.com'
  }
};

async function deploy(network = 'base') {
  console.log(`\n🚀 Deploying AgentIdentityRegistry V2 to ${NETWORKS[network].name}...`);

  const config = NETWORKS[network];
  const privateKey = process.env.TESTNET_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ TESTNET_PRIVATE_KEY not found in .env');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(config.rpc);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Deployer: ${wallet.address}`);

  // Read contract source
  const contractPath = path.resolve(__dirname, 'AgentIdentityRegistry_v2.sol');
  const contractSource = fs.readFileSync(contractPath, 'utf8');

  // Compile with solc
  const input = {
    language: 'Solidity',
    sources: {
      'AgentIdentityRegistry_v2.sol': {
        content: contractSource,
      },
    },
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  };

  console.log('🔹 Compiling AgentIdentityRegistry_v2.sol...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error('❌ Compilation errors:', errors);
      process.exit(1);
    }
  }

  const contractComp = output.contracts['AgentIdentityRegistry_v2.sol']['AgentIdentityRegistryV2'];
  const abi = contractComp.abi;
  const bytecode = contractComp.evm.bytecode.object;

  console.log('✅ Compilation successful!');

  // Save ABI
  fs.writeFileSync(path.resolve(__dirname, 'AgentIdentityRegistry_v2.json'), JSON.stringify(abi, null, 2));

  // Get gas price
  const feeData = await provider.getFeeData();
  console.log(`Gas price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);

  try {
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

    console.log('⏳ Deploying contract...');
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log(`\n✅ Contract Deployed!`);
    console.log(`📄 Address: ${address}`);
    console.log(`🔗 ${config.explorer}/address/${address}`);

    // For demo, show what would happen
    console.log('\n📋 Contract features:');
    console.log('   ✅ Skill-based agent discovery');
    console.log('   ✅ Downvotes for disputes');
    console.log('   ✅ Agent revocation (auto + manual)');
    console.log('   ✅ Optional staking for skill verification');
    console.log('   ✅ Enhanced getAgent with more fields');

    // Create a local .env or config for the demo to use the new address?
    // User might want to run demo-batch-payments.js next.
    // That demo currently uses USDCPayBatch which reads USDC address from hardcoded list.
    // But this deployment is the REGISTRY, not USDC.
    // The demo-batch-payments.js doesn't seem to touch the registry?
    // Wait, the user asked about 'demo-batch-payments.js' and 'usdc-pay-batch.js' too.
    // I should check if there is a 'demo-v2-registry.js'.
    // The new features mention "Integration: Identity Registry + USDC Pay V2".

  } catch (error) {
    console.error(`❌ Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run deployment
const network = process.argv[2] || 'base';
deploy(network);
