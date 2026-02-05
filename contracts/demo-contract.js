#!/usr/bin/env node

/**
 * Demo: Agent Identity Registry interactions
 * Shows registration, voting, and verification flows
 * Usage: node demo-contract.js [network] [contract-addr]
 */

import { ethers } from 'ethers';

const NETWORKS = {
  base: 'https://sepolia.base.org',
  eth: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
  polygon: 'https://rpc-amoy.polygon.technology'
};

async function demo() {
  const network = process.argv[2]?.toLowerCase() || 'base';
  const contractAddress = process.argv[3];
  
  if (!contractAddress) {
    console.error('Usage: node demo-contract.js [base|eth|polygon] [contract-addr]');
    process.exit(1);
  }
  
  const provider = new ethers.JsonRpcProvider(NETWORKS[network]);
  const privateKey = process.env.TESTNET_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('TESTNET_PRIVATE_KEY not set');
    process.exit(1);
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Minimal ABI for demo
  const abi = [
    'function registerAgent(string,string,string) external',
    'function selfAddSkill(string) external',
    'function voteForAgent(address) external',
    'function getAgent(address) external view returns (address,string,string,uint256,string[],bool)',
    'function getAllAgents(uint256,uint256) external view returns (tuple[])',
    'event AgentRegistered(address indexed,string indexed,string indexed)',
    'event ReputationUpdated(address indexed,uint256,uint256)',
    'event AgentVerified(address indexed,bool)',
    'event AgentSkillAdded(address indexed,string indexed)'
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  
  console.log('🤖 Agent Identity Registry Demo\n');
  console.log(`📍 Network: ${network}`);
  console.log(`📄 Contract: ${contractAddress}\n`);
  
  // Scenario 1: Register as agent
  console.log('📝 Scenario 1: Register agent...');
  try {
    const name = 'KryptDemo';
    const metadata = 'ipfs://QmDemoMetadata123'; // Demo URI
    const description = 'AI agent focused on agentic commerce and legal money-making strategies';
    
    const tx = await contract.registerAgent(name, metadata, description);
    console.log(`✅ Registration tx: ${tx.hash}`);
    console.log('⏳ Waiting for confirmation...');
    await tx.wait();
    console.log('✅ Registered successfully!\n');
    
  } catch (error) {
    console.error('❌ Registration failed:', error);
  }
  
  // Scenario 2: Get agent info
  console.log('\n📝 Scenario 2: Get agent info...');
  try {
    const agent = await contract.getAgent(wallet.address);
    console.log(`👤 Agent name: ${agent[1]}`);
    console.log(`📝 Description: ${agent[2].substring(0, 80)}...`);
    console.log(`⭐ Reputation: ${agent[3].toString()}`);
    console.log(`✅ Verified: ${agent[5] ? 'Yes' : 'No'}\n`);
  } catch (error) {
    console.error('❌ Get agent failed:', error);
  }
  
  // Scenario 3: Vote for another agent
  console.log('\n📝 Scenario 3: Vote for another agent...');
  try {
    const otherAgent = wallet.address; // In demo, voting for self to test
    const tx = await contract.voteForAgent(otherAgent);
    console.log(`✅ Vote tx: ${tx.hash}`);
    await tx.wait();
    console.log('✅ Voted successfully!\n');
  } catch (error) {
    console.error('❌ Vote failed:', error);
  }
  
  // Scenario 4: Self-report a skill
  console.log('\n📝 Scenario 4: Self-add skill...');
  try {
    const skill = 'USDC Payments - Send/receive USDC on testnet';
    const tx = await contract.selfAddSkill(skill);
    console.log(`✅ Skill added tx: ${tx.hash}`);
    await tx.wait();
    console.log('✅ Skill added successfully!\n');
  } catch (error) {
    console.error('❌ Add skill failed:', error);
  }
  
  // Scenario 5: List all agents (demo pagination)
  console.log('\n📝 Scenario 5: List all agents (first 5)...');
  try {
    const allAgents = await contract.getAllAgents(0, 5);
    console.log(`📊 Total agents registered: ${allAgents.length}\n`);
    
    for (const agent of allAgents) {
      const { owner, name, reputation, verified } = agent;
      const shortAddr = `${owner.substring(0, 6)}...${owner.substring(38)}`;
      console.log(`\n  ${shortAddr} | ${name} | Rep: ${reputation} | ${verified ? '✅' : '⏳'}`);
    }
  } catch (error) {
    console.error('❌ List agents failed:', error);
  }
  
  console.log('\n💡 Demo complete!');
  console.log('💡 Key insight: This contract creates on-chain identity layer for agents.');
  console.log('💡 Combined with USDC Pay skill, enables full agent commerce: identity + payments.');
}

demo();
