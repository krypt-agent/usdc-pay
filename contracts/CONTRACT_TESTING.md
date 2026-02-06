# Contract Testing Guide

This guide explains how to test the AgentIdentityRegistry contract after fixing the bugs identified in the evaluation.

## Prerequisites

**IMPORTANT**: The contract has several critical bugs that must be fixed before deployment:
1. Missing `hasVoted` state variable
2. Broken deployment script
3. Incorrect return values in `getAgent()`

See `contract_evaluation.md` for full details.

## Testing Option 1: Remix IDE (Recommended for Quick Testing)

### Step 1: Open Remix
Go to [remix.ethereum.org](https://remix.ethereum.org)

### Step 2: Create Contract File
1. In File Explorer, create `AgentIdentityRegistry.sol`
2. Copy the contract from `/home/cacharro/agent_workspace/contracts/AgentIdentityRegistry.sol`
3. **Fix the bugs first** (see evaluation report)

### Step 3: Compile
1. Go to "Solidity Compiler" tab
2. Select compiler version `0.8.20`
3. Click "Compile AgentIdentityRegistry.sol"
4. Check for errors

### Step 4: Deploy to Testnet
1. Go to "Deploy & Run Transactions" tab
2. Environment: Select "Injected Provider - MetaMask"
3. Connect MetaMask to Base Sepolia (or Ethereum Sepolia)
4. Click "Deploy"
5. Confirm in MetaMask

### Step 5: Test Interactions
Once deployed, test these functions in order:

1. **Register Agent**
   - Function: `registerAgent`
   - Params: 
     - name: "TestAgent"
     - metadata: "ipfs://demo"
     - description: "Test agent for hackathon"

2. **Get Agent Info**
   - Function: `getAgent`
   - Param: Your wallet address
   - Should return your agent details

3. **Add Skill**
   - Function: `selfAddSkill`
   - Param: "USDC Payments"

4. **Vote** (need second wallet)
   - Switch MetaMask account
   - Register second agent
   - Vote for first agent using `voteForAgent`

## Testing Option 2: Hardhat (Professional Setup)

### Step 1: Install Hardhat
```bash
cd /home/cacharro/agent_workspace/contracts
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### Step 2: Initialize Hardhat
```bash
npx hardhat init
```
Choose: "Create a JavaScript project"

### Step 3: Configure Network
Edit `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.TESTNET_PRIVATE_KEY]
    }
  }
};
```

### Step 4: Move Contract
```bash
mv AgentIdentityRegistry.sol contracts/
```

### Step 5: Compile
```bash
npx hardhat compile
```

### Step 6: Create Deployment Script
Create `scripts/deploy.js`:
```javascript
async function main() {
  const AgentRegistry = await ethers.getContractFactory("AgentIdentityRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  
  console.log("Deployed to:", await registry.getAddress());
}

main();
```

### Step 7: Deploy
```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

### Step 8: Write Tests
Create `test/AgentRegistry.test.js`:
```javascript
const { expect } = require("chai");

describe("AgentIdentityRegistry", function () {
  it("Should register an agent", async function () {
    const Registry = await ethers.getContractFactory("AgentIdentityRegistry");
    const registry = await Registry.deploy();
    
    await registry.registerAgent("TestAgent", "ipfs://...", "Test description");
    
    const agent = await registry.getAgent(await registry.signer.getAddress());
    expect(agent[1]).to.equal("TestAgent");
  });
});
```

Run tests:
```bash
npx hardhat test
```

## Manual Testing Checklist

- [ ] Contract compiles without errors
- [ ] Deploys successfully to testnet
- [ ] Can register an agent
- [ ] Can retrieve agent info
- [ ] Can add skills
- [ ] Can vote for another agent (prevents self-voting)
- [ ] Prevents duplicate registrations
- [ ] Prevents duplicate votes
- [ ] Owner can verify agents
- [ ] Events are emitted correctly

## Verifying on Block Explorer

After deployment, verify the contract:

**Using Hardhat:**
```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

**Manually on Basescan:**
1. Go to contract address on explorer
2. Click "Contract" tab
3. Click "Verify and Publish"
4. Paste Solidity code
5. Select compiler version 0.8.20
6. Submit

## Expected Gas Costs (Base Sepolia)

- Deploy: ~1,500,000 gas
- Register: ~150,000 gas
- Vote: ~80,000 gas
- Add Skill: ~100,000 gas

Make sure you have testnet ETH for gas!
