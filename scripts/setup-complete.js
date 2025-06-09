// setup-complete.js - Complete setup for all contracts with updated bonding curve
const { ethers } = require("hardhat")

async function main() {
  console.log("Setting up complete VLDX ecosystem with updated bonding curve...")

  // Contract addresses
  const addresses = {
    vldxToken: "0x701aB55cb87FB8dA4fE3f45FFf6cc1eA60965310",
    presale: "0x625A522cB032eB832b3077E9b85a323D05b34a37",
    liquidity: "0x2308fc53ec7a8A818AaA116D0c0B34392529BAbe",
    swapper: "0x4eA231fc1BA3B5b4d0cc2a3a3FfB6f1E43468985",
    treasury: "0xD3E97f2dB4703D3972AC3F9E29762156B089604f",
    team: "0xE0E25EB1A1C5924615D1628bD8748105969480C5",
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Executing with account:", deployer.address)

  // Connect to contracts
  const VLDX = await ethers.getContractFactory("VLDX")
  const vldx = VLDX.attach(addresses.vldxToken)

  const VLDXPresale = await ethers.getContractFactory("VLDXPresale")
  const presale = VLDXPresale.attach(addresses.presale)

  console.log("Connected to all contracts")

  try {
    // Step 1: Grant necessary roles
    console.log("\n1. Setting up roles...")
    const minterRole = await vldx.MINTER_ROLE()

    // Grant MINTER_ROLE to presale contract
    await vldx.grantRole(minterRole, addresses.presale)
    console.log("✅ Granted MINTER_ROLE to presale contract")

    // Step 2: Distribute initial tokens (excluding presale allocation)
    console.log("\n2. Distributing initial tokens...")

    // Ecosystem & Community (25%): 5B VLDX
    const ecosystemAmount = ethers.utils.parseEther("5000000000")
    await vldx.mint(addresses.vldxToken, ecosystemAmount)
    console.log(`✅ Minted ${ethers.utils.formatEther(ecosystemAmount)} VLDX to Ecosystem`)

    // Liquidity Pool (40%): 8B VLDX
    const liquidityAmount = ethers.utils.parseEther("8000000000")
    await vldx.mint(addresses.liquidity, liquidityAmount)
    console.log(`✅ Minted ${ethers.utils.formatEther(liquidityAmount)} VLDX to Liquidity`)

    // Team & Advisors (10%): 2B VLDX
    const teamAmount = ethers.utils.parseEther("2000000000")
    await vldx.mint(addresses.team, teamAmount)
    console.log(`✅ Minted ${ethers.utils.formatEther(teamAmount)} VLDX to Team`)

    // Strategic Partnerships (10%): 2B VLDX
    const partnershipsAmount = ethers.utils.parseEther("2000000000")
    await vldx.mint(addresses.swapper, partnershipsAmount)
    console.log(`✅ Minted ${ethers.utils.formatEther(partnershipsAmount)} VLDX to Partnerships`)

    // Treasury (5%): 1B VLDX
    const treasuryAmount = ethers.utils.parseEther("1000000000")
    await vldx.mint(addresses.treasury, treasuryAmount)
    console.log(`✅ Minted ${ethers.utils.formatEther(treasuryAmount)} VLDX to Treasury`)

    // Note: Presale allocation (500M VLDX) will be minted during presale

    // Step 3: Setup presale with updated parameters
    console.log("\n3. Setting up presale with updated bonding curve...")

    // Update oracle prices
    const wldUsdPrice = ethers.utils.parseEther("1.25") // $1.25
    const wethUsdPrice = ethers.utils.parseEther("3500") // $3500
    await presale.updateOraclePrices(wldUsdPrice, wethUsdPrice)
    console.log("✅ Updated oracle prices")

    // Get presale parameters to verify
    const basePrice = await presale.basePrice()
    const finalPrice = await presale.getFinalPrice()
    const maxTokensForSale = await presale.maxTokensForSale()
    const maxRaise = await presale.maxRaise()

    console.log("\nPresale Parameters:")
    console.log(`Base Price: $${ethers.utils.formatEther(basePrice)}`)
    console.log(`Final Price: $${ethers.utils.formatEther(finalPrice)}`)
    console.log(`Max Tokens: ${ethers.utils.formatEther(maxTokensForSale)} VLDX`)
    console.log(`Max Raise: $${ethers.utils.formatEther(maxRaise)}`)

    // Start presale
    const presaleActive = await presale.presaleActive()
    if (!presaleActive) {
      await presale.startPresale()
      console.log("✅ Presale started")
    } else {
      console.log("⚠️ Presale already active")
    }

    // Step 4: Enable trading
    console.log("\n4. Enabling trading...")
    const tradingEnabled = await vldx.tradingEnabled()
    if (!tradingEnabled) {
      await vldx.setTradingEnabled(true)
      console.log("✅ Trading enabled")
    } else {
      console.log("⚠️ Trading already enabled")
    }

    // Final status
    console.log("\n🎉 VLDX Ecosystem Setup Complete!")
    console.log("================================")
    console.log("Updated Bonding Curve: $0.001 → $0.002 over 500M tokens")
    console.log("Max Raise: $750,000")
    console.log("\nContract Addresses:")
    console.log(`VLDX Token: ${addresses.vldxToken}`)
    console.log(`Presale: ${addresses.presale}`)
    console.log(`Liquidity: ${addresses.liquidity}`)
    console.log(`Swapper: ${addresses.swapper}`)
    console.log(`Treasury: ${addresses.treasury}`)
    console.log(`Team: ${addresses.team}`)

    const totalSupply = await vldx.totalSupply()
    console.log(`\nTotal Supply: ${ethers.utils.formatEther(totalSupply)} VLDX`)
    console.log(`Trading Enabled: ${await vldx.tradingEnabled()}`)
    console.log(`Presale Active: ${await presale.presaleActive()}`)
  } catch (error) {
    console.error("Error during setup:", error)
    console.error("Please check your permissions and contract addresses")
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
