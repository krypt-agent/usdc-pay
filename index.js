import { ethers } from 'ethers';

// USDC Contract ABI (minimal - what we need)
const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

// Testnet configurations (verified Circle deployments - updated 2026-02-05)
const NETWORKS = {
  eth: {
    name: 'Ethereum Sepolia',
    rpc: 'https://ethereum-sepolia.publicnode.com',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    explorer: 'https://sepolia.etherscan.io'
  },
  base: {
    name: 'Base Sepolia',
    rpc: 'https://rpc.sepolia.base.org',
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

class USDCPay {
  constructor(network = 'base', privateKey = null) {
    this.network = NETWORKS[network] || NETWORKS.base;
    this.provider = new ethers.JsonRpcProvider(this.network.rpc);
    this.wallet = privateKey ? new ethers.Wallet(privateKey, this.provider) : null;
    this.usdcContract = new ethers.Contract(
      this.network.usdc,
      USDC_ABI,
      this.wallet || this.provider
    );
  }

  /**
   * Get USDC balance for an address
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
   * Send USDC to another address (requires wallet with private key)
   */
  async sendUSDC(toAddress, amount) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Provide privateKey to constructor.');
    }

    try {
      const decimals = await this.usdcContract.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      const tx = await this.usdcContract.transfer(toAddress, amountWei);
      console.log(`Transaction sent: ${tx.hash}`);
      console.log(`Track: ${this.network.explorer}/tx/${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`Confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        from: this.wallet.address,
        to: toAddress,
        amount,
        network: this.network.name,
        explorer: `${this.network.explorer}/tx/${tx.hash}`
      };
    } catch (error) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Get wallet address (if initialized)
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
  }
}

export default USDCPay;
