// start-presale.js - Start the VLDX presale
const { ethers } = require("hardhat")
const fs = require("fs")

async function main() {
  console.log("Starting VLDX presale...")

  // Use correct addresses from deployment-info.json
  let deploymentInfo
  try {
    deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json"))
  } catch (error) {
    console.log("Using hardcoded addresses...")
    deploymentInfo = {
      vldxToken: "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97",
      presale: "0x52a9aDC351346f94Ab3027A7EcAeDD358F792aC8",
      liquidity: "0xfDDecfD7ca6a279B3fd765eC5667CbA7DbB4Da33",
      swapper: "0xE1BC9d5C2B26c76f353df822eFf62a6e015357Ca",
      wldToken: "0x2cfc85d8e48f8eab294be644d9e25c3030863003",
      wethToken: "0x4200000000000000000000000000000000000006",
    }
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Executing with account:", deployer.address)
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH")

  // Connect to VLDXPresale contract
  const VLDXPresale = await ethers.getContractFactory("VLDXPresale")
  const presale = VLDXPresale.attach(deploymentInfo.presale)
  console.log("Connected to VLDXPresale at:", presale.address)

  try {
    // Check if presale is already active
    const presaleActive = await presale.presaleActive()
    if (presaleActive) {
      console.log("⚠️ Presale is already active!")
      return
    }

    // Update oracle prices (example values, should be updated with real market prices)
    const wldUsdPrice = ethers.utils.parseEther("1.25") // 1 WLD = $1.25
    const wethUsdPrice = ethers.utils.parseEther("3500") // 1 WETH = $3500

    console.log(
      `Setting oracle prices: WLD = $${ethers.utils.formatEther(wldUsdPrice)}, WETH = $${ethers.utils.formatEther(wethUsdPrice)}`,
    )
    await presale.updateOraclePrices(wldUsdPrice, wethUsdPrice)
    console.log("✅ Oracle prices updated")

    // Start the presale
    console.log("Starting presale...")
    await presale.startPresale()
    console.log("✅ Presale started successfully!")

    // Get presale parameters
    const basePrice = await presale.basePrice()
    const priceIncrement = await presale.priceIncrement()
    const maxTokensForSale = await presale.maxTokensForSale()
    const maxRaise = await presale.maxRaise()

    console.log("\nPresale Parameters:")
    console.log("-------------------")
    console.log(`Base Price: $${ethers.utils.formatEther(basePrice)} per VLDX`)
    console.log(`Price Increment: $${ethers.utils.formatEther(priceIncrement)} per token sold`)
    console.log(`Max Tokens For Sale: ${ethers.utils.formatEther(maxTokensForSale)} VLDX`)
    console.log(`Max Raise: $${ethers.utils.formatEther(maxRaise)}`)
    console.log(`Current Price: $${ethers.utils.formatEther(await presale.getCurrentPrice())} per VLDX`)

    console.log("\nPresale is now active!")
    console.log("\nContract addresses:")
    console.log("------------------")
    console.log("VLDX Token:", deploymentInfo.vldxToken)
    console.log("Presale:", deploymentInfo.presale)
    console.log("Liquidity:", deploymentInfo.liquidity)
    console.log("Swapper:", deploymentInfo.swapper)
  } catch (error) {
    console.error("Error starting presale:", error)
    console.error("Make sure you have the correct permissions and the contract is deployed")
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
