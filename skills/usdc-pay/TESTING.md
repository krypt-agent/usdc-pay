# Testing Guide for USDC Pay

This guide explains how to run the various tests included in the project to verify functionality.

## Prerequisites

- **Node.js** installed.
- **Dependencies** installed (`npm install`).
- **Testnet Private Key** (for sending transactions). See [TESTNET_GUIDE.md](./TESTNET_GUIDE.md).

## 1. Local Unit Tests
Run the local tests to verify the code structure, class initialization, and parameter validation without making network requests.

```bash
node test-local.js
```

**What it tests:**
- Network configuration correctness.
- Wallet address generation from private keys.
- Error handling logic.

## 2. Integration Tests (Read-Only)
Run the integration tests to check connectivity to the blockchain RPC endpoints and the USDC contract.

```bash
node test.js
```

**What it tests:**
- Connection to Ethereum Sepolia, Base Sepolia, and Polygon Amoy.
- Reading the balance of value `0` from the contract address itself.
- **Note:** Testnet RPCs can be slow. If it hangs, try again.

## 3. Transaction Verification (Live)
Use the verification script to check your actual wallet balance and perform a self-transfer test.

```bash
node verify-transaction.js
```

**Configuration:**
- Ensure you have pasted your private key into the `TESTNET_PRIVATE_KEY` variable in `verify-transaction.js`.
- Ensure the `network` variable matches where you have funds (e.g., `'eth'` for Sepolia, `'base'` for Base Sepolia).

**What it tests:**
- fetching **your** actual USDC balance.
- Sending a transaction (sending 0.1 USDC to yourself).
- Waiting for block confirmation.

## 4. CLI Tools
You can also manually check balances using the CLI.

```bash
# Check balance on Ethereum Sepolia
node check-balance.js eth 0xYourAddress

# Check balance on Base Sepolia
node check-balance.js base 0xYourAddress
```
