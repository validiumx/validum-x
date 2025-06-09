// run-commands.js - Helper script to run commands properly
const { execSync } = require("child_process")

const commands = {
  "enable-trading": "npx hardhat run scripts/enable-trading-fixed.js --network world-mainnet",
  "verify-contracts": "npx hardhat run scripts/verify-contracts.js --network world-mainnet",
  "verify-contracts-fixed": "npx hardhat run scripts/verify-contracts-fixed.js --network world-mainnet",
  "verify-contracts-new": "npx hardhat run scripts/verify-contracts-new.js --network world-mainnet",
  "check-constructor-args": "npx hardhat run scripts/check-constructor-args.js --network world-mainnet",
  "check-status": "npx hardhat run scripts/check-status.js --network world-mainnet",
  "mint-tokens": "npx hardhat run scripts/mint-initial-tokens.js --network world-mainnet",
  "transfer-to-presale": "npx hardhat run scripts/transfer-to-presale.js --network world-mainnet",
  "start-presale": "npx hardhat run scripts/start-presale.js --network world-mainnet",
  "start-presale-safe": "npx hardhat run scripts/start-presale-safe.js --network world-mainnet",
  deploy: "npx hardhat run scripts/deploy.js --network world-mainnet",
  "setup-complete": "npx hardhat run scripts/setup-complete.js --network world-mainnet",
  "distribute-tokens": "npx hardhat run scripts/distribute-tokens.js --network world-mainnet",
}

async function main() {
  const command = process.argv[2]

  if (!command || !commands[command]) {
    console.log("Available commands:")
    console.log("==================")
    Object.keys(commands).forEach((cmd) => {
      console.log(`  node scripts/run-commands.js ${cmd}`)
    })
    console.log("\nRecommended sequence:")
    console.log("1. check-constructor-args")
    console.log("2. start-presale-safe")
    console.log("3. check-status")
    return
  }

  console.log(`Running: ${commands[command]}`)
  try {
    execSync(commands[command], { stdio: "inherit" })
  } catch (error) {
    console.error("Command failed:", error.message)
    process.exit(1)
  }
}

main()
