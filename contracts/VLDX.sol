// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title Validium-X Coin
 * @dev ERC20 token with governance capabilities, minting and burning mechanisms
 */
contract VLDX is ERC20Votes, AccessControl {
    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    
    // Token parameters
    uint256 public constant INITIAL_SUPPLY = 20_000_000_000 * 10**18; // 20 billion tokens
    uint256 public constant MAX_SUPPLY = 30_000_000_000 * 10**18; // 30 billion tokens
    
    // Distribution tracking
    uint256 public ecosystemAndCommunityAllocation;
    uint256 public liquidityPoolAllocation;
    uint256 public teamAndAdvisorsAllocation;
    uint256 public strategicPartnershipsAllocation;
    uint256 public treasuryAllocation;

    // Add trading enabled flag and modifier
    bool public tradingEnabled;
    
    modifier whenTradingEnabled() {
        require(tradingEnabled || hasRole(GOVERNANCE_ROLE, _msgSender()), "VLDX: trading not enabled");
        _;
    }
    
    /**
     * @dev Enables or disables trading
     * @param enabled Whether trading should be enabled
     */
    function setTradingEnabled(bool enabled) external onlyRole(GOVERNANCE_ROLE) {
        tradingEnabled = enabled;
    }
    
    // Events
    event AllocationUpdated(string category, uint256 amount);
    
    /**
     * @dev Constructor initializes the token with name, symbol, and roles
     * @param admin Address that will have admin rights
     */
    constructor(address admin) 
        ERC20("Validium-X Coin", "VLDX") 
        ERC20Permit("Validium-X Coin") 
    {
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
        
        // Initialize allocation tracking
        ecosystemAndCommunityAllocation = 5_000_000_000 * 10**18; // 25%
        liquidityPoolAllocation = 8_000_000_000 * 10**18; // 40%
        teamAndAdvisorsAllocation = 2_000_000_000 * 10**18; // 10%
        strategicPartnershipsAllocation = 2_000_000_000 * 10**18; // 10%
        treasuryAllocation = 1_000_000_000 * 10**18; // 5%
        
        // Initial minting is not performed - tokens are minted on demand
    }
    
    /**
     * @dev Mints tokens to a specified address, respecting the max supply
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "VLDX: Max supply exceeded");
        _mint(to, amount);
    }
    
    /**
     * @dev Burns tokens from a specified address
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }
    
    /**
     * @dev Updates allocation tracking for a specific category
     * @param category Allocation category to update
     * @param amount New allocation amount
     */
    function updateAllocation(string memory category, uint256 amount) external onlyRole(GOVERNANCE_ROLE) {
        bytes32 categoryHash = keccak256(abi.encodePacked(category));
        
        if (categoryHash == keccak256(abi.encodePacked("ecosystem"))) {
            ecosystemAndCommunityAllocation = amount;
        } else if (categoryHash == keccak256(abi.encodePacked("liquidity"))) {
            liquidityPoolAllocation = amount;
        } else if (categoryHash == keccak256(abi.encodePacked("team"))) {
            teamAndAdvisorsAllocation = amount;
        } else if (categoryHash == keccak256(abi.encodePacked("partnerships"))) {
            strategicPartnershipsAllocation = amount;
        } else if (categoryHash == keccak256(abi.encodePacked("treasury"))) {
            treasuryAllocation = amount;
        } else {
            revert("VLDX: Invalid allocation category");
        }
        
        emit AllocationUpdated(category, amount);
    }
    
    /**
     * @dev Hook that is called before any transfer of tokens
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override whenTradingEnabled {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Hook that is called after any transfer of tokens
     */
    function _afterTokenTransfer(address from, address to, uint256 amount) internal override {
        super._afterTokenTransfer(from, to, amount);
    }
}
