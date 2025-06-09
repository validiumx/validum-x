// check-constructor-args.js - Check actual constructor arguments of deployed contracts
const { ethers } = require("hardhat")

async function main() {
  console.log("Checking constructor arguments of deployed contracts...")

  const addresses = {
    vldxToken: "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97",
    presale: "0x52a9aDC351346f94Ab3027A7EcAeDD358F792aC8",
    liquidity: "0xfDDecfD7ca6a279B3fd765eC5667CbA7DbB4Da33",
    swapper: "0xE1BC9d5C2B26c76f353df822eFf62a6e015357Ca",
    wldToken: "0x2cfc85d8e48f8eab294be644d9e25c3030863003",
    wethToken: "0x4200000000000000000000000000000000000006",
  }

  const [deployer] = await ethers.getSigners()
  console.log("Checking with account:", deployer.address)

  try {
    // Check VLDXPresale
    console.log("\n📋 VLDXPresale Constructor Check:")
    console.log("=================================")
    const VLDXPresale = await ethers.getContractFactory("VLDXPresale")
    const presale = VLDXPresale.attach(addresses.presale)

    const vldxTokenFromContract = await presale.vldxToken()
    const wldTokenFromContract = await presale.wldToken()
    const wethTokenFromContract = await presale.wethToken()

    console.log("Expected constructor arguments:")
    console.log(`  _vldxToken: ${addresses.vldxToken}`)
    console.log(`  _wldToken: ${addresses.wldToken}`)
    console.log(`  _wethToken: ${addresses.wethToken}`)

    console.log("\nActual values from contract:")
    console.log(`  vldxToken(): ${vldxTokenFromContract}`)
    console.log(`  wldToken(): ${wldTokenFromContract}`)
    console.log(`  wethToken(): ${wethTokenFromContract}`)

    const presaleArgsMatch =
      vldxTokenFromContract.toLowerCase() === addresses.vldxToken.toLowerCase() &&
      wldTokenFromContract.toLowerCase() === addresses.wldToken.toLowerCase() &&
      wethTokenFromContract.toLowerCase() === addresses.wethToken.toLowerCase()

    console.log(`Arguments match: ${presaleArgsMatch ? "✅ YES" : "❌ NO"}`)

    // Check VLDXLiquidity
    console.log("\n📋 VLDXLiquidity Constructor Check:")
    console.log("===================================")
    const VLDXLiquidity = await ethers.getContractFactory("VLDXLiquidity")
    const liquidity = VLDXLiquidity.attach(addresses.liquidity)

    const vldxTokenFromLiquidity = await liquidity.vldxToken()
    const wldTokenFromLiquidity = await liquidity.wldToken()
    const wethTokenFromLiquidity = await liquidity.wethToken()
    const lockDurationFromContract = await liquidity.lockDuration()

    const expectedLockDuration = 180 * 24 * 60 * 60 // 180 days

    console.log("Expected constructor arguments:")
    console.log(`  _vldxToken: ${addresses.vldxToken}`)
    console.log(`  _wldToken: ${addresses.wldToken}`)
    console.log(`  _wethToken: ${addresses.wethToken}`)
    console.log(`  _lockDuration: ${expectedLockDuration}`)

    console.log("\nActual values from contract:")
    console.log(`  vldxToken(): ${vldxTokenFromLiquidity}`)
    console.log(`  wldToken(): ${wldTokenFromLiquidity}`)
    console.log(`  wethToken(): ${wethTokenFromLiquidity}`)
    console.log(`  lockDuration(): ${lockDurationFromContract.toString()}`)

    const liquidityArgsMatch =
      vldxTokenFromLiquidity.toLowerCase() === addresses.vldxToken.toLowerCase() &&
      wldTokenFromLiquidity.toLowerCase() === addresses.wldToken.toLowerCase() &&
      wethTokenFromLiquidity.toLowerCase() === addresses.wethToken.toLowerCase() &&
      lockDurationFromContract.toString() === expectedLockDuration.toString()

    console.log(`Arguments match: ${liquidityArgsMatch ? "✅ YES" : "❌ NO"}`)

    // Generate verification commands
    console.log("\n🔧 Manual Verification Commands:")
    console.log("=================================")

    console.log("\nFor VLDXPresale:")
    console.log(
      `npx hardhat verify --network world-mainnet ${addresses.presale} "${addresses.vldxToken}" "${addresses.wldToken}" "${addresses.wethToken}"`,
    )

    console.log("\nFor VLDXLiquidity:")
    console.log(
      `npx hardhat verify --network world-mainnet ${addresses.liquidity} "${addresses.vldxToken}" "${addresses.wldToken}" "${addresses.wethToken}" "${expectedLockDuration}"`,
    )

    // Check if contracts are already verified
    console.log("\n🔍 Verification Status Check:")
    console.log("==============================")
    console.log("You can manually check verification status at:")
    console.log(`VLDXPresale: https://worldscan.org/address/${addresses.presale}#code`)
    console.log(`VLDXLiquidity: https://worldscan.org/address/${addresses.liquidity}#code`)
  } catch (error) {
    console.error("❌ Error checking constructor arguments:", error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
