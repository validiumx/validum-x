// enable-trading-fixed.js - Enable trading for VLDX token with proper error handling
const { ethers } = require("hardhat")

async function main() {
  console.log("Enabling trading for VLDX token...")

  // Contract address
  const vldxTokenAddress = "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97" // Updated address

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Executing with account:", deployer.address)
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH")

  try {
    // Connect to VLDX token contract
    const VLDX = await ethers.getContractFactory("VLDX")
    const vldx = VLDX.attach(vldxTokenAddress)
    console.log("Connected to VLDX token at:", vldx.address)

    // Check current trading status
    const tradingEnabled = await vldx.tradingEnabled()
    console.log("Current trading status:", tradingEnabled)

    if (tradingEnabled) {
      console.log("⚠️ Trading is already enabled for VLDX token")
    } else {
      console.log("Enabling trading...")

      // Check if we have GOVERNANCE_ROLE
      const governanceRole = await vldx.GOVERNANCE_ROLE()
      const hasRole = await vldx.hasRole(governanceRole, deployer.address)
      console.log("Has GOVERNANCE_ROLE:", hasRole)

      if (!hasRole) {
        console.log("❌ Account does not have GOVERNANCE_ROLE")
        console.log("Please grant GOVERNANCE_ROLE to this account first")
        return
      }

      // Enable trading
      const tx = await vldx.setTradingEnabled(true)
      console.log("Transaction hash:", tx.hash)

      // Wait for confirmation
      const receipt = await tx.wait()
      console.log("Transaction confirmed in block:", receipt.blockNumber)
      console.log("✅ Trading enabled successfully!")
    }

    // Verify trading is enabled
    const tradingEnabledAfter = await vldx.tradingEnabled()
    console.log("Final trading status:", tradingEnabledAfter)

    // Get token info
    const name = await vldx.name()
    const symbol = await vldx.symbol()
    const totalSupply = await vldx.totalSupply()

    console.log("\n📊 Token Information:")
    console.log("--------------------")
    console.log(`Name: ${name}`)
    console.log(`Symbol: ${symbol}`)
    console.log(`Total Supply: ${ethers.utils.formatEther(totalSupply)} VLDX`)
    console.log(`Trading Enabled: ${tradingEnabledAfter}`)

    console.log("\n🎉 VLDX token is now fully operational!")
  } catch (error) {
    console.error("❌ Error enabling trading:", error)

    if (error.message.includes("AccessControl")) {
      console.error("Access control error - make sure you have GOVERNANCE_ROLE")
    } else if (error.message.includes("revert")) {
      console.error("Transaction reverted - check contract state and permissions")
    } else {
      console.error("Unexpected error occurred")
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
