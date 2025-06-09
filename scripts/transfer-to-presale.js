// transfer-to-presale.js - Transfer tokens to presale contract
const { ethers } = require("hardhat")
const fs = require("fs")

async function main() {
  console.log("Transferring tokens to presale contract...")

  // Load deployment info
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
    }
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Executing with account:", deployer.address)
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH")

  try {
    // Connect to VLDX token contract
    const VLDX = await ethers.getContractFactory("VLDX")
    const vldx = VLDX.attach(deploymentInfo.vldxToken)
    console.log("Connected to VLDX token at:", vldx.address)

    // Check deployer balance
    const deployerBalance = await vldx.balanceOf(deployer.address)
    console.log(`Deployer VLDX balance: ${ethers.utils.formatEther(deployerBalance)}`)

    if (deployerBalance.eq(0)) {
      console.log("❌ Deployer has no VLDX tokens to transfer")
      return
    }

    // Check presale contract balance
    const presaleBalance = await vldx.balanceOf(deploymentInfo.presale)
    console.log(`Presale contract VLDX balance: ${ethers.utils.formatEther(presaleBalance)}`)

    // Transfer tokens to presale contract (50% of balance)
    const amountToTransfer = deployerBalance.div(2)
    console.log(`Transferring ${ethers.utils.formatEther(amountToTransfer)} VLDX to presale contract...`)

    const tx = await vldx.transfer(deploymentInfo.presale, amountToTransfer)
    await tx.wait()
    console.log("✅ Transfer successful!")

    // Check final balances
    const finalDeployerBalance = await vldx.balanceOf(deployer.address)
    const finalPresaleBalance = await vldx.balanceOf(deploymentInfo.presale)

    console.log(`Final deployer VLDX balance: ${ethers.utils.formatEther(finalDeployerBalance)}`)
    console.log(`Final presale contract VLDX balance: ${ethers.utils.formatEther(finalPresaleBalance)}`)

    console.log("\n✅ Tokens transferred successfully!")
  } catch (error) {
    console.error("❌ Error transferring tokens:", error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
