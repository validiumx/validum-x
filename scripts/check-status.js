// check-status.js - Check status of all deployed contracts
const { ethers } = require("hardhat")

async function main() {
  console.log("Checking status of all deployed contracts...")

  // Contract addresses (mainnet)
  const addresses = {
    vldxToken: "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97",
    presale: "0x52a9aDC351346f94Ab3027A7EcAeDD358F792aC8",
    liquidity: "0xfDDecfD7ca6a279B3fd765eC5667CbA7DbB4Da33",
    swapper: "0xE1BC9d5C2B26c76f353df822eFf62a6e015357Ca",
    wldToken: "0x2cfc85d8e48f8eab294be644d9e25c3030863003",
    wethToken: "0x4200000000000000000000000000000000000006",
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Checking with account:", deployer.address)
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH")

  try {
    // Check VLDX Token
    console.log("\n📊 VLDX Token Status:")
    console.log("=====================")
    const VLDX = await ethers.getContractFactory("VLDX")
    const vldx = VLDX.attach(addresses.vldxToken)

    const name = await vldx.name()
    const symbol = await vldx.symbol()
    const totalSupply = await vldx.totalSupply()
    const tradingEnabled = await vldx.tradingEnabled()

    console.log(`Name: ${name}`)
    console.log(`Symbol: ${symbol}`)
    console.log(`Total Supply: ${ethers.utils.formatEther(totalSupply)} VLDX`)
    console.log(`Trading Enabled: ${tradingEnabled}`)

    // Check roles
    const governanceRole = await vldx.GOVERNANCE_ROLE()
    const minterRole = await vldx.MINTER_ROLE()
    const hasGovernance = await vldx.hasRole(governanceRole, deployer.address)
    const hasMinter = await vldx.hasRole(minterRole, deployer.address)

    console.log(`Deployer has GOVERNANCE_ROLE: ${hasGovernance}`)
    console.log(`Deployer has MINTER_ROLE: ${hasMinter}`)

    // Check Presale
    console.log("\n🚀 Presale Status:")
    console.log("==================")
    const VLDXPresale = await ethers.getContractFactory("VLDXPresale")
    const presale = VLDXPresale.attach(addresses.presale)

    const presaleActive = await presale.presaleActive()
    const presaleFinalized = await presale.presaleFinalized()
    const tokensSold = await presale.tokensSold()
    const wldRaised = await presale.wldRaised()
    const wethRaised = await presale.wethRaised()
    const currentPrice = await presale.getCurrentPrice()
    const maxTokensForSale = await presale.maxTokensForSale()

    console.log(`Presale Active: ${presaleActive}`)
    console.log(`Presale Finalized: ${presaleFinalized}`)
    console.log(`Tokens Sold: ${ethers.utils.formatEther(tokensSold)} VLDX`)
    console.log(`WLD Raised: $${ethers.utils.formatEther(wldRaised)}`)
    console.log(`WETH Raised: $${ethers.utils.formatEther(wethRaised)}`)
    console.log(`Current Price: $${ethers.utils.formatEther(currentPrice)}`)
    console.log(`Max Tokens for Sale: ${ethers.utils.formatEther(maxTokensForSale)} VLDX`)

    const soldPercentage = maxTokensForSale.gt(0) ? tokensSold.mul(100).div(maxTokensForSale) : 0
    console.log(`Progress: ${soldPercentage}%`)

    // Check if presale contract has minter role
    const presaleHasMinter = await vldx.hasRole(minterRole, addresses.presale)
    console.log(`Presale has MINTER_ROLE: ${presaleHasMinter}`)

    console.log("\n🔗 Contract Links:")
    console.log("==================")
    console.log(`VLDX Token: https://worldscan.org/address/${addresses.vldxToken}`)
    console.log(`Presale: https://worldscan.org/address/${addresses.presale}`)
    console.log(`Liquidity: https://worldscan.org/address/${addresses.liquidity}`)
    console.log(`Swapper: https://worldscan.org/address/${addresses.swapper}`)

    console.log("\n✅ Status check completed!")

    // Recommendations
    console.log("\n💡 Recommendations:")
    console.log("===================")

    if (totalSupply.eq(0)) {
      console.log("⚠️ Total supply is 0 - consider running distribute-tokens.js")
    }

    if (!presaleActive && !presaleFinalized) {
      console.log("⚠️ Presale is not active - consider running start-presale.js")
    }

    if (!presaleHasMinter) {
      console.log("⚠️ Presale contract doesn't have MINTER_ROLE - tokens can't be minted during presale")
    }

    if (tradingEnabled && presaleActive) {
      console.log("✅ Everything looks good! Presale is active and trading is enabled.")
    }
  } catch (error) {
    console.error("❌ Error checking contract status:", error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
