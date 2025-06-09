"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "@/components/web3-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from "@/lib/contract-config"
import { presaleAbi, erc20Abi } from "@/lib/contract-abis"
import { formatAmount, formatUSD } from "@/lib/utils"

interface PresaleFormProps {
  setError: (error: string | null) => void
}

export function PresaleForm({ setError }: PresaleFormProps) {
  const { provider, signer, account, chainId } = useWeb3()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("wld")
  const [wldAmount, setWldAmount] = useState("")
  const [wethAmount, setWethAmount] = useState("")
  const [estimatedVldx, setEstimatedVldx] = useState<ethers.BigNumber>(ethers.BigNumber.from(0))
  const [wldBalance, setWldBalance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0))
  const [wethBalance, setWethBalance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0))
  const [wldAllowance, setWldAllowance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0))
  const [wethAllowance, setWethAllowance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0))
  const [isCalculating, setIsCalculating] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [presaleActive, setPresaleActive] = useState(false)
  const [presaleFinalized, setPresaleFinalized] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [currentPrice, setCurrentPrice] = useState<ethers.BigNumber>(ethers.BigNumber.from(0))
  const [wldUsdPrice, setWldUsdPrice] = useState<ethers.BigNumber>(ethers.utils.parseEther("1"))
  const [wethUsdPrice, setWethUsdPrice] = useState<ethers.BigNumber>(ethers.utils.parseEther("3000"))

  // Get contract addresses based on current chain
  const getAddresses = () => {
    const networkId = chainId || DEFAULT_CHAIN_ID
    return CONTRACT_ADDRESSES[networkId as keyof typeof CONTRACT_ADDRESSES]
  }

  // Fetch balances and allowances
  useEffect(() => {
    if (!provider || !account) return

    const fetchBalancesAndAllowances = async () => {
      try {
        const addresses = getAddresses()
        if (!addresses) {
          throw new Error(`Unsupported network ID: ${chainId}`)
        }

        const wldContract = new ethers.Contract(addresses.wld, erc20Abi, provider)
        const wethContract = new ethers.Contract(addresses.weth, erc20Abi, provider)
        const presaleContract = new ethers.Contract(addresses.presale, presaleAbi, provider)

        const [
          wldBalanceResult,
          wethBalanceResult,
          wldAllowanceResult,
          wethAllowanceResult,
          presaleActiveResult,
          presaleFinalizedResult,
          currentPriceResult,
          wldUsdPriceResult,
          wethUsdPriceResult,
        ] = await Promise.all([
          wldContract.balanceOf(account),
          wethContract.balanceOf(account),
          wldContract.allowance(account, addresses.presale),
          wethContract.allowance(account, addresses.presale),
          presaleContract.presaleActive(),
          presaleContract.presaleFinalized(),
          presaleContract.getCurrentPrice(),
          presaleContract.wldUsdPrice(),
          presaleContract.wethUsdPrice(),
        ])

        setWldBalance(wldBalanceResult)
        setWethBalance(wethBalanceResult)
        setWldAllowance(wldAllowanceResult)
        setWethAllowance(wethAllowanceResult)
        setPresaleActive(presaleActiveResult)
        setPresaleFinalized(presaleFinalizedResult)
        setCurrentPrice(currentPriceResult)
        setWldUsdPrice(wldUsdPriceResult)
        setWethUsdPrice(wethUsdPriceResult)
        setError(null)
      } catch (error) {
        console.error("Error fetching balances and allowances:", error)
        setError("Failed to load your token balances. Please try again later.")
      }
    }

    fetchBalancesAndAllowances()

    // Refresh every 30 seconds
    const intervalId = setInterval(fetchBalancesAndAllowances, 30000)
    return () => clearInterval(intervalId)
  }, [provider, account, chainId, setError])

  // Calculate estimated VLDX tokens
  useEffect(() => {
    if (!provider || !signer) return

    const calculateEstimatedVldx = async () => {
      const amount = activeTab === "wld" ? wldAmount : wethAmount
      if (!amount || Number.parseFloat(amount) <= 0) {
        setEstimatedVldx(ethers.BigNumber.from(0))
        return
      }

      setIsCalculating(true)
      try {
        const addresses = getAddresses()
        if (!addresses) {
          throw new Error(`Unsupported network ID: ${chainId}`)
        }

        const presaleContract = new ethers.Contract(addresses.presale, presaleAbi, provider)
        const tokenContract = new ethers.Contract(
          activeTab === "wld" ? addresses.wld : addresses.weth,
          erc20Abi,
          provider,
        )

        // Get token decimals
        const decimals = await tokenContract.decimals()

        // Convert input amount to token amount with proper decimals
        const tokenAmount = ethers.utils.parseUnits(amount, decimals)

        // Calculate USD value
        const usdValue = tokenAmount
          .mul(activeTab === "wld" ? wldUsdPrice : wethUsdPrice)
          .div(ethers.utils.parseUnits("1", decimals))

        // Calculate estimated VLDX tokens
        const estimatedTokens = await presaleContract.calculateTokenAmount(usdValue)
        setEstimatedVldx(estimatedTokens)
      } catch (error) {
        console.error("Error calculating estimated VLDX:", error)
        toast({
          title: "Calculation Error",
          description: "Failed to calculate estimated VLDX tokens.",
          variant: "destructive",
        })
        setEstimatedVldx(ethers.BigNumber.from(0))
      } finally {
        setIsCalculating(false)
      }
    }

    const debounceTimer = setTimeout(calculateEstimatedVldx, 500)
    return () => clearTimeout(debounceTimer)
  }, [provider, signer, activeTab, wldAmount, wethAmount, chainId, toast, wldUsdPrice, wethUsdPrice])

  // Handle input change
  const handleAmountChange = (value: string, token: "wld" | "weth") => {
    // Remove non-numeric characters except for decimal point
    const sanitizedValue = value.replace(/[^0-9.]/g, "")

    // Ensure only one decimal point
    const parts = sanitizedValue.split(".")
    const formattedValue = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : sanitizedValue

    if (token === "wld") {
      setWldAmount(formattedValue)
    } else {
      setWethAmount(formattedValue)
    }
  }

  // Handle max button click
  const handleMaxClick = () => {
    if (activeTab === "wld" && wldBalance.gt(0)) {
      const formatted = formatAmount(wldBalance)
      setWldAmount(formatted)
    } else if (activeTab === "weth" && wethBalance.gt(0)) {
      const formatted = formatAmount(wethBalance)
      setWethAmount(formatted)
    }
  }

  // Handle approve
  const handleApprove = async () => {
    if (!signer) return

    setIsApproving(true)
    try {
      const addresses = getAddresses()
      if (!addresses) {
        throw new Error(`Unsupported network ID: ${chainId}`)
      }

      const tokenAddress = activeTab === "wld" ? addresses.wld : addresses.weth
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer)

      // Approve max uint256
      const tx = await tokenContract.approve(addresses.presale, ethers.constants.MaxUint256)

      toast({
        title: "Approval Submitted",
        description: "Please wait for the transaction to be confirmed.",
      })

      await tx.wait()

      // Update allowance
      if (activeTab === "wld") {
        setWldAllowance(ethers.constants.MaxUint256)
      } else {
        setWethAllowance(ethers.constants.MaxUint256)
      }

      toast({
        title: "Approval Successful",
        description: "You can now participate in the presale.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error approving token:", error)
      toast({
        title: "Approval Failed",
        description: "Failed to approve token. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  // Handle purchase
  const handlePurchase = async () => {
    if (!signer) return

    setIsPurchasing(true)
    setTxHash(null)
    try {
      const addresses = getAddresses()
      if (!addresses) {
        throw new Error(`Unsupported network ID: ${chainId}`)
      }

      const presaleContract = new ethers.Contract(addresses.presale, presaleAbi, signer)
      const tokenContract = new ethers.Contract(
        activeTab === "wld" ? addresses.wld : addresses.weth,
        erc20Abi,
        provider,
      )

      // Get token decimals
      const decimals = await tokenContract.decimals()

      // Convert input amount to token amount with proper decimals
      const amount = activeTab === "wld" ? wldAmount : wethAmount
      const tokenAmount = ethers.utils.parseUnits(amount, decimals)

      // Purchase tokens
      const tx =
        activeTab === "wld"
          ? await presaleContract.purchaseWithWLD(tokenAmount)
          : await presaleContract.purchaseWithWETH(tokenAmount)

      toast({
        title: "Purchase Submitted",
        description: "Please wait for the transaction to be confirmed.",
      })

      const receipt = await tx.wait()
      setTxHash(receipt.transactionHash)

      // Reset form
      if (activeTab === "wld") {
        setWldAmount("")
      } else {
        setWethAmount("")
      }

      toast({
        title: "Purchase Successful",
        description: "You have successfully purchased VLDX tokens.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error purchasing tokens:", error)
      toast({
        title: "Purchase Failed",
        description: "Failed to purchase tokens. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  // Check if purchase is disabled
  const isPurchaseDisabled = () => {
    if (!presaleActive || presaleFinalized) return true
    if (isPurchasing || isCalculating) return true

    const amount = activeTab === "wld" ? wldAmount : wethAmount
    if (!amount || Number.parseFloat(amount) <= 0) return true

    const tokenAmount =
      activeTab === "wld" ? ethers.utils.parseEther(wldAmount || "0") : ethers.utils.parseEther(wethAmount || "0")

    const balance = activeTab === "wld" ? wldBalance : wethBalance
    const allowance = activeTab === "wld" ? wldAllowance : wethAllowance

    return tokenAmount.gt(balance) || tokenAmount.gt(allowance)
  }

  // Check if approval is needed
  const needsApproval = () => {
    const amount = activeTab === "wld" ? wldAmount : wethAmount
    if (!amount || Number.parseFloat(amount) <= 0) return false

    const tokenAmount = ethers.utils.parseEther(amount)
    const allowance = activeTab === "wld" ? wldAllowance : wethAllowance

    return tokenAmount.gt(allowance)
  }

  if (!presaleActive && !presaleFinalized) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <h3 className="mb-4 text-xl font-semibold">Presale Not Active</h3>
        <p className="text-center text-muted-foreground">
          The presale is not currently active. Please check back later.
        </p>
      </div>
    )
  }

  if (presaleFinalized) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <h3 className="mb-4 text-xl font-semibold">Presale Finalized</h3>
        <p className="text-center text-muted-foreground">
          The presale has been finalized. VLDX tokens are now available for trading.
        </p>
        <Button className="mt-6" variant="outline" asChild>
          <a href="#" target="_blank" rel="noopener noreferrer">
            Trade VLDX
          </a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Participate in Presale</h3>

      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle>Bonding Curve Presale</AlertTitle>
        <AlertDescription className="text-sm">
          The VLDX presale uses a bonding curve mechanism where the price increases as more tokens are sold. Starting at
          $0.01 and increasing to $0.02 per token. Buy early for the best price!
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "wld" | "weth")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wld">WLD</TabsTrigger>
          <TabsTrigger value="weth">WETH</TabsTrigger>
        </TabsList>

        <TabsContent value="wld" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="wld-amount">WLD Amount</Label>
              <span className="text-xs text-muted-foreground">Balance: {formatAmount(wldBalance)} WLD</span>
            </div>
            <div className="flex space-x-2">
              <Input
                id="wld-amount"
                type="text"
                placeholder="0.0"
                value={wldAmount}
                onChange={(e) => handleAmountChange(e.target.value, "wld")}
                disabled={isPurchasing}
              />
              <Button variant="outline" onClick={handleMaxClick} disabled={isPurchasing || wldBalance.isZero()}>
                Max
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="weth" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="weth-amount">WETH Amount</Label>
              <span className="text-xs text-muted-foreground">Balance: {formatAmount(wethBalance)} WETH</span>
            </div>
            <div className="flex space-x-2">
              <Input
                id="weth-amount"
                type="text"
                placeholder="0.0"
                value={wethAmount}
                onChange={(e) => handleAmountChange(e.target.value, "weth")}
                disabled={isPurchasing}
              />
              <Button variant="outline" onClick={handleMaxClick} disabled={isPurchasing || wethBalance.isZero()}>
                Max
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="rounded-lg bg-muted p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Current Price:</span>
          <span className="font-medium">{formatUSD(currentPrice)} per VLDX</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">You will receive:</span>
          <span className="font-medium">
            {isCalculating ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </span>
            ) : (
              `${formatAmount(estimatedVldx)} VLDX`
            )}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Effective price:</span>
          <span>
            {estimatedVldx.gt(0) && !isCalculating
              ? formatUSD(
                  ethers.utils
                    .parseEther(activeTab === "wld" ? wldAmount || "0" : wethAmount || "0")
                    .mul(activeTab === "wld" ? wldUsdPrice : wethUsdPrice)
                    .div(estimatedVldx),
                )
              : "$0.00"}
          </span>
        </div>
      </div>

      {txHash && (
        <Alert className="bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="flex items-center justify-between">
            <span>Transaction successful!</span>
            <a
              href={`https://worldchain-sepolia.explorer.alchemy.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              View on Explorer
            </a>
          </AlertDescription>
        </Alert>
      )}

      {needsApproval() ? (
        <Button className="w-full" onClick={handleApprove} disabled={isApproving || isPurchasing}>
          {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Approve {activeTab.toUpperCase()}
        </Button>
      ) : (
        <Button className="w-full" onClick={handlePurchase} disabled={isPurchaseDisabled()}>
          {isPurchasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Purchase VLDX
        </Button>
      )}

      <div className="text-center text-xs text-muted-foreground">
        By participating in the presale, you agree to the terms and conditions.
      </div>
    </div>
  )
}
