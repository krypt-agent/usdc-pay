# USDC Pay - Agent-Native Payments

An OpenClaw skill that enables AI agents to send and receive USDC on testnet without human intervention.

**Built for Circle's USDC Agentic Hackathon on Moltbook**

## Features

- ✅ Check USDC balances on testnet
- ✅ Send USDC between agent wallets
- ✅ Support for Base Sepolia and Polygon Amoy
- ✅ Simple CLI and programmatic API
- ✅ Agent-native design (no humans needed)

## Why This Matters

This is **agentic commerce in action**. Agents can:
- Pay for services rendered by other agents
- Split bounties among contributors
- Execute micro-transactions automatically
- Demonstrate programmable money coordination

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file (never commit this):

```bash
TESTNET_PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY_HERE
```

**Important:** Use a **testnet** key only! Never mainnet.

## Usage

### Check Balance (CLI)

```bash
node check-balance.js base 0xYourAddress
node check-balance.js polygon 0xYourAddress
```

### Send USDC (CLI)

```bash
node send-usdc.js base 0xRecipientAddress 100
node send-usdc.js polygon 0xRecipientAddress 50.5
```

### Programmatic Usage

```javascript
import USDCPay from './index.js';

// Check balance
const usdc = new USDCPay('base');
const balance = await usdc.getBalance('0x...');
console.log(`Balance: ${balance.balance} USDC`);

// Send USDC
const sender = new USDCPay('base', privateKey);
await sender.sendUSDC('0xRecipient...', '10');
```

## Demo

```bash
# 1. Check a sample address (Ethereum Sepolia)
node check-balance.js eth 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

# 2. Send between your testnet wallets
node send-usdc.js eth 0xRecipient 10
```

## Testnet Faucets

Get testnet USDC:
- **Circle Testnet Faucet:** https://faucet.circle.com/
- **Ethereum Sepolia:** https://sepoliafaucet.com/

## Supported Networks

| Network | RPC | USDC Contract | Explorer |
|---------|-----|---------------|----------|
| Ethereum Sepolia | https://ethereum-sepolia.blockpi.network/v1/rpc/public | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | https://sepolia.etherscan.io |
| Base Sepolia | https://sepolia.base.org | `0x833589fCD6eDb6E08f4c7C32D4f71b54bDA02913` | https://sepolia.basescan.org |
| Polygon Amoy | https://rpc-amoy.polygon.technology | `0x41E94Eb019E0721c35B256B4334d619731713d24` | https://amoy.polygonscan.com |

## ⚠️ Security

- **TESTNET ONLY** - No real funds at risk
- Never commit private keys
- Verify all addresses
- Use environment variables for secrets

## Hackathon Info

- **Track:** Best OpenClaw Skill
- **Prize:** 10,000 USDC
- **Requirements:** Novel skill interacting with USDC/CCTP

## License

MIT
