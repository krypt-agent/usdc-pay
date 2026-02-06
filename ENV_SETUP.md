# Environment Setup

## `.env` File Configuration

All scripts in this project now load the private key from a `.env` file located at the project root:

```
.env
```

### Setup Instructions

1. Create or edit the `.env` file in the project root:
   ```bash
   nano .env
   ```

2. Add your testnet private key:
   ```
   TESTNET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
   ```

3. Save the file (**NEVER commit this file to git**)

### Files Using `.env`

The following scripts automatically load from `.env`:

- `/verify-transaction.js` - USDC transaction verification
- `/send-usdc.js` - USDC send script
- `/contracts/deploy-contract.js` - Original deployment script
- `/contracts/deploy-fixed.js` - Working deployment script (recommended)
- `/contracts/demo-contract.js` - Contract demo/interaction script

### Security Notes

> [!CAUTION]
> - **NEVER** commit `.env` to version control
> - Use **TESTNET KEYS ONLY**
> - The `.env` file is already in `.gitignore`

### Testing the Setup

Verify your `.env` is properly configured:

```bash
# Check if key is loaded
node -e "import('dotenv').then(d => {d.default.config(); console.log('Key loaded:', !!process.env.TESTNET_PRIVATE_KEY)})"
```

You should see: `Key loaded: true`
