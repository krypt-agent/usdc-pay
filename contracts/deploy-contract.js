#!/usr/bin/env node

/**
 * Deploy AgentIdentityRegistry to testnet
 * Usage: node deploy-contract.js [base|eth|polygon]
 */

import { ethers } from 'ethers';

// Network configs
const NETWORKS = {
  base: {
    rpc: 'https://sepolia.base.org',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bDA02913',
    name: 'Base Sepolia',
    chainId: 84532
  },
  eth: {
    rpc: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    name: 'Ethereum Sepolia',
    chainId: 11155111
  },
  polygon: {
    rpc: 'https://rpc-amoy.polygon.technology',
    usdc: '0x41E94Eb019E0721c35B256B4334d619731713d24',
    name: 'Polygon Amoy',
    chainId: 80002
  }
};

async function main() {
  const network = process.argv[2]?.toLowerCase() || 'base';
  const config = NETWORKS[network];
  
  if (!config) {
    console.error('Unknown network. Use: base, eth, or polygon');
    process.exit(1);
  }
  
  console.log(`Deploying AgentIdentityRegistry to ${config.name}...`);
  
  try {
    const provider = new ethers.JsonRpcProvider(config.rpc);
    const privateKey = process.env.TESTNET_PRIVATE_KEY;
    
    if (!privateKey) {
      console.error('TESTNET_PRIVATE_KEY not set in environment');
      console.error('Set it with: export TESTNET_PRIVATE_KEY=0x...');
      process.exit(1);
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Deploy contract
    const contractFactory = new ethers.ContractFactory(
      ['function registerAgent(string,string,string) external',
       'function selfAddSkill(string) external',
       'function voteForAgent(address) external',
       'function getAgent(address) external view returns (address,string,string,uint256,string[],bool)',
       'function getAllAgents(uint256,uint256) external view returns (tuple[])',
       'function verifyAgent(address,bool) external',
       'event AgentRegistered(address,string,string)',
       'event ReputationUpdated(address,uint256,uint256)',
       'event AgentVerified(address,bool)',
       'event AgentSkillAdded(address,string)'
    ],
      ['AgentRegistered(address indexed,string indexed,string indexed)',
       'ReputationUpdated(address indexed,uint256,uint256)',
       'event AgentVerified(address indexed,bool)',
       'event AgentSkillAdded(address indexed,string indexed)'],
      wallet
    );
    
    const contract = await contractFactory.deploy();
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    
    console.log(`\n✅ Deployed successfully!`);
    console.log(`📍 Network: ${config.name}`);
    console.log(`📄 Contract: ${address}`);
    console.log(`🔗 Explorer: https://${config.name === 'base' ? 'sepolia.basescan.org' : config.name === 'eth' ? 'sepolia.etherscan.io' : 'amoy.polygonscan.org'}/address/${address}`);
    console.log(`\nUSDC on this network:`);
    console.log(`💰 ${config.usdc}`);
    
    // Save deployment info
    const deploymentInfo = {
      network: config.name,
      contractAddress: address,
      chainId: config.chainId,
      usdcAddress: config.usdc,
      deployer: wallet.address,
      deployedAt: new Date().toISOString()
    };
    
    console.log('\n--- DEPLOYMENT INFO ---');
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n💡 Next steps:');
    console.log('1. Verify on explorer');
    console.log('2. Test interaction via script');
    console.log('3. Use contract address in Moltbook post');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  }
}

main();
