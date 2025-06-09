// start-presale-safe.js - Start presale with better error handling
const { ethers } = require("hardhat")

async function main() {
  console.log("Starting VLDX presale with safety checks...")

  const addresses = {
    vldxToken: "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97",
    presale: "0x52a9aDC351346f94Ab3027A7EcAeDD358F792aC8",
    wldToken: "0x2cfc85d8e48f8eab294be644d9e25c3030863003",
    wethToken: "0x4200000000000000000000000000000000000006",
  }

  const [deployer] = await ethers.getSigners()
  console.log("Executing with account:", deployer.address)
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH")

  try {
    // Connect to contracts
    const VLDXPresale = await ethers.getContractFactory("VLDXPresale")
    const presale = VLDXPresale.attach(addresses.presale)
    console.log("Connected to VLDXPresale at:", presale.address)

    const VLDX = await ethers.getContractFactory("VLDX")
    const vldx = VLDX.attach(addresses.vldxToken)

    // Safety checks
    console.log("\n🔍 Safety Checks:")
    console.log("==================")

    // Check if contract is deployed
    const code = await ethers.provider.getCode(addresses.presale)
    if (code === "0x") {
      console.log("❌ Presale contract not deployed at this address")
      return
    }
    console.log("✅ Presale contract is deployed")

    // Check owner
    const owner = await presale.owner()
    console.log(`Contract owner: ${owner}`)
    console.log(`Deployer address: ${deployer.address}`)
    console.log(`Is deployer owner: ${owner.toLowerCase() === deployer.address.toLowerCase() ? "✅ YES" : "❌ NO"}`)

    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ Deployer is not the owner of the presale contract")
      return
    }

    // Check presale status
    const presaleActive = await presale.presaleActive()
    const presaleFinalized = await presale.presaleFinalized()
    console.log(`Presale active: ${presaleActive}`)
    console.log(`Presale finalized: ${presaleFinalized}`)

    if (presaleActive) {
      console.log("⚠️ Presale is already active!")
      return
    }

    if (presaleFinalized) {
      console.log("⚠️ Presale is already finalized!")
      return
    }

    // Check if presale contract has minter role
    const minterRole = await vldx.MINTER_ROLE()
    const presaleHasMinter = await vldx.hasRole(minterRole, addresses.presale)
    console.log(`Presale has MINTER_ROLE: ${presaleHasMinter ? "✅ YES" : "❌ NO"}`)

    if (!presaleHasMinter) {
      console.log("❌ Presale contract doesn't have MINTER_ROLE")
      console.log("Granting MINTER_ROLE to presale contract...")

      const grantTx = await vldx.grantRole(minterRole, addresses.presale)
      await grantTx.wait()
      console.log("✅ MINTER_ROLE granted to presale contract")
    }

    // Update oracle prices
    console.log("\n💰 Setting Oracle Prices:")
    console.log("==========================")
    const wldUsdPrice = ethers.utils.parseEther("1.25") // 1 WLD = $1.25
    const wethUsdPrice = ethers.utils.parseEther("3500") // 1 WETH = $3500

    console.log(`Setting WLD price: $${ethers.utils.formatEther(wldUsdPrice)}`)
    console.log(`Setting WETH price: $${ethers.utils.formatEther(wethUsdPrice)}`)

    const updatePricesTx = await presale.updateOraclePrices(wldUsdPrice, wethUsdPrice)
    await updatePricesTx.wait()
    console.log("✅ Oracle prices updated")

    // Start the presale
    console.log("\n🚀 Starting Presale:")
    console.log("====================")
    const startTx = await presale.startPresale()
    await startTx.wait()
    console.log("✅ Presale started successfully!")

    // Get presale parameters
    const basePrice = await presale.basePrice()
    const finalPrice = await presale.getFinalPrice()
    const maxTokensForSale = await presale.maxTokensForSale()
    const maxRaise = await presale.maxRaise()
    const currentPrice = await presale.getCurrentPrice()

    console.log("\n📊 Presale Parameters:")
    console.log("======================")
    console.log(`Base Price: $${ethers.utils.formatEther(basePrice)} per VLDX`)
    console.log(`Final Price: $${ethers.utils.formatEther(finalPrice)} per VLDX`)
    console.log(`Current Price: $${ethers.utils.formatEther(currentPrice)} per VLDX`)
    console.log(`Max Tokens For Sale: ${ethers.utils.formatEther(maxTokensForSale)} VLDX`)
    console.log(`Max Raise: $${ethers.utils.formatEther(maxRaise)}`)

    console.log("\n🎉 Presale is now ACTIVE!")
    console.log("\n🔗 Contract Links:")
    console.log("===================")
    console.log(`Presale Contract: https://worldscan.org/address/${addresses.presale}`)
    console.log(`VLDX Token: https://worldscan.org/address/${addresses.vldxToken}`)
  } catch (error) {
    console.error("❌ Error starting presale:", error)

    if (error.message.includes("Ownable: caller is not the owner")) {
      console.error("💡 Solution: Make sure the deployer account is the owner of the presale contract")
    } else if (error.message.includes("insufficient funds")) {
      console.error("💡 Solution: Add more ETH to the deployer account for gas fees")
    } else if (error.message.includes("CALL_EXCEPTION")) {
      console.error("💡 Solution: Check if the contract is deployed correctly and has the right ABI")
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
