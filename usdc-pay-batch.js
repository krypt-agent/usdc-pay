/**
 * USDC Pay - Batch Payments & History Tracking
 * Enhanced version with batch operations and payment ledger
 */

import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';

const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const NETWORKS = {
  eth: {
    name: 'Ethereum Sepolia',
    rpc: 'https://ethereum-sepolia.publicnode.com',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    explorer: 'https://sepolia.etherscan.io'
  },
  base: {
    name: 'Base Sepolia',
    rpc: 'https://sepolia.base.org',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    explorer: 'https://sepolia.basescan.org'
  },
  polygon: {
    name: 'Polygon Amoy',
    rpc: 'https://rpc-amoy.polygon.technology',
    usdc: '0x41E94Eb019E0721c35B256B4334d619731713d24',
    explorer: 'https://amoy.polygonscan.com'
  }
};

export class USDCPayBatch {
  constructor(network = 'base', privateKey = null) {
    this.network = NETWORKS[network] || NETWORKS.base;
    this.provider = new ethers.JsonRpcProvider(this.network.rpc);
    this.wallet = privateKey ? new ethers.Wallet(privateKey, this.provider) : null;
    this.usdcContract = new ethers.Contract(
      this.network.usdc,
      USDC_ABI,
      this.wallet || this.provider
    );
    this.historyFile = path.join(process.cwd(), 'payment-history.json');
  }

  /**
   * Get USDC balance
   */
  async getBalance(address) {
    try {
      const balance = await this.usdcContract.balanceOf(address);
      const decimals = await this.usdcContract.decimals();
      const formatted = ethers.formatUnits(balance, decimals);
      return {
        network: this.network.name,
        address,
        balance: formatted,
        wei: balance.toString()
      };
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Send single USDC transfer with history tracking
   */
  async sendUSDC(toAddress, amount, memo = '') {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Provide privateKey to constructor.');
    }

    try {
      const decimals = await this.usdcContract.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      const tx = await this.usdcContract.transfer(toAddress, amountWei);
      console.log(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`Confirmed in block ${receipt.blockNumber}`);

      // Record to history
      await this.recordPayment({
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        from: this.wallet.address,
        to: toAddress,
        amount,
        memo,
        network: this.network.name,
        timestamp: new Date().toISOString(),
        status: 'confirmed'
      });

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        from: this.wallet.address,
        to: toAddress,
        amount,
        memo,
        network: this.network.name,
        explorer: `${this.network.explorer}/tx/${tx.hash}`
      };
    } catch (error) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Send batch payments to multiple addresses
   */
  async sendBatch(payments) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Provide privateKey to constructor.');
    }

    console.log(`\n📦 Processing batch of ${payments.length} payments...`);
    console.log(`From: ${this.wallet.address}\n`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < payments.length; i++) {
      const { to, amount, memo } = payments[i];
      console.log(`[${i + 1}/${payments.length}] Sending ${amount} USDC to ${to}`);

      try {
        const result = await this.sendUSDC(to, amount, memo);
        results.push(result);
        successCount++;
        console.log(`   ✅ Success: ${result.txHash}\n`);
      } catch (error) {
        results.push({
          success: false,
          to,
          amount,
          memo,
          error: error.message
        });
        failCount++;
        console.log(`   ❌ Failed: ${error.message}\n`);
      }
    }

    console.log(`\n📊 Batch Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📄 Total: ${payments.length}\n`);

    return { successCount, failCount, results };
  }

  /**
   * Send batch with approval limit (safety mechanism)
   */
  async sendBatchWithApproval(payments, maxTotalAmount) {
    const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    console.log(`\n🔒 Batch with Approval Check`);
    console.log(`   Total to send: ${totalAmount} USDC`);
    console.log(`   Max allowed: ${maxTotalAmount} USDC\n`);

    if (totalAmount > maxTotalAmount) {
      throw new Error(`Batch total (${totalAmount}) exceeds max allowed (${maxTotalAmount})`);
    }

    // Confirm before proceeding (in automation, this would check an approval)
    console.log('✅ Approval check passed. Proceeding with batch...\n');
    return await this.sendBatch(payments);
  }

  /**
   * Record payment to history file
   */
  async recordPayment(paymentData) {
    try {
      let history = [];
      try {
        const data = await fs.readFile(this.historyFile, 'utf8');
        history = JSON.parse(data);
      } catch (e) {
        // File doesn't exist yet, start fresh
      }

      history.push(paymentData);
      await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error(`⚠️  Failed to record payment history: ${error.message}`);
    }
  }

  /**
   * Get payment history
   */
  async getHistory(limit = 20) {
    try {
      const data = await fs.readFile(this.historyFile, 'utf8');
      const history = JSON.parse(data);
      return history.slice(-limit).reverse();
    } catch (error) {
      return [];
    }
  }

  /**
   * Get payment history by recipient
   */
  async getHistoryByRecipient(recipient) {
    try {
      const data = await fs.readFile(this.historyFile, 'utf8');
      const history = JSON.parse(data);
      return history.filter(p => p.to.toLowerCase() === recipient.toLowerCase());
    } catch (error) {
      return [];
    }
  }

  /**
   * Get payment history by network
   */
  async getHistoryByNetwork(network) {
    try {
      const data = await fs.readFile(this.historyFile, 'utf8');
      const history = JSON.parse(data);
      return history.filter(p => p.network === network);
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate total sent by wallet
   */
  async getTotalSent(network = null) {
    try {
      let history = await this.getHistory();

      if (network) {
        history = history.filter(p => p.network === network);
      }

      const total = history.reduce((sum, p) => {
        return p.success ? sum + parseFloat(p.amount) : sum;
      }, 0);

      return total;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get wallet address
   */
  getAddress() {
    return this.wallet ? this.wallet.address : null;
  }

  /**
   * Switch network
   */
  switchNetwork(network) {
    this.network = NETWORKS[network] || NETWORKS.base;
    this.provider = new ethers.JsonRpcProvider(this.network.rpc);
    this.wallet = this.wallet ? this.wallet.connect(this.provider) : null;
    this.usdcContract = new ethers.Contract(
      this.network.usdc,
      USDC_ABI,
      this.wallet || this.provider
    );
    console.log(`Switched to ${this.network.name}`);
  }
}

export default USDCPayBatch;

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];

  async function main() {
    const privateKey = process.env.TESTNET_PRIVATE_KEY;
    if (!privateKey) {
      console.error('❌ TESTNET_PRIVATE_KEY not found in environment');
      process.exit(1);
    }

    const usdc = new USDCPayBatch('base', privateKey);

    switch (command) {
      case 'batch': {
        // Usage: node usdc-pay-batch.js batch <csv-file>
        const csvFile = args[1];
        if (!csvFile) {
          console.error('Usage: node usdc-pay-batch.js batch <csv-file>');
          process.exit(1);
        }
        console.log('CSV batch support coming soon. Use payments array directly.');
        break;
      }

      case 'history': {
        const limit = parseInt(args[1]) || 20;
        const history = await usdc.getHistory(limit);
        console.log('\n📜 Payment History:');
        if (history.length === 0) {
          console.log('   No payments recorded yet.');
        } else {
          history.forEach((p, i) => {
            console.log(`\n${i + 1}. ${p.timestamp}`);
            console.log(`   To: ${p.to}`);
            console.log(`   Amount: ${p.amount} USDC`);
            console.log(`   Network: ${p.network}`);
            console.log(`   Status: ${p.status}`);
            console.log(`   TX: ${p.txHash}`);
            if (p.memo) console.log(`   Memo: ${p.memo}`);
          });
        }
        break;
      }

      case 'stats': {
        const network = args[1];
        const total = await usdc.getTotalSent(network);
        console.log(`\n💰 Total USDC Sent: ${total} ${network ? `(${network})` : '(all networks)'}`);
        break;
      }

      default:
        console.log(`
Usage:
  node usdc-pay-batch.js history [limit]    - Show payment history
  node usdc-pay-batch.js stats [network]    - Show total sent
  node usdc-pay-batch.js batch <file>       - Process batch payments (CSV)

Supported networks: base, eth, polygon
        `);
    }
  }

  main().catch(console.error);
}
