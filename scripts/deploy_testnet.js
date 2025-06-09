// Deploy script for testnet (e.g., Goerli, Sepolia)
const { ethers } = require("hardhat")

async function main() {
  console.log("Deploying VLDX contracts to testnet...")

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with the account:", deployer.address)

  // Deploy VLDX token
  const VLDX = await ethers.getContractFactory("VLDX")
  const vldx = await VLDX.deploy(deployer.address)
  await vldx.deployed()
  console.log("VLDX token deployed to:", vldx.address)

  // Mock tokens for testnet (in production, these would be real token addresses)
  // Deploy mock WLD token
  const MockERC20 = await ethers.getContractFactory("MockERC20")
  const mockWLD = await MockERC20.deploy("Mock WLD", "mWLD", 18)
  await mockWLD.deployed()
  console.log("Mock WLD token deployed to:", mockWLD.address)

  // Deploy mock WETH token
  const mockWETH = await MockERC20.deploy("Mock WETH", "mWETH", 18)
  await mockWETH.deployed()
  console.log("Mock WETH token deployed to:", mockWETH.address)

  // Uniswap V3 addresses for testnet
  // Note: These should be replaced with actual testnet addresses
  const uniswapFactoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984" // Example testnet address
  const positionManagerAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88" // Example testnet address
  const swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564" // Example testnet address

  // Deploy VLDXPresale
  const VLDXPresale = await ethers.getContractFactory("VLDXPresale")
  const presale = await VLDXPresale.deploy(vldx.address, mockWLD.address, mockWETH.address)
  await presale.deployed()
  console.log("VLDXPresale deployed to:", presale.address)

  // Deploy VLDXLiquidity
  const lockDuration = 180 * 24 * 60 * 60 // 180 days in seconds

  const VLDXLiquidity = await ethers.getContractFactory("VLDXLiquidity")
  const liquidity = await VLDXLiquidity.deploy(
    vldx.address,
    mockWLD.address,
    mockWETH.address,
    uniswapFactoryAddress,
    positionManagerAddress,
    lockDuration,
  )
  await liquidity.deployed()
  console.log("VLDXLiquidity deployed to:", liquidity.address)

  // Deploy VLDXSwapper
  const VLDXSwapper = await ethers.getContractFactory("VLDXSwapper")
  const swapper = await VLDXSwapper.deploy(vldx.address, swapRouterAddress)
  await swapper.deployed()
  console.log("VLDXSwapper deployed to:", swapper.address)

  // Grant roles to contracts
  const minterRole = await vldx.MINTER_ROLE()
  await vldx.grantRole(minterRole, presale.address)
  console.log("Granted MINTER_ROLE to presale contract")

  console.log("All contracts deployed successfully to testnet!")

  // Verify contracts on Etherscan (if applicable)
  console.log("\nVerify contracts with:")
  console.log(`npx hardhat verify --network world-testnet ${vldx.address} ${deployer.address}`)
  console.log(
    `npx hardhat verify --network world-testnet ${presale.address} ${vldx.address} ${mockWLD.address} ${mockWETH.address}`,
  )
  console.log(
    `npx hardhat verify --network world-testnet ${liquidity.address} ${vldx.address} ${mockWLD.address} ${mockWETH.address} ${uniswapFactoryAddress} ${positionManagerAddress} ${lockDuration}`,
  )
  console.log(`npx hardhat verify --network world-testnet ${swapper.address} ${vldx.address} ${swapRouterAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
