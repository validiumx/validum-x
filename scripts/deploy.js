// deploy.js - Deploy VLDX token and presale contract
const { ethers } = require("hardhat")

async function main() {
  console.log("Deploying VLDX token and presale contract...")

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with the account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  // Deploy VLDX token
  const VLDX = await ethers.getContractFactory("VLDX")
  const vldx = await VLDX.deploy(deployer.address)
  await vldx.deployed()
  console.log("VLDX token deployed to:", vldx.address)

  // World Chain token addresses
  const wldTokenAddress = "0x2cfc85d8e48f8eab294be644d9e25c3030863003"
  const wethTokenAddress = "0x4200000000000000000000000000000000000006"

  // Deploy VLDXPresale
  const VLDXPresale = await ethers.getContractFactory("VLDXPresale")
  const presale = await VLDXPresale.deploy(vldx.address, wldTokenAddress, wethTokenAddress)
  await presale.deployed()
  console.log("VLDXPresale deployed to:", presale.address)

  // Grant MINTER_ROLE to presale contract
  const minterRole = await vldx.MINTER_ROLE()
  await vldx.grantRole(minterRole, presale.address)
  console.log("Granted MINTER_ROLE to presale contract")

  // Deploy VLDXLiquiditySimple
  const lockDuration = 180 * 24 * 60 * 60 // 180 days in seconds

  const VLDXLiquiditySimple = await ethers.getContractFactory("VLDXLiquiditySimple")
  const liquidity = await VLDXLiquiditySimple.deploy(vldx.address, wldTokenAddress, wethTokenAddress, lockDuration)
  await liquidity.deployed()
  console.log("VLDXLiquiditySimple deployed to:", liquidity.address)

  // Deploy VLDXSwapperSimple
  const VLDXSwapperSimple = await ethers.getContractFactory("VLDXSwapperSimple")
  const swapper = await VLDXSwapperSimple.deploy(vldx.address)
  await swapper.deployed()
  console.log("VLDXSwapperSimple deployed to:", swapper.address)

  // Grant MINTER_ROLE to deployer for initial distribution
  await vldx.grantRole(minterRole, deployer.address)
  console.log("Granted MINTER_ROLE to deployer for initial distribution")

  console.log("\nDeployment Summary:")
  console.log("-------------------")
  console.log("VLDX Token:", vldx.address)
  console.log("VLDX Presale:", presale.address)
  console.log("VLDX Liquidity:", liquidity.address)
  console.log("VLDX Swapper:", swapper.address)
  console.log("\nNext steps:")
  console.log("1. Run distribute-tokens.js to allocate initial tokens")
  console.log("2. Run start-presale.js to start the presale")
  console.log("3. After presale, run add-liquidity.js to add liquidity")
  console.log("4. Run enable-trading.js to enable token transfers")

  // Save deployment addresses to a file for future scripts
  const fs = require("fs")
  const deploymentInfo = {
    vldxToken: vldx.address,
    presale: presale.address,
    liquidity: liquidity.address,
    swapper: swapper.address,
    wldToken: wldTokenAddress,
    wethToken: wethTokenAddress,
    deployer: deployer.address,
  }

  fs.writeFileSync("deployment-info.json", JSON.stringify(deploymentInfo, null, 2))
  console.log("Deployment info saved to deployment-info.json")

  // Verify contracts on block explorer
  console.log("\nVerify contracts with:")
  console.log(`npx hardhat verify --network world-mainnet ${vldx.address} ${deployer.address}`)
  console.log(
    `npx hardhat verify --network world-mainnet ${presale.address} ${vldx.address} ${wldTokenAddress} ${wethTokenAddress}`,
  )
  console.log(
    `npx hardhat verify --network world-mainnet ${liquidity.address} ${vldx.address} ${wldTokenAddress} ${wethTokenAddress} ${lockDuration}`,
  )
  console.log(`npx hardhat verify --network world-mainnet ${swapper.address} ${vldx.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
