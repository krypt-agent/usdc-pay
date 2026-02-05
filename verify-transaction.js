import USDCPay from './index.js';

// ==========================================
// 🔑 ENTER YOUR TESTNET PRIVATE KEY BELOW
// ==========================================
const TESTNET_PRIVATE_KEY = '';
// Example: '0xabc123...'
// ==========================================

async function runVerification() {
    console.log('🔐 USDC Pay - Transaction Verification');

    if (TESTNET_PRIVATE_KEY === 'PLACEHOLDER_KEY') {
        console.error('\n❌ ERROR: Private Key not set.');
        console.error('------------------------------------------------');
        console.error('Please open this file (verify-transaction.js) and');
        console.error('replace "PLACEHOLDER_KEY" with your private key.');
        console.error('See TESTNET_GUIDE.md for instructions.');
        console.error('------------------------------------------------');
        process.exit(1);
    }

    const network = 'base'; // Default to Base Sepolia
    console.log(`\n📡 Connecting to ${network}...`);

    try {
        const sender = new USDCPay(network, TESTNET_PRIVATE_KEY);
        const address = sender.getAddress();
        console.log(`👤 Wallet Address: ${address}`);

        // 1. Check Balance
        console.log('\n💰 Checking balance...');
        const balance = await sender.getBalance(address);
        console.log(`   Balance: ${balance.balance} USDC`);

        // 2. Send Self-Transfer (Verification)
        // We send 0.1 USDC to ourselves to verify capability without losing funds (other than gas)
        const amount = '0.1';

        if (parseFloat(balance.balance) < parseFloat(amount)) {
            console.error(`\n❌ Insufficient balance. You have ${balance.balance} USDC but need at least ${amount}.`);
            console.error('Please use the Circle Faucet to get testnet USDC.');
            return;
        }

        console.log(`\n🔄 Attempting self-transfer of ${amount} USDC to verify sending capability...`);
        const result = await sender.sendUSDC(address, amount);

        console.log('\n✅ Transaction Successful!');
        console.log(`   Tx Hash: ${result.txHash}`);
        console.log(`   Explorer: ${result.explorer}`);

    } catch (error) {
        console.error(`\n❌ Verification Failed: ${error.message}`);
    }
}

runVerification();
