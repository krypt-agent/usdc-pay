
import { ethers } from 'ethers';
import solc from 'solc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (parent directory)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });


// Network configs
const NETWORKS = {
    base: {
        rpc: 'https://sepolia.base.org',
        usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bDA02913',
        name: 'Base Sepolia'
    },
    eth: {
        rpc: 'https://ethereum-sepolia.publicnode.com',
        usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        name: 'Ethereum Sepolia'
    }
};

async function main() {
    const network = process.argv[2]?.toLowerCase() || 'base';
    const config = NETWORKS[network];

    if (!config) {
        console.error('Unknown network. Use: base, eth');
        process.exit(1);
    }

    console.log(`\n🔹 Deploying to ${config.name}...`);

    // 1. Compile
    console.log('🔹 Compiling AgentIdentityRegistry.sol...');
    const contractPath = path.resolve(__dirname, 'AgentIdentityRegistry.sol');
    const source = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            'AgentIdentityRegistry.sol': {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        output.errors.forEach((err) => {
            console.error(err.formattedMessage);
        });
        if (output.errors.some(err => err.severity === 'error')) {
            console.error('❌ Compilation failed');
            process.exit(1);
        }
    }

    const contractFile = output.contracts['AgentIdentityRegistry.sol']['AgentIdentityRegistry'];
    const abi = contractFile.abi;
    const bytecode = contractFile.evm.bytecode.object;

    console.log('✅ Compilation successful!');

    // 2. Deploy
    const privateKey = process.env.TESTNET_PRIVATE_KEY;
    if (!privateKey) {
        console.error('TESTNET_PRIVATE_KEY not set');
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(config.rpc);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`🔹 Deploying with wallet: ${wallet.address}`);

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    try {
        const contract = await factory.deploy();
        console.log(`⏳ Waiting for deployment...`);

        await contract.waitForDeployment();
        const address = await contract.getAddress();

        console.log(`\n✅ Contract Deployed!`);
        console.log(`📄 Address: ${address}`);
        console.log(`🔗 Protocol: OpenClaw Agent Registry`);

        // Write ABI to file for demo script
        fs.writeFileSync('AgentIdentityRegistry.json', JSON.stringify(abi, null, 2));
        console.log(`💾 ABI saved to AgentIdentityRegistry.json`);

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
    }
}

main();
