// distribute-tokens.js - Distribute initial token allocations
const { ethers } = require("hardhat")
const fs = require("fs")

async function main() {
  console.log("Distributing initial VLDX token allocations...")

  // Load deployment info or use hardcoded addresses
  let deploymentInfo
  try {
    deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json"))
  } catch (error) {
    console.log("Using hardcoded addresses...")
    deploymentInfo = {
      vldxToken: "0x701aB55cb87FB8dA4fE3f45FFf6cc1eA60965310",
      presale: "0x625A522cB032eB832b3077E9b85a323D05b34a37",
      liquidity: "0x2308fc53ec7a8A818AaA116D0c0B34392529BAbe",
      swapper: "0x4eA231fc1BA3B5b4d0cc2a3a3FfB6f1E43468985",
      treasury: "0xD3E97f2dB4703D3972AC3F9E29762156B089604f",
      team: "0xE0E25EB1A1C5924615D1628bD8748105969480C5",
    }
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Executing with account:", deployer.address)

  // Connect to VLDX token contract
  const VLDX = await ethers.getContractFactory("VLDX")
  const vldx = VLDX.attach(deploymentInfo.vldxToken)
  console.log("Connected to VLDX token at:", vldx.address)

  // Define allocation addresses
  const ecosystemMultisig = deploymentInfo.vldxToken // Development address
  const liquidityMultisig = deploymentInfo.liquidity // Liquidity address
  const teamMultisig = deploymentInfo.team // Team address
  const partnershipsMultisig = deploymentInfo.swapper // Sale own address
  const treasuryMultisig = deploymentInfo.treasury // Treasury address

  console.log("\nAllocation addresses:")
  console.log("--------------------")
  console.log("Ecosystem & Community:", ecosystemMultisig)
  console.log("Liquidity Pool:", liquidityMultisig)
  console.log("Team & Advisors:", teamMultisig)
  console.log("Strategic Partnerships:", partnershipsMultisig)
  console.log("Treasury:", treasuryMultisig)

  console.log("\nMinting initial token allocations...")

  try {
    // Ecosystem & Community Incentives (25%): 5,000,000,000 VLDX
    const ecosystemAmount = ethers.utils.parseEther("5000000000")
    await vldx.mint(ecosystemMultisig, ecosystemAmount)
    console.log(`✅ Minted ${ethers.utils.formatEther(ecosystemAmount)} VLDX to Ecosystem & Community`)

    // Liquidity Pool (40%): 8,000,000,000 VLDX
    const liquidityAmount = ethers.utils.parseEther("8000000000")
    await vldx.mint(liquidityMultisig, liquidityAmount)
    console.log(`✅ Minted ${ethers.utils.formatEther(liquidityAmount)} VLDX to Liquidity Pool`)

    // Team & Advisors (10%): 2,000,000,000 VLDX
    const teamAmount = ethers.utils.parseEther("2000000000")
    await vldx.mint(teamMultisig, teamAmount)
    console.log(`✅ Minted ${ethers.utils.formatEther(teamAmount)} VLDX to Team & Advisors`)

    // Strategic Partnerships (10%): 2,000,000,000 VLDX
    const partnershipsAmount = ethers.utils.parseEther("2000000000")
    await vldx.mint(partnershipsMultisig, partnershipsAmount)
    console.log(`✅ Minted ${ethers.utils.formatEther(partnershipsAmount)} VLDX to Strategic Partnerships`)

    // Treasury & Future Development (5%): 1,000,000,000 VLDX
    const treasuryAmount = ethers.utils.parseEther("1000000000")
    await vldx.mint(treasuryMultisig, treasuryAmount)
    console.log(`✅ Minted ${ethers.utils.formatEther(treasuryAmount)} VLDX to Treasury`)

    // Calculate total minted
    const totalMinted = ecosystemAmount.add(liquidityAmount).add(teamAmount).add(partnershipsAmount).add(treasuryAmount)
    console.log(`\nTotal minted: ${ethers.utils.formatEther(totalMinted)} VLDX`)

    // Check total supply
    const totalSupply = await vldx.totalSupply()
    console.log(`Current total supply: ${ethers.utils.formatEther(totalSupply)} VLDX`)

    console.log("\nInitial token distribution completed!")
    console.log("\nNext steps:")
    console.log("1. Run start-presale.js to start the presale")
    console.log("2. After presale, run add-liquidity.js to add liquidity")
    console.log("3. Run enable-trading.js to enable token transfers")
  } catch (error) {
    console.error("Error during token distribution:", error)
    console.error("Make sure you have MINTER_ROLE and sufficient permissions")
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
