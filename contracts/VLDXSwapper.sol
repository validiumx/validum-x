// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./VLDX.sol";

/**
 * @title VLDX Swapper
 * @dev Simplified token swapper for VLDX tokens
 */
contract VLDXSwapper is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Token contracts
    VLDX public vldxToken;
    
    // Swap parameters
    uint256 public constant SLIPPAGE_TOLERANCE = 50; // 0.5% slippage tolerance (basis points)
    uint256 public constant FEE_RATE = 30; // 0.3% fee (basis points)
    
    // Price oracle (simplified)
    mapping(address => uint256) public tokenPrices; // token => price in USD (scaled by 1e18)
    
    // Liquidity pools
    mapping(address => uint256) public tokenLiquidity; // token => liquidity amount
    
    // Events
    event TokensSwapped(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event PriceUpdated(address indexed token, uint256 newPrice);
    event LiquidityAdded(address indexed token, uint256 amount);
    event LiquidityRemoved(address indexed token, uint256 amount);
    
    /**
     * @dev Constructor initializes the swapper contract
     * @param _vldxToken Address of the VLDX token contract
     */
    constructor(address _vldxToken) Ownable() {
        vldxToken = VLDX(_vldxToken);
        
        // Set initial prices (these should be updated by oracle)
        tokenPrices[_vldxToken] = 15 * 10**14; // 0.0015 USD (example)
    }
    
    /**
     * @dev Updates the price of a token
     * @param token Address of the token
     * @param price New price in USD (scaled by 1e18)
     */
    function updateTokenPrice(address token, uint256 price) external onlyOwner {
        require(price > 0, "Swapper: price must be greater than 0");
        tokenPrices[token] = price;
        emit PriceUpdated(token, price);
    }
    
    /**
     * @dev Adds liquidity for a token
     * @param token Address of the token
     * @param amount Amount to add
     */
    function addLiquidity(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "Swapper: amount must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        tokenLiquidity[token] += amount;
        
        emit LiquidityAdded(token, amount);
    }
    
    /**
     * @dev Removes liquidity for a token
     * @param token Address of the token
     * @param amount Amount to remove
     * @param to Address to send tokens to
     */
    function removeLiquidity(address token, uint256 amount, address to) external onlyOwner {
        require(amount > 0, "Swapper: amount must be greater than 0");
        require(tokenLiquidity[token] >= amount, "Swapper: insufficient liquidity");
        require(to != address(0), "Swapper: invalid recipient");
        
        tokenLiquidity[token] -= amount;
        IERC20(token).safeTransfer(to, amount);
        
        emit LiquidityRemoved(token, amount);
    }
    
    /**
     * @dev Calculates swap output amount
     * @param tokenIn Address of input token
     * @param tokenOut Address of output token
     * @param amountIn Amount of input tokens
     * @return amountOut Amount of output tokens
     */
    function calculateSwapOutput(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view returns (uint256 amountOut) {
        require(tokenPrices[tokenIn] > 0 && tokenPrices[tokenOut] > 0, "Swapper: price not set");
        require(amountIn > 0, "Swapper: amount must be greater than 0");
        
        // Calculate USD value of input
        uint256 usdValue = amountIn * tokenPrices[tokenIn] / 1e18;
        
        // Apply fee
        uint256 usdValueAfterFee = usdValue * (10000 - FEE_RATE) / 10000;
        
        // Calculate output amount
        amountOut = usdValueAfterFee * 1e18 / tokenPrices[tokenOut];
        
        // Apply slippage tolerance
        amountOut = amountOut * (10000 - SLIPPAGE_TOLERANCE) / 10000;
        
        return amountOut;
    }
    
    /**
     * @dev Swaps tokens (simplified version)
     * @param tokenIn Address of input token
     * @param tokenOut Address of output token
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum amount of output tokens
     * @return amountOut Actual amount of output tokens received
     */
    function swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) external nonReentrant returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "Swapper: cannot swap same token");
        require(amountIn > 0, "Swapper: amount must be greater than 0");
        
        // Calculate output amount
        amountOut = calculateSwapOutput(tokenIn, tokenOut, amountIn);
        require(amountOut >= amountOutMin, "Swapper: insufficient output amount");
        
        // Check contract has enough output tokens
        require(tokenLiquidity[tokenOut] >= amountOut, "Swapper: insufficient liquidity");
        
        // Transfer input tokens from user
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Update liquidity
        tokenLiquidity[tokenIn] += amountIn;
        tokenLiquidity[tokenOut] -= amountOut;
        
        // Transfer output tokens to user
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
        
        emit TokensSwapped(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        
        return amountOut;
    }
    
    /**
     * @dev Returns the available liquidity for a token
     * @param token Address of the token
     * @return Available liquidity amount
     */
    function getTokenLiquidity(address token) external view returns (uint256) {
        return tokenLiquidity[token];
    }
    
    /**
     * @dev Withdraws tokens from the contract
     * @param token Address of the token to withdraw
     * @param to Address to send tokens to
     * @param amount Amount to withdraw
     */
    function withdrawToken(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Swapper: invalid recipient");
        IERC20(token).safeTransfer(to, amount);
    }
    
    /**
     * @dev Emergency withdraw all tokens
     * @param token Address of the token to withdraw
     * @param to Address to send tokens to
     */
    function emergencyWithdraw(address token, address to) external onlyOwner {
        require(to != address(0), "Swapper: invalid recipient");
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).safeTransfer(to, balance);
            tokenLiquidity[token] = 0;
        }
    }
}
