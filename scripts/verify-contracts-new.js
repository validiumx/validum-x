// verify-contracts-new.js - Verify contracts using new hardhat-verify plugin
const { ethers } = require("hardhat")
const fs = require("fs")
const { spawn } = require("child_process")

async function main() {
  console.log("Verifying deployed contracts using hardhat-verify...")

  // Contract addresses
  const addresses = {
    vldxToken: "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97",
    presale: "0x52a9aDC351346f94Ab3027A7EcAeDD358F792aC8",
    liquidity: "0xfDDecfD7ca6a279B3fd765eC5667CbA7DbB4Da33",
    swapper: "0xE1BC9d5C2B26c76f353df822eFf62a6e015357Ca",
    deployer: "0x701aB55cb87FB8dA4fE3f45FFf6cc1eA60965310",
    wldToken: "0x2cfc85d8e48f8eab294be644d9e25c3030863003",
    wethToken: "0x4200000000000000000000000000000000000006",
  }

  console.log("Contract addresses to verify:")
  console.log("-----------------------------")
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(`${name}: ${address}`)
  })

  try {
    // Verify VLDXPresale
    console.log("\n1. Verifying VLDXPresale...")
    console.log(`Address: ${addresses.presale}`)
    console.log("Constructor arguments:")
    console.log(`  _vldxToken: ${addresses.vldxToken}`)
    console.log(`  _wldToken: ${addresses.wldToken}`)
    console.log(`  _wethToken: ${addresses.wethToken}`)

    try {
      const presaleArgs = [addresses.vldxToken, addresses.wldToken, addresses.wethToken]

      const verifyPresale = spawn(
        "npx",
        ["hardhat", "verify", "--network", "world-mainnet", addresses.presale, ...presaleArgs],
        { stdio: "inherit" },
      )

      await new Promise((resolve, reject) => {
        verifyPresale.on("close", (code) => {
          if (code === 0) {
            console.log("✅ VLDXPresale verification completed")
            resolve()
          } else {
            console.log("⚠️ VLDXPresale verification may have failed")
            resolve() // Continue with other verifications
          }
        })
        verifyPresale.on("error", reject)
      })
    } catch (error) {
      console.log("⚠️ VLDXPresale verification error:", error.message)
    }

    // Verify VLDXLiquidity
    console.log("\n2. Verifying VLDXLiquidity...")
    console.log(`Address: ${addresses.liquidity}`)

    const lockDuration = 180 * 24 * 60 * 60 // 180 days in seconds
    console.log("Constructor arguments:")
    console.log(`  _vldxToken: ${addresses.vldxToken}`)
    console.log(`  _wldToken: ${addresses.wldToken}`)
    console.log(`  _wethToken: ${addresses.wethToken}`)
    console.log(`  _lockDuration: ${lockDuration}`)

    try {
      const liquidityArgs = [addresses.vldxToken, addresses.wldToken, addresses.wethToken, lockDuration.toString()]

      const verifyLiquidity = spawn(
        "npx",
        ["hardhat", "verify", "--network", "world-mainnet", addresses.liquidity, ...liquidityArgs],
        { stdio: "inherit" },
      )

      await new Promise((resolve, reject) => {
        verifyLiquidity.on("close", (code) => {
          if (code === 0) {
            console.log("✅ VLDXLiquidity verification completed")
            resolve()
          } else {
            console.log("⚠️ VLDXLiquidity verification may have failed")
            resolve()
          }
        })
        verifyLiquidity.on("error", reject)
      })
    } catch (error) {
      console.log("⚠️ VLDXLiquidity verification error:", error.message)
    }

    console.log("\n🎉 Verification process completed!")
    console.log("\nContract links:")
    console.log("---------------")
    console.log(`VLDX Token: https://worldscan.org/address/${addresses.vldxToken}`)
    console.log(`Presale: https://worldscan.org/address/${addresses.presale}`)
    console.log(`Liquidity: https://worldscan.org/address/${addresses.liquidity}`)
    console.log(`Swapper: https://worldscan.org/address/${addresses.swapper}`)
  } catch (error) {
    console.error("Error during verification:", error)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
