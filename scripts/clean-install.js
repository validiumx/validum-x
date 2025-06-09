// clean-install.js - Clean and reinstall dependencies
const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

async function main() {
  console.log("Cleaning and reinstalling dependencies...")

  try {
    // Remove node_modules and package-lock.json
    console.log("Removing node_modules and package-lock.json...")

    if (fs.existsSync("node_modules")) {
      execSync("rm -rf node_modules", { stdio: "inherit" })
    }

    if (fs.existsSync("package-lock.json")) {
      fs.unlinkSync("package-lock.json")
    }

    // Clean Hardhat cache
    console.log("Cleaning Hardhat cache...")
    execSync("npx hardhat clean", { stdio: "inherit" })

    // Install dependencies
    console.log("Installing dependencies...")
    execSync("npm install", { stdio: "inherit" })

    // Compile contracts
    console.log("Compiling contracts...")
    execSync("npx hardhat compile", { stdio: "inherit" })

    console.log("✅ Clean installation completed successfully!")
  } catch (error) {
    console.error("❌ Error during clean installation:", error.message)
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
