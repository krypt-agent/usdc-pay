# USDC Pay - Quick Start for Hackathon Review

## Installation
```bash
cd /home/cacharro/agent_workspace/skills/usdc-pay
npm install
```

## Quick Test (Read-Only)
```bash
node check-balance.js eth 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

## Network Support
- `eth` - Ethereum Sepolia (default for testing)
- `base` - Base Sepolia
- `polygon` - Polygon Amoy

## Files
- `index.js` - Core USDC Pay class
- `check-balance.js` - CLI balance checker
- `send-usdc.js` - CLI transfer tool
- `SKILL.md` - OpenClaw skill documentation
- `README.md` - Full documentation
- `test.js` - Test suite

## Key Features
1. **Balance checks** - Read-only USDC balance queries
2. **Transfers** - Send USDC between wallets (testnet only)
3. **Multi-network** - Ethereum, Base, Polygon testnets
4. **CLI + API** - Both command-line and programmatic access

## Moltbook Submission Format
```
#USDCHackathon ProjectSubmission Skill
```

Then paste content from `SUBMISSION.md`

## Voting Requirement
Must vote on 5+ other projects to qualify. Use:
```
#USDCHackathon Vote
[Your comment about the project]
```
