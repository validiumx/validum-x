// add-liquidity.js - Add liquidity using simplified contract
const { ethers } = require("hardhat")
const fs = require("fs")

async function main() {
  console.log("Adding liquidity using simplified contract...")

  // Load deployment info
  let deploymentInfo
  try {
    deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json"))
  } catch (error) {
    console.error("Error loading deployment info:", error)
    console.error("Please run deploy.js first to generate deployment-info.json")
    process.exit(1)
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Executing with account:", deployer.address)

  // Connect to contracts
  const VLDX = await ethers.getContractFactory("VLDX")
  const vldx = VLDX.attach(deploymentInfo.vldxToken)
  console.log("Connected to VLDX token at:", vldx.address)

  const VLDXLiquiditySimple = await ethers.getContractFactory("VLDXLiquiditySimple")
  const liquidity = VLDXLiquiditySimple.attach(deploymentInfo.liquidity)
  console.log("Connected to VLDXLiquiditySimple at:", liquidity.address)

  const IERC20 = await ethers.getContractFactory("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20")
  const wldToken = IERC20.attach(deploymentInfo.wldToken)
  const wethToken = IERC20.attach(deploymentInfo.wethToken)

  // Check balances
  const deployerVldxBalance = await vldx.balanceOf(deployer.address)
  const deployerWldBalance = await wldToken.balanceOf(deployer.address)
  const deployerWethBalance = await wethToken.balanceOf(deployer.address)

  console.log("\nDeployer Balances:")
  console.log("------------------")
  console.log(`VLDX: ${ethers.utils.formatEther(deployerVldxBalance)}`)
  console.log(`WLD: ${ethers.utils.formatEther(deployerWldBalance)}`)
  console.log(`WETH: ${ethers.utils.formatEther(deployerWethBalance)}`)

  // Deposit VLDX tokens to liquidity contract
  if (deployerVldxBalance.gt(0)) {
    console.log("\nDepositing VLDX tokens to liquidity contract...")
    const vldxToDeposit = ethers.utils.parseEther("1000000") // 1 million VLDX

    if (deployerVldxBalance.gte(vldxToDeposit)) {
      await vldx.approve(liquidity.address, vldxToDeposit)
      await liquidity.depositLiquidity(vldx.address, vldxToDeposit)
      console.log(`✅ Deposited ${ethers.utils.formatEther(vldxToDeposit)} VLDX`)
    } else {
      console.log("⚠️ Insufficient VLDX balance for deposit")
    }
  }

  // Deposit WLD tokens if available
  if (deployerWldBalance.gt(0)) {
    console.log("\nDepositing WLD tokens to liquidity contract...")
    const wldToDeposit = deployerWldBalance.div(2) // Deposit half

    await wldToken.approve(liquidity.address, wldToDeposit)
    await liquidity.depositLiquidity(wldToken.address, wldToDeposit)
    console.log(`✅ Deposited ${ethers.utils.formatEther(wldToDeposit)} WLD`)
  }

  // Deposit WETH tokens if available
  if (deployerWethBalance.gt(0)) {
    console.log("\nDepositing WETH tokens to liquidity contract...")
    const wethToDeposit = deployerWethBalance.div(2) // Deposit half

    await wethToken.approve(liquidity.address, wethToDeposit)
    await liquidity.depositLiquidity(wethToken.address, wethToDeposit)
    console.log(`✅ Deposited ${ethers.utils.formatEther(wethToDeposit)} WETH`)
  }

  // Check liquidity contract balances
  const [vldxBalance, wldBalance, wethBalance] = await liquidity.getAllBalances()

  console.log("\nLiquidity Contract Balances:")
  console.log("----------------------------")
  console.log(`VLDX: ${ethers.utils.formatEther(vldxBalance)}`)
  console.log(`WLD: ${ethers.utils.formatEther(wldBalance)}`)
  console.log(`WETH: ${ethers.utils.formatEther(wethBalance)}`)

  // Check unlock time
  const unlockTime = await liquidity.liquidityUnlockTime()
  const unlockDate = new Date(unlockTime.toNumber() * 1000)
  console.log(`\nLiquidity unlocks on: ${unlockDate.toLocaleString()}`)

  console.log("\nLiquidity setup completed!")
  console.log("\nNext steps:")
  console.log("1. Run enable-trading.js to enable token transfers")
  console.log("2. Set up external DEX liquidity (Uniswap V3) manually if needed")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
