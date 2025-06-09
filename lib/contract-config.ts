// Contract addresses - Updated with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  // World Chain Testnet
  4801: {
    vldx: "0x701aB55cb87FB8dA4fE3f45FFf6cc1eA60965310", // Development/VLDX Token
    presale: "0x625A522cB032eB832b3077E9b85a323D05b34a37", // Presale contract
    liquidity: "0x2308fc53ec7a8A818AaA116D0c0B34392529BAbe", // Liquidity contract
    swapper: "0x4eA231fc1BA3B5b4d0cc2a3a3FfB6f1E43468985", // Sale own/Swapper
    treasury: "0xD3E97f2dB4703D3972AC3F9E29762156B089604f", // Treasury
    team: "0xE0E25EB1A1C5924615D1628bD8748105969480C5", // Team
    wld: "0x2cfc85d8e48f8eab294be644d9e25c3030863003", // WLD token on World Chain testnet
    weth: "0x4200000000000000000000000000000000000006", // WETH token on World Chain testnet
  },
  // World Chain Mainnet - Updated with actual deployed addresses
  480: {
    vldx: "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97", // VLDX Token (Mainnet)
    presale: "0x52a9aDC351346f94Ab3027A7EcAeDD358F792aC8", // Presale contract (Mainnet)
    liquidity: "0xfDDecfD7ca6a279B3fd765eC5667CbA7DbB4Da33", // Liquidity contract (Mainnet)
    swapper: "0xE1BC9d5C2B26c76f353df822eFf62a6e015357Ca", // Swapper contract (Mainnet)
    treasury: "0xD3E97f2dB4703D3972AC3F9E29762156B089604f", // Treasury
    team: "0xE0E25EB1A1C5924615D1628bD8748105969480C5", // Team
    wld: "0x2cfc85d8e48f8eab294be644d9e25c3030863003", // WLD token on World Chain mainnet
    weth: "0x4200000000000000000000000000000000000006", // WETH token on World Chain mainnet
  },
}

// Default to mainnet for production
export const DEFAULT_CHAIN_ID = 480

// Multisig addresses for different allocations
export const MULTISIG_ADDRESSES = {
  ecosystem: "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97", // VLDX Token address
  liquidity: "0xfDDecfD7ca6a279B3fd765eC5667CbA7DbB4Da33", // Liquidity address
  team: "0xE0E25EB1A1C5924615D1628bD8748105969480C5", // Team address
  partnerships: "0xE1BC9d5C2B26c76f353df822eFf62a6e015357Ca", // Swapper address
  treasury: "0xD3E97f2dB4703D3972AC3F9E29762156B089604f", // Treasury address
}
