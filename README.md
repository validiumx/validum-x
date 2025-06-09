# Validium-X Coin (VLDX)

Smart contracts for the Validium-X Coin (VLDX) tokenomics system.

## Overview

Validium-X Coin (VLDX) is an ERC-20 token with governance capabilities, designed with the following features:

- Total Initial Supply: 20,000,000,000 VLDX
- Maximum Supply: 30,000,000,000 VLDX
- Minting Mechanism: Tokens are only minted on demand, triggered by app usage or community requirements
- Burn Mechanism: Unsold tokens in the presale or any tokens designated by governance may be burned
- Transaction Fees: No transaction fees applied on transfers

## Contract Architecture

The project consists of the following smart contracts:

1. **VLDX.sol**: The main ERC-20 token contract with governance capabilities
2. **VLDXPresale.sol**: Implements a bonding curve presale for VLDX tokens
3. **VLDXLiquidity.sol**: Manages Uniswap V3 liquidity for VLDX
4. **VLDXSwapper.sol**: Facilitates token swaps between VLDX and other tokens

## World Chain Configuration

The contracts are designed to be deployed on World Chain with the following configuration:

### Network Information

- **Mainnet Chain ID**: 480
- **Sepolia Testnet Chain ID**: 4801
- **Mainnet Explorer**: https://worldscan.org
- **Sepolia Explorer**: https://worldchain-sepolia.explorer.alchemy.com

### Contract Addresses

- **SwapRouter02 (Uniswap V3)**: 0x091AD9e2e6e5eD44c1c66dB50e49A601F9f36cF6
- **NonfungiblePositionManager**: 0xec12a9F9a09f50550686363766Cc153D03c27b5e
- **Permit2 (Uniswap V3)**: 0x000000000022D473030F116dDEE9F6B43aC78BA3
- **WETH Address**: 0x4200000000000000000000000000000000000006
- **WLD Address**: 0x2cfc85d8e48f8eab294be644d9e25c3030863003

## Development Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Hardhat

### Installation

1. Clone the repository:
   \`\`\`
   git clone https://github.com/your-username/validium-x-contracts.git
   cd validium-x-contracts
   \`\`\`

2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

3. Create a `.env` file based on `.env.example` and fill in your private keys and API keys:
   \`\`\`
   WORLD_CHAIN_MAINNET_URL=https://worldchain-mainnet.g.alchemy.com/public
   WORLD_CHAIN_TESTNET_URL=https://worldchain-sepolia.g.alchemy.com/public
   PRIVATE_KEY=your_private_key_here
   ETHERSCAN_API_KEY=your_etherscan_api_key_here
   \`\`\`

### Compilation

Compile the smart contracts:

\`\`\`
npm run compile
\`\`\`

## Deployment Process

The deployment process is divided into several scripts to ensure a controlled and sequential deployment:

### 1. Deploy Contracts

Deploy the main contracts (VLDX token, Presale, Liquidity, and Swapper):

\`\`\`
npx hardhat run scripts/deploy.js --network world-testnet
\`\`\`

For mainnet deployment:

\`\`\`
npx hardhat run scripts/deploy.js --network world-mainnet
\`\`\`

This script will:
- Deploy all contracts
- Set up initial roles and permissions
- Save deployment information to `deployment-info.json`

### 2. Distribute Initial Tokens

Distribute the initial token allocations according to the tokenomics plan:

\`\`\`
npx hardhat run scripts/distribute-tokens.js --network world-testnet
\`\`\`

For mainnet:

\`\`\`
npx hardhat run scripts/distribute-tokens.js --network world-mainnet
\`\`\`

### 3. Start Presale

Start the bonding curve presale:

\`\`\`
npx hardhat run scripts/start-presale.js --network world-testnet
\`\`\`

For mainnet:

\`\`\`
npx hardhat run scripts/start-presale.js --network world-mainnet
\`\`\`

### 4. End Presale

After the presale period, end and finalize the presale:

\`\`\`
npx hardhat run scripts/end-presale.js --network world-testnet
\`\`\`

For mainnet:

\`\`\`
npx hardhat run scripts/end-presale.js --network world-mainnet
\`\`\`

### 5. Add Liquidity

Add liquidity to Uniswap V3 for VLDX/WLD and VLDX/WETH pairs:

\`\`\`
npx hardhat run scripts/add-liquidity.js --network world-testnet
\`\`\`

For mainnet:

\`\`\`
npx hardhat run scripts/add-liquidity.js --network world-mainnet
\`\`\`

### 6. Enable Trading

Enable token transfers to make VLDX fully tradable:

\`\`\`
npx hardhat run scripts/enable-trading.js --network world-testnet
\`\`\`

For mainnet:

\`\`\`
npx hardhat run scripts/enable-trading.js --network world-mainnet
\`\`\`

## Contract Verification

After deployment, verify the contracts on the block explorer:

\`\`\`
npx hardhat verify --network world-testnet CONTRACT_ADDRESS CONSTRUCTOR_ARGS
\`\`\`

Replace `CONTRACT_ADDRESS` and `CONSTRUCTOR_ARGS` with the actual values. The exact verification commands are output by the deployment script.

## Security Considerations

Before deploying to mainnet, consider the following security measures:

1. Conduct a thorough security audit by a reputable firm
2. Test extensively on testnet
3. Set up a multisig wallet for admin functions
4. Implement a timelock for critical operations
5. Verify all contract interactions with Uniswap V3

## License

MIT

## Contact

For questions or support, please contact the Validium-X team.
