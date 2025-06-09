const { ethers } = require("hardhat");

async function main() {
  // --- Untuk VLDXPresale ---
  console.log("--- VLDXPresale Arguments ---");
  const VLDXPresale = await ethers.getContractFactory("VLDXPresale");
  const presaleConstructorAbi = VLDXPresale.interface.getFunction("constructor").inputs;

  // Argumen mentah (raw arguments) untuk VLDXPresale
  const presaleArgs = [
    "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97", // _vldxToken (Alamat VLDX Token anda yang TERKINI)
    "0x163f8C2467924be0ae7B5347228CABF260318753", // _wldToken
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // _wethToken
  ];

  const encodedPresaleArgs = ethers.utils.defaultAbiCoder.encode(
    presaleConstructorAbi,
    presaleArgs
  );
  console.log("ABI-encoded VLDXPresale Constructor Args:", encodedPresaleArgs);
  console.log("\n");


  // --- Untuk VLDXLiquidity ---
  console.log("--- VLDXLiquidity Arguments ---");
  const VLDXLiquidity = await ethers.getContractFactory("VLDXLiquidity");
  const liquidityConstructorAbi = VLDXLiquidity.interface.getFunction("constructor").inputs;

  // Argumen mentah (raw arguments) untuk VLDXLiquidity
  const liquidityArgs = [
    "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97", // _vldxToken (Alamat VLDX Token anda yang TERKINI)
    "0x163f8C2467924be0ae7B5347228CABF260318753", // _wldToken
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // _wethToken
    15552000, // _lockDuration (180 hari dalam saat)
  ];

  const encodedLiquidityArgs = ethers.utils.defaultAbiCoder.encode(
    liquidityConstructorAbi,
    liquidityArgs
  );
  console.log("ABI-encoded VLDXLiquidity Constructor Args:", encodedLiquidityArgs);
  console.log("\n");


  // --- Untuk VLDXSwapper ---
  console.log("--- VLDXSwapper Arguments ---");
  const VLDXSwapper = await ethers.getContractFactory("VLDXSwapper");
  const swapperConstructorAbi = VLDXSwapper.interface.getFunction("constructor").inputs;

  // Argumen mentah (raw arguments) untuk VLDXSwapper
  const swapperArgs = [
    "0x1B6009F25eD740e76EEE1C5168E66d2bbA715a97", // _vldxToken (Alamat VLDX Token anda yang TERKINI)
    "0xE592427A0AEce92De3Edee1F18E0157C05861564", // _swapRouter
  ];

  const encodedSwapperArgs = ethers.utils.defaultAbiCoder.encode(
    swapperConstructorAbi,
    swapperArgs
  );
  console.log("ABI-encoded VLDXSwapper Constructor Args:", encodedSwapperArgs);
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 