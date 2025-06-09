// verify-contracts-fixed.js - Verify all deployed contracts with correct constructor arguments
const { ethers } = require("hardhat")
const fs = require("fs")

const hre = require("hardhat")

async function main() {
  console.log("Verifying deployed contracts with correct constructor arguments...")

  // Load deployment info
  let deploymentInfo
  try {
    deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json"))
  } catch (error) {
    console.error("Error loading deployment info:", error)
    console.error("Using hardcoded addresses...")

    deploymentInfo = {
      vldxToken: "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97",
      presale: "0x52a9aDC351346f94Ab3027A7EcAeDD358F792aC8",
      liquidity: "0xfDDecfD7ca6a279B3fd765eC5667CbA7DbB4Da33",
      swapper: "0xE1BC9d5C2B26c76f353df822eFf62a6e015357Ca",
      deployer: "0x701aB55cb87FB8dA4fE3f45FFf6cc1eA60965310",
      wldToken: "0x2cfc85d8e48f8eab294be644d9e25c3030863003",
      wethToken: "0x4200000000000000000000000000000000000006",
    }
  }

  const network = hre.network.name
  console.log(`Verifying contracts on network: ${network}`)

  try {
    // Verify VLDXPresale with correct constructor arguments
    console.log("\nVerifying VLDXPresale...")
    try {
      await hre.run("verify:verify", {
        address: deploymentInfo.presale,
        constructorArguments: [deploymentInfo.vldxToken, deploymentInfo.wldToken, deploymentInfo.wethToken],
        contract: "contracts/VLDXPresale.sol:VLDXPresale",
      })
      console.log("✅ VLDXPresale verified successfully")
    } catch (error) {
      console.log("⚠️ VLDXPresale verification failed:", error.message)
    }

    // Verify VLDXLiquidity with correct constructor arguments
    console.log("\nVerifying VLDXLiquidity...")
    try {
      const lockDuration = 180 * 24 * 60 * 60 // 180 days in seconds
      await hre.run("verify:verify", {
        address: deploymentInfo.liquidity,
        constructorArguments: [
          deploymentInfo.vldxToken,
          deploymentInfo.wldToken,
          deploymentInfo.wethToken,
          lockDuration,
        ],
        contract: "contracts/VLDXLiquidity.sol:VLDXLiquidity",
      })
      console.log("✅ VLDXLiquidity verified successfully")
    } catch (error) {
      console.log("⚠️ VLDXLiquidity verification failed:", error.message)
    }

    console.log("\n🎉 Contract verification process completed!")
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
