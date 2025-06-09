// enable-trading.js - Enable trading for VLDX token
const { ethers } = require("hardhat")
const fs = require("fs")

async function main() {
  console.log("Enabling trading for VLDX token...")

  // Load deployed contract addresses
  const deploymentInfoPath = "./deployment-info.json"
  let deploymentInfo = {}
  if (fs.existsSync(deploymentInfoPath)) {
    deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, "utf8"))
  } else {
    console.error("Error: deployment-info.json not found. Please deploy contracts first.")
    process.exit(1)
  }

  const vldxTokenAddress = deploymentInfo.vldxToken

  if (!vldxTokenAddress) {
    console.error("Error: VLDX token address not found in deployment-info.json.")
    process.exit(1)
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Executing with account:", deployer.address)

  // Connect to VLDX token contract
  const VLDX = await ethers.getContractFactory("VLDX")
  const vldx = VLDX.attach(vldxTokenAddress)
  console.log("Connected to VLDX token at:", vldx.address)

  try {
    // Check if trading is already enabled
    const tradingEnabled = await vldx.tradingEnabled()

    if (tradingEnabled) {
      console.log("⚠️ Trading is already enabled for VLDX token")
    } else {
      console.log("Enabling trading...")
      await vldx.setTradingEnabled(true)
      console.log("✅ Trading enabled successfully!")

      // Add a small delay to allow for state propagation
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds delay
    }

    // Verify trading is enabled
    const tradingEnabledAfter = await vldx.tradingEnabled()
    console.log(`Trading enabled: ${tradingEnabledAfter}`)

    console.log("\nVLDX token is now fully operational!")
    console.log("\nDeployment process complete. The following contracts are deployed:")
    console.log("-----------------------------------------------------------")
    console.log(`VLDX Token: ${vldxTokenAddress}`)
    console.log(`Presale: 0x625A522cB032eB832b3077E9b85a323D05b34a37`)
    console.log(`Liquidity: 0x2308fc53ec7a8A818AaA116D0c0B34392529BAbe`)
    console.log(`Swapper: 0x4eA231fc1BA3B5b4d0cc2a3a3FfB6f1E43468985`)
    console.log(`Treasury: 0xD3E97f2dB4703D3972AC3F9E29762156B089604f`)
    console.log(`Team: 0xE0E25EB1A1C5924615D1628bD8748105969480C5`)
  } catch (error) {
    console.error("Error enabling trading:", error)
    console.error("Make sure you have GOVERNANCE_ROLE permissions")
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
