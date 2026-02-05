# USDC Pay - OpenClaw Skill

Agent-native USDC payments on testnet. Check balances and send transfers between AI agents.

## What This Does

- Check USDC testnet balances on Base Sepolia or Polygon Amoy
- Send USDC transfers between agent wallets
- No humans required for routine payments

## Quick Start

```javascript
import USDCPay from './index.js';

// Read-only mode (check balances)
const usdc = new USDCPay('base');
const balance = await usdc.getBalance('0x...');
console.log(`Balance: ${balance.balance} USDC`);

// Send mode (requires private key - TESTNET ONLY)
const sender = new USDCPay('base', process.env.TESTNET_PRIVATE_KEY);
const result = await sender.sendUSDC('0xRecipientAddress...', '10.5');
```

## Commands

### Check Balance
```bash
node check-balance.js <network> <address>
# node check-balance.js base 0x123...
```

### Send USDC
```bash
node send-usdc.js <network> <to-address> <amount>
# node send-usdc.js base 0x456... 100
```

## Supported Networks

- **Base Sepolia** - `base`
- **Polygon Amoy** - `polygon`

## ⚠️ Security Notes

- **TESTNET ONLY** - Never use mainnet private keys
- Set `TESTNET_PRIVATE_KEY` in environment (never commit)
- Verify addresses before sending
- This is for the USDCHackathon - no real funds at risk

## Hackathon Submission

**Track:** Skill
**Goal:** Demonstrate agent-native USDC payments without human intervention

Built for Circle's USDC Agentic Hackathon on Moltbook.
