// Deploy script for mainnet (World Chain)
const { ethers } = require("hardhat")
const fs = require("fs")

async function main() {
  console.log("Deploying VLDX contracts to World Chain mainnet...")

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with the account:", deployer.address)

  // Deploy VLDX token
  const VLDX = await ethers.getContractFactory("VLDX")
  const vldx = await VLDX.deploy(deployer.address)
  await vldx.deployed()
  console.log("VLDX token deployed to:", vldx.address)

  // World Chain token addresses
  const wldTokenAddress = "0x163f8C2467924be0ae7B5347228CABF260318753" // Replace with actual WLD address on World Chain
  const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" // Replace with actual WETH address on World Chain

  // Uniswap V3 addresses for World Chain
  const uniswapFactoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984" // Replace with actual address
  const positionManagerAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88" // Replace with actual address
  const swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564" // Replace with actual address

  // Deploy VLDXPresale
  const VLDXPresale = await ethers.getContractFactory("VLDXPresale")
  const presale = await VLDXPresale.deploy(vldx.address, wldTokenAddress, wethTokenAddress)
  await presale.deployed()
  console.log("VLDXPresale deployed to:", presale.address)

  // Deploy VLDXLiquidity
  const lockDuration = 180 * 24 * 60 * 60 // 180 days in seconds

  const VLDXLiquidity = await ethers.getContractFactory("VLDXLiquidity")
  const liquidity = await VLDXLiquidity.deploy(
    vldx.address,
    wldTokenAddress,
    wethTokenAddress,
    lockDuration,
  )
  await liquidity.deployed()
  console.log("VLDXLiquidity deployed to:", liquidity.address)

  // Deploy VLDXSwapper
  const VLDXSwapper = await ethers.getContractFactory("VLDXSwapper")
  const swapper = await VLDXSwapper.deploy(vldx.address)
  await swapper.deployed()
  console.log("VLDXSwapper deployed to:", swapper.address)

  // Grant roles to contracts
  const minterRole = await vldx.MINTER_ROLE()
  await vldx.grantRole(minterRole, presale.address)
  console.log("Granted MINTER_ROLE to presale contract")

  console.log("All contracts deployed successfully to World Chain mainnet!")

  // Save deployment info to a JSON file
  const deploymentInfo = {
    vldxToken: vldx.address,
    presale: presale.address,
    liquidity: liquidity.address,
    swapper: swapper.address,
    // You might want to include wldTokenAddress and wethTokenAddress if they are part of your deployment info
    wldToken: wldTokenAddress,
    wethToken: wethTokenAddress,
    deployer: deployer.address,
  };

  fs.writeFileSync("./deployment-info.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to deployment-info.json");

  // Verify contracts on block explorer (if applicable)
  console.log("\nVerify contracts with:")
  console.log(`npx hardhat verify --network world-mainnet ${vldx.address} ${deployer.address}`)
  console.log(
    `npx hardhat verify --network world-mainnet ${presale.address} ${vldx.address} ${wldTokenAddress} ${wethTokenAddress}`,
  )
  console.log(
    `npx hardhat verify --network world-mainnet ${liquidity.address} ${vldx.address} ${wldTokenAddress} ${wethTokenAddress} ${uniswapFactoryAddress} ${positionManagerAddress} ${lockDuration}`,
  )
  console.log(`npx hardhat verify --network world-mainnet ${swapper.address} ${vldx.address} ${swapRouterAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
