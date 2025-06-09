// end-presale.js - End the VLDX presale
const { ethers } = require("hardhat")
const fs = require("fs")

async function main() {
  console.log("Ending VLDX presale...")

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

  // Connect to VLDXPresale contract
  const VLDXPresale = await ethers.getContractFactory("VLDXPresale")
  const presale = VLDXPresale.attach(deploymentInfo.presale)
  console.log("Connected to VLDXPresale at:", presale.address)

  // Get presale status
  const presaleActive = await presale.presaleActive()
  const presaleFinalized = await presale.presaleFinalized()
  const tokensSold = await presale.tokensSold()
  const wldRaised = await presale.wldRaised()
  const wethRaised = await presale.wethRaised()

  console.log("\nCurrent Presale Status:")
  console.log("----------------------")
  console.log(`Active: ${presaleActive}`)
  console.log(`Finalized: ${presaleFinalized}`)
  console.log(`Tokens Sold: ${ethers.utils.formatEther(tokensSold)} VLDX`)
  console.log(`WLD Raised (USD value): $${ethers.utils.formatEther(wldRaised)}`)
  console.log(`WETH Raised (USD value): $${ethers.utils.formatEther(wethRaised)}`)
  console.log(`Total Raised (USD value): $${ethers.utils.formatEther(wldRaised.add(wethRaised))}`)

  if (!presaleActive) {
    console.log("\nPresale is already inactive.")
  } else {
    // End the presale
    console.log("\nEnding presale...")
    await presale.endPresale()
    console.log("✅ Presale ended successfully!")
  }

  if (presaleFinalized) {
    console.log("\nPresale is already finalized.")
  } else {
    // Finalize the presale
    console.log("\nFinalizing presale...")
    await presale.finalizePresale(deploymentInfo.liquidity)
    console.log("✅ Presale finalized successfully!")
    console.log("✅ Funds transferred to liquidity contract")
  }

  console.log("\nPresale has been ended and finalized!")
  console.log("\nNext steps:")
  console.log("1. Run add-liquidity.js to add liquidity to Uniswap V3")
  console.log("2. Run enable-trading.js to enable token transfers")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
