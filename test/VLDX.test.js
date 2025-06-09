const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("VLDX", function () {
  let VLDXToken
  let vldx
  let deployer
  let addr1
  let addr2

  // Before each test, deploy a new VLDX contract
  beforeEach(async function () {
    [deployer, addr1, addr2] = await ethers.getSigners()
    VLDXToken = await ethers.getContractFactory("VLDX")
    vldx = await VLDXToken.deploy(deployer.address)
    await vldx.deployed()
  })

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await vldx.name()).to.equal("Validium-X Coin")
      expect(await vldx.symbol()).to.equal("VLDX")
    })

    it("Should assign the deployer as the DEFAULT_ADMIN_ROLE", async function () {
      const DEFAULT_ADMIN_ROLE = await vldx.DEFAULT_ADMIN_ROLE()
      expect(await vldx.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be.true
    })

    it("Should assign the deployer as MINTER_ROLE, BURNER_ROLE, and GOVERNANCE_ROLE", async function () {
      const MINTER_ROLE = await vldx.MINTER_ROLE()
      const BURNER_ROLE = await vldx.BURNER_ROLE()
      const GOVERNANCE_ROLE = await vldx.GOVERNANCE_ROLE()

      expect(await vldx.hasRole(MINTER_ROLE, deployer.address)).to.be.true
      expect(await vldx.hasRole(BURNER_ROLE, deployer.address)).to.be.true
      expect(await vldx.hasRole(GOVERNANCE_ROLE, deployer.address)).to.be.true
    })

    it("Should have trading disabled by default", async function () {
      expect(await vldx.tradingEnabled()).to.be.false
    })
  })

  describe("Trading", function () {
    it("Should allow GOVERNANCE_ROLE to enable trading", async function () {
      const GOVERNANCE_ROLE = await vldx.GOVERNANCE_ROLE()
      // Ensure deployer has GOVERNANCE_ROLE (already checked in Deployment tests)
      await vldx.setTradingEnabled(true)
      expect(await vldx.tradingEnabled()).to.be.true
    })

    it("Should revert if non-GOVERNANCE_ROLE tries to enable trading", async function () {
      await expect(vldx.connect(addr1).setTradingEnabled(true))
        .to.be.revertedWith(
          `AccessControl: account ${addr1.address.toLowerCase()} is missing role ${await vldx.GOVERNANCE_ROLE()}`
        )
    })

    it("Should prevent transfers when trading is disabled", async function () {
      // Mint some tokens to deployer for testing
      const MINTER_ROLE = await vldx.MINTER_ROLE()
      await vldx.mint(deployer.address, ethers.utils.parseEther("1000"))

      // Attempt to transfer from deployer to addr1 by addr1 (who doesn't have GOVERNANCE_ROLE)
      await expect(vldx.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("100")))
        .to.be.revertedWith("VLDX: trading not enabled")
    })

    it("Should allow transfers when trading is enabled", async function () {
      // Enable trading
      await vldx.setTradingEnabled(true)

      // Mint some tokens to deployer for testing
      const MINTER_ROLE = await vldx.MINTER_ROLE()
      await vldx.mint(deployer.address, ethers.utils.parseEther("1000"))

      // Transfer tokens
      await vldx.transfer(addr1.address, ethers.utils.parseEther("100"))
      expect(await vldx.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"))
    })
  })

  // Add more describe blocks and tests for other functionalities (minting, burning, allocations, etc.)
}) 