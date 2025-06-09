// mint-initial-tokens.js - Mint initial tokens for testing
const { ethers } = require("hardhat")

async function main() {
  console.log("Minting initial tokens for testing...")

  const vldxTokenAddress = "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97"
  const presaleAddress = "0x52a9aDC351346f94Ab3027A7EcAeDD358F792aC8"

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Executing with account:", deployer.address)

  try {
    // Connect to VLDX token contract
    const VLDX = await ethers.getContractFactory("VLDX")
    const vldx = VLDX.attach(vldxTokenAddress)

    // Check current supply
    const currentSupply = await vldx.totalSupply()
    console.log(`Current total supply: ${ethers.utils.formatEther(currentSupply)} VLDX`)

    if (currentSupply.gt(0)) {
      console.log("⚠️ Tokens already minted!")
      return
    }

    // Check if we have minter role
    const minterRole = await vldx.MINTER_ROLE()
    const hasMinterRole = await vldx.hasRole(minterRole, deployer.address)

    if (!hasMinterRole) {
      console.log("❌ Account does not have MINTER_ROLE")
      return
    }

    // Grant minter role to presale contract
    const presaleHasMinter = await vldx.hasRole(minterRole, presaleAddress)
    if (!presaleHasMinter) {
      console.log("Granting MINTER_ROLE to presale contract...")
      await vldx.grantRole(minterRole, presaleAddress)
      console.log("✅ MINTER_ROLE granted to presale contract")
    }

    // Mint initial allocation for presale (500M tokens)
    const presaleAllocation = ethers.utils.parseEther("500000000") // 500M VLDX
    console.log(`Minting ${ethers.utils.formatEther(presaleAllocation)} VLDX for presale...`)

    await vldx.mint(deployer.address, presaleAllocation)
    console.log("✅ Presale allocation minted to deployer")

    // Mint some tokens for liquidity (1M tokens for testing)
    const liquidityAllocation = ethers.utils.parseEther("1000000") // 1M VLDX
    console.log(`Minting ${ethers.utils.formatEther(liquidityAllocation)} VLDX for liquidity...`)

    await vldx.mint(deployer.address, liquidityAllocation)
    console.log("✅ Liquidity allocation minted to deployer")

    // Check final supply
    const finalSupply = await vldx.totalSupply()
    console.log(`Final total supply: ${ethers.utils.formatEther(finalSupply)} VLDX`)

    // Check deployer balance
    const deployerBalance = await vldx.balanceOf(deployer.address)
    console.log(`Deployer balance: ${ethers.utils.formatEther(deployerBalance)} VLDX`)

    console.log("\n✅ Initial tokens minted successfully!")
    console.log("\nNext steps:")
    console.log("1. Transfer some tokens to presale contract if needed")
    console.log("2. Start the presale")
    console.log("3. Test the presale functionality")
  } catch (error) {
    console.error("❌ Error minting tokens:", error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
