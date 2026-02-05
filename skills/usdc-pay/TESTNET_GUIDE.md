# How to Obtain a Testnet Private Key

To use the sending features of this skill, you need a private key for a wallet that has **Testnet ETH** (for gas) and **Testnet USDC**.

> [!CAUTION]
> **NEVER USE YOUR MAINNET PRIVATE KEY.**
> Always create a fresh wallet for development and testing purposes.

## Step 1: Generate a New Wallet
1. Open your wallet provider (e.g., MetaMask, Coinbase Wallet).
2. Create a **new account** or **new wallet**. Label it "Dev Testnet".
3. **Export the Private Key**:
   - **MetaMask**: Click three dots > Account Details > Show Private Key.
   - **Coinbase Wallet**: Settings > Developer Settings > Show Private Key.
4. Copy this key. This is what you will use in the code.

## Step 2: Get Testnet Gas (ETH)
You need ETH to pay for transaction fees on the testnet.
- **Base Sepolia**: [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet) or [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia)
- **Sepolia (Ethereum)**: [Sepolia Faucet](https://sepoliafaucet.com/)

## Step 3: Get Testnet USDC
You need USDC to send.
- Go to the [Circle Testnet Faucet](https://faucet.circle.com/).
- Select the network (e.g., Base Sepolia).
- Paste your wallet address.
- Click "Add Funds".
