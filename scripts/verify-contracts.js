// verify-contracts.js - Verify all deployed contracts
const { ethers } = require("hardhat")
const fs = require("fs")

const hre = require("hardhat") // Declare hre variable

async function main() {
  console.log("Verifying deployed contracts...")

  // Load deployment info
  let deploymentInfo
  try {
    deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json"))
  } catch (error) {
    console.error("Error loading deployment info:", error)
    console.error("Please run deploy.js first to generate deployment-info.json")
    process.exit(1)
  }

  const network = hre.network.name
  console.log(`Verifying contracts on network: ${network}`)

  try {
    // Verify VLDX Token
    console.log("\n1. Verifying VLDX Token...")
    try {
      await hre.run("verify:verify", {
        address: deploymentInfo.vldxToken,
        constructorArguments: [deploymentInfo.deployer || "0x701aB55cb87FB8dA4fE3f45FFf6cc1eA60965310"],
        contract: "contracts/VLDX.sol:VLDX",
      })
      console.log("✅ VLDX Token verified successfully")
    } catch (error) {
      console.log("⚠️ VLDX Token verification failed:", error.message)
    }

    // Verify VLDXPresale
    console.log("\n2. Verifying VLDXPresale...")
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

    // Verify VLDXLiquidity
    console.log("\n3. Verifying VLDXLiquidity...")
    try {
      const lockDuration = 180 * 24 * 60 * 60 // 180 days
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

    // Verify VLDXSwapper
    console.log("\n4. Verifying VLDXSwapper...")
    try {
      await hre.run("verify:verify", {
        address: deploymentInfo.swapper,
        constructorArguments: [deploymentInfo.vldxToken],
        contract: "contracts/VLDXSwapper.sol:VLDXSwapper",
      })
      console.log("✅ VLDXSwapper verified successfully")
    } catch (error) {
      console.log("⚠️ VLDXSwapper verification failed:", error.message)
    }

    console.log("\n🎉 Contract verification process completed!")
    console.log("\nContract addresses:")
    console.log("------------------")
    console.log(`VLDX Token: ${deploymentInfo.vldxToken}`)
    console.log(`Presale: ${deploymentInfo.presale}`)
    console.log(`Liquidity: ${deploymentInfo.liquidity}`)
    console.log(`Swapper: ${deploymentInfo.swapper}`)

    if (network.includes("world")) {
      console.log("\nView on World Chain Explorer:")
      const explorerUrl = network.includes("testnet")
        ? "https://worldchain-sepolia.explorer.alchemy.com"
        : "https://worldscan.org"

      console.log(`${explorerUrl}/address/${deploymentInfo.vldxToken}`)
      console.log(`${explorerUrl}/address/${deploymentInfo.presale}`)
      console.log(`${explorerUrl}/address/${deploymentInfo.liquidity}`)
      console.log(`${explorerUrl}/address/${deploymentInfo.swapper}`)
    }
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
