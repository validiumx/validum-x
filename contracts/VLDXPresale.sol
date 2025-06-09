// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./VLDX.sol";

/**
 * @title VLDX Presale
 * @dev Implements a bonding curve presale for VLDX tokens
 * Bonding curve: $0.001 → $0.002 over 500M tokens
 */
contract VLDXPresale is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Token contracts
    VLDX public vldxToken;
    IERC20 public wldToken;
    IERC20 public wethToken;
    
    // Presale parameters - Updated bonding curve
    uint256 public basePrice;              // Initial price per token in USD (scaled by 1e18)
    uint256 public priceIncrement;         // Price increase per token sold (scaled by 1e18)
    uint256 public maxTokensForSale;       // Maximum tokens available for sale
    uint256 public maxRaise;               // Maximum amount to raise in USD (scaled by 1e18)
    
    // Presale state
    uint256 public tokensSold;             // Total tokens sold
    uint256 public wldRaised;              // Total WLD raised (in USD value)
    uint256 public wethRaised;             // Total WETH raised (in USD value)
    bool public presaleActive;             // Whether the presale is active
    bool public presaleFinalized;          // Whether the presale has been finalized
    
    // Price oracle (simplified for this implementation)
    uint256 public wldUsdPrice;            // WLD/USD price (scaled by 1e18)
    uint256 public wethUsdPrice;           // WETH/USD price (scaled by 1e18)
    
    // Events
    event PresaleStarted(uint256 timestamp);
    event PresaleEnded(uint256 timestamp);
    event TokensPurchased(address indexed buyer, uint256 amount, string paymentToken, uint256 paymentAmount);
    event PresaleFinalized(uint256 tokensSold, uint256 wldRaised, uint256 wethRaised);
    event OraclePricesUpdated(uint256 wldPrice, uint256 wethPrice);
    
    /**
     * @dev Constructor initializes the presale contract
     * @param _vldxToken Address of the VLDX token contract
     * @param _wldToken Address of the WLD token contract
     * @param _wethToken Address of the WETH token contract
     */
    constructor(
        address _vldxToken,
        address _wldToken,
        address _wethToken
    ) Ownable() {
        vldxToken = VLDX(_vldxToken);
        wldToken = IERC20(_wldToken);
        wethToken = IERC20(_wethToken);
        
        // Updated bonding curve parameters
        basePrice        = 1e15;                // $0.001
        priceIncrement   = 2e6;                 // ~$0.000000000000002 per token
        maxTokensForSale = 500_000_000 * 10**18; // 500 Million VLDX
        maxRaise         = 750_000 * 10**18;     // $750,000 cap
        
        // Set initial oracle prices (these would be updated by oracle in production)
        wldUsdPrice = 125 * 10**16; // 1 WLD = $1.25
        wethUsdPrice = 3500 * 10**18; // 1 WETH = $3500
        
        presaleActive = false;
        presaleFinalized = false;
    }
    
    /**
     * @dev Starts the presale
     */
    function startPresale() external onlyOwner {
        require(!presaleActive, "Presale: already active");
        require(!presaleFinalized, "Presale: already finalized");
        
        presaleActive = true;
        emit PresaleStarted(block.timestamp);
    }
    
    /**
     * @dev Ends the presale
     */
    function endPresale() external onlyOwner {
        require(presaleActive, "Presale: not active");
        require(!presaleFinalized, "Presale: already finalized");
        
        presaleActive = false;
        emit PresaleEnded(block.timestamp);
    }
    
    /**
     * @dev Updates the oracle prices
     * @param _wldUsdPrice New WLD/USD price
     * @param _wethUsdPrice New WETH/USD price
     */
    function updateOraclePrices(uint256 _wldUsdPrice, uint256 _wethUsdPrice) external onlyOwner {
        wldUsdPrice = _wldUsdPrice;
        wethUsdPrice = _wethUsdPrice;
        emit OraclePricesUpdated(_wldUsdPrice, _wethUsdPrice);
    }
    
    /**
     * @dev Calculates the current token price based on the bonding curve
     * @return Current price per token in USD (scaled by 1e18)
     */
    function getCurrentPrice() public view returns (uint256) {
        return basePrice + (tokensSold * priceIncrement / 10**18);
    }
    
    /**
     * @dev Calculates the final price when all tokens are sold
     * @return Final price per token in USD (scaled by 1e18)
     */
    function getFinalPrice() public view returns (uint256) {
        return basePrice + (maxTokensForSale * priceIncrement / 10**18);
    }
    
    /**
     * @dev Calculates the amount of tokens that can be purchased with a given USD amount
     * @param usdAmount Amount in USD (scaled by 1e18)
     * @return Amount of tokens that can be purchased
     */
    function calculateTokenAmount(uint256 usdAmount) public view returns (uint256) {
        uint256 currentPrice = getCurrentPrice();
        
        // For linear bonding curve: tokens = USD / average_price
        // Average price = (current_price + final_price_for_amount) / 2
        // Simplified calculation for small amounts
        return usdAmount * 10**18 / currentPrice;
    }
    
    /**
     * @dev Purchases VLDX tokens with WLD
     * @param wldAmount Amount of WLD to spend
     */
    function purchaseWithWLD(uint256 wldAmount) external nonReentrant {
        require(presaleActive, "Presale: not active");
        require(!presaleFinalized, "Presale: already finalized");
        require(wldAmount > 0, "Presale: amount must be greater than 0");
        
        // Calculate USD value of WLD
        uint256 usdValue = wldAmount * wldUsdPrice / 10**18;
        
        // Calculate token amount
        uint256 tokenAmount = calculateTokenAmount(usdValue);
        
        // Check if purchase exceeds limits
        require(tokensSold + tokenAmount <= maxTokensForSale, "Presale: exceeds max tokens for sale");
        require(wldRaised + usdValue + wethRaised <= maxRaise, "Presale: exceeds max raise");
        
        // Transfer WLD from buyer
        wldToken.safeTransferFrom(msg.sender, address(this), wldAmount);
        
        // Mint VLDX tokens to buyer
        vldxToken.mint(msg.sender, tokenAmount);
        
        // Update state
        tokensSold += tokenAmount;
        wldRaised += usdValue;
        
        emit TokensPurchased(msg.sender, tokenAmount, "WLD", wldAmount);
    }
    
    /**
     * @dev Purchases VLDX tokens with WETH
     * @param wethAmount Amount of WETH to spend
     */
    function purchaseWithWETH(uint256 wethAmount) external nonReentrant {
        require(presaleActive, "Presale: not active");
        require(!presaleFinalized, "Presale: already finalized");
        require(wethAmount > 0, "Presale: amount must be greater than 0");
        
        // Calculate USD value of WETH
        uint256 usdValue = wethAmount * wethUsdPrice / 10**18;
        
        // Calculate token amount
        uint256 tokenAmount = calculateTokenAmount(usdValue);
        
        // Check if purchase exceeds limits
        require(tokensSold + tokenAmount <= maxTokensForSale, "Presale: exceeds max tokens for sale");
        require(wldRaised + wethRaised + usdValue <= maxRaise, "Presale: exceeds max raise");
        
        // Transfer WETH from buyer
        wethToken.safeTransferFrom(msg.sender, address(this), wethAmount);
        
        // Mint VLDX tokens to buyer
        vldxToken.mint(msg.sender, tokenAmount);
        
        // Update state
        tokensSold += tokenAmount;
        wethRaised += usdValue;
        
        emit TokensPurchased(msg.sender, tokenAmount, "WETH", wethAmount);
    }
    
    /**
     * @dev Finalizes the presale and burns unsold tokens
     * @param liquidityContract Address of the liquidity contract to transfer funds to
     */
    function finalizePresale(address liquidityContract) external onlyOwner {
        require(!presaleActive, "Presale: still active");
        require(!presaleFinalized, "Presale: already finalized");
        require(liquidityContract != address(0), "Presale: invalid liquidity contract");
        
        // Transfer raised funds to liquidity contract
        uint256 wldBalance = wldToken.balanceOf(address(this));
        uint256 wethBalance = wethToken.balanceOf(address(this));
        
        if (wldBalance > 0) {
            wldToken.safeTransfer(liquidityContract, wldBalance);
        }
        
        if (wethBalance > 0) {
            wethToken.safeTransfer(liquidityContract, wethBalance);
        }
        
        presaleFinalized = true;
        emit PresaleFinalized(tokensSold, wldRaised, wethRaised);
    }
    
    /**
     * @dev Returns presale progress information
     * @return soldPercentage Percentage of tokens sold (scaled by 100)
     * @return raisedPercentage Percentage of max raise achieved (scaled by 100)
     * @return currentPrice Current token price
     * @return finalPrice Final token price
     */
    function getPresaleProgress() external view returns (
        uint256 soldPercentage,
        uint256 raisedPercentage,
        uint256 currentPrice,
        uint256 finalPrice
    ) {
        soldPercentage = maxTokensForSale > 0 ? (tokensSold * 10000) / maxTokensForSale : 0;
        uint256 totalRaised = wldRaised + wethRaised;
        raisedPercentage = maxRaise > 0 ? (totalRaised * 10000) / maxRaise : 0;
        currentPrice = getCurrentPrice();
        finalPrice = getFinalPrice();
    }
    
    /**
     * @dev Emergency withdraw function for owner
     * @param token Address of the token to withdraw
     * @param to Address to send tokens to
     */
    function emergencyWithdraw(address token, address to) external onlyOwner {
        require(to != address(0), "Presale: invalid recipient");
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).safeTransfer(to, balance);
        }
    }
}
