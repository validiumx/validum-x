// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./VLDX.sol";

/**
 * @title VLDX Liquidity
 * @dev Simplified liquidity management for VLDX tokens
 */
contract VLDXLiquidity is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Token contracts
    VLDX public vldxToken;
    IERC20 public wldToken;
    IERC20 public wethToken;
    
    // Liquidity parameters
    uint256 public lockDuration; // Duration to lock LP tokens in seconds
    
    // Liquidity state
    mapping(address => uint256) public tokenBalances; // token => balance
    uint256 public liquidityUnlockTime; // When liquidity can be withdrawn
    
    // Liquidity pools for different pairs
    struct LiquidityPool {
        uint256 token0Balance;
        uint256 token1Balance;
        uint256 totalLiquidity;
        bool active;
    }
    
    mapping(bytes32 => LiquidityPool) public liquidityPools;
    
    // Events
    event LiquidityDeposited(address indexed token, uint256 amount);
    event LiquidityWithdrawn(address indexed token, uint256 amount, address indexed to);
    event LiquidityLocked(uint256 unlockTime);
    event PoolCreated(bytes32 indexed poolId, address token0, address token1);
    event LiquidityAdded(bytes32 indexed poolId, uint256 amount0, uint256 amount1);
    
    /**
     * @dev Constructor initializes the liquidity contract
     * @param _vldxToken Address of the VLDX token contract
     * @param _wldToken Address of the WLD token contract
     * @param _wethToken Address of the WETH token contract
     * @param _lockDuration Duration to lock LP tokens in seconds
     */
    constructor(
        address _vldxToken,
        address _wldToken,
        address _wethToken,
        uint256 _lockDuration
    ) Ownable() {
        vldxToken = VLDX(_vldxToken);
        wldToken = IERC20(_wldToken);
        wethToken = IERC20(_wethToken);
        
        lockDuration = _lockDuration;
        liquidityUnlockTime = block.timestamp + lockDuration;
        
        emit LiquidityLocked(liquidityUnlockTime);
    }
    
    /**
     * @dev Creates a liquidity pool for two tokens
     * @param token0 Address of the first token
     * @param token1 Address of the second token
     * @return poolId The ID of the created pool
     */
    function createPool(address token0, address token1) internal onlyOwner returns (bytes32 poolId) {
        require(token0 != token1, "Liquidity: identical tokens");
        require(token0 != address(0) && token1 != address(0), "Liquidity: zero address");
        
        // Sort tokens to ensure consistent pool ID
        if (token0 > token1) {
            (token0, token1) = (token1, token0);
        }
        
        poolId = keccak256(abi.encodePacked(token0, token1));
        require(!liquidityPools[poolId].active, "Liquidity: pool already exists");
        
        liquidityPools[poolId] = LiquidityPool({
            token0Balance: 0,
            token1Balance: 0,
            totalLiquidity: 0,
            active: true
        });
        
        emit PoolCreated(poolId, token0, token1);
        return poolId;
    }
    
    /**
     * @dev Adds liquidity to a specific pool
     * @param token0 Address of the first token
     * @param token1 Address of the second token
     * @param amount0 Amount of first token to add
     * @param amount1 Amount of second token to add
     */
    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external onlyOwner nonReentrant {
        require(amount0 > 0 && amount1 > 0, "Liquidity: amounts must be greater than 0");
        
        // Sort tokens to match pool ID
        if (token0 > token1) {
            (token0, token1) = (token1, token0);
            (amount0, amount1) = (amount1, amount0);
        }
        
        bytes32 poolId = keccak256(abi.encodePacked(token0, token1));
        LiquidityPool storage pool = liquidityPools[poolId];
        
        if (!pool.active) {
            // Create pool if it doesn't exist
            poolId = createPool(token0, token1);
            pool = liquidityPools[poolId];
        }
        
        // Transfer tokens from sender
        IERC20(token0).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(token1).safeTransferFrom(msg.sender, address(this), amount1);
        
        // Update pool balances
        pool.token0Balance += amount0;
        pool.token1Balance += amount1;
        pool.totalLiquidity += (amount0 + amount1); // Simplified liquidity calculation
        
        // Update individual token balances
        tokenBalances[token0] += amount0;
        tokenBalances[token1] += amount1;
        
        emit LiquidityAdded(poolId, amount0, amount1);
    }
    
    /**
     * @dev Deposits tokens into the liquidity contract
     * @param token Address of the token to deposit
     * @param amount Amount of tokens to deposit
     */
    function depositLiquidity(address token, uint256 amount) external onlyOwner nonReentrant {
        require(token == address(vldxToken) || token == address(wldToken) || token == address(wethToken), 
                "Liquidity: unsupported token");
        require(amount > 0, "Liquidity: amount must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        tokenBalances[token] += amount;
        
        emit LiquidityDeposited(token, amount);
    }
    
    /**
     * @dev Withdraws tokens from the liquidity contract
     * @param token Address of the token to withdraw
     * @param amount Amount of tokens to withdraw
     * @param to Address to send tokens to
     */
    function withdrawLiquidity(address token, uint256 amount, address to) external onlyOwner nonReentrant {
        require(block.timestamp >= liquidityUnlockTime, "Liquidity: still locked");
        require(tokenBalances[token] >= amount, "Liquidity: insufficient balance");
        require(to != address(0), "Liquidity: invalid recipient");
        
        tokenBalances[token] -= amount;
        IERC20(token).safeTransfer(to, amount);
        
        emit LiquidityWithdrawn(token, amount, to);
    }
    
    /**
     * @dev Extends the lock duration
     * @param additionalTime Additional time to lock in seconds
     */
    function extendLock(uint256 additionalTime) external onlyOwner {
        liquidityUnlockTime += additionalTime;
        emit LiquidityLocked(liquidityUnlockTime);
    }
    
    /**
     * @dev Emergency withdraw function for owner
     * @param token Address of the token to withdraw
     * @param to Address to send tokens to
     */
    function emergencyWithdraw(address token, address to) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).safeTransfer(to, balance);
            tokenBalances[token] = 0;
        }
    }
    
    /**
     * @dev Returns the balance of a specific token
     * @param token Address of the token
     * @return Balance of the token
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return tokenBalances[token];
    }
    
    /**
     * @dev Returns all token balances
     * @return vldxBalance Balance of VLDX tokens
     * @return wldBalance Balance of WLD tokens
     * @return wethBalance Balance of WETH tokens
     */
    function getAllBalances() external view returns (uint256 vldxBalance, uint256 wldBalance, uint256 wethBalance) {
        return (
            tokenBalances[address(vldxToken)],
            tokenBalances[address(wldToken)],
            tokenBalances[address(wethToken)]
        );
    }
    
    /**
     * @dev Returns pool information
     * @param token0 Address of the first token
     * @param token1 Address of the second token
     * @return pool The liquidity pool information
     */
    function getPool(address token0, address token1) external view returns (LiquidityPool memory pool) {
        if (token0 > token1) {
            (token0, token1) = (token1, token0);
        }
        bytes32 poolId = keccak256(abi.encodePacked(token0, token1));
        return liquidityPools[poolId];
    }
}
