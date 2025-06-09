"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "@/components/web3-provider"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from "@/lib/contract-config"
import { presaleAbi } from "@/lib/contract-abis"
import { formatAmount, formatUSD, formatPercent } from "@/lib/utils"
import { BondingCurveChart } from "@/components/bonding-curve-chart"

interface PresaleInfoProps {
  setError: (error: string | null) => void
}

export function PresaleInfo({ setError }: PresaleInfoProps) {
  const { provider, chainId } = useWeb3()
  const [presaleInfo, setPresaleInfo] = useState<{
    basePrice: ethers.BigNumber
    currentPrice: ethers.BigNumber
    finalPrice: ethers.BigNumber
    priceIncrement: ethers.BigNumber
    maxTokensForSale: ethers.BigNumber
    tokensSold: ethers.BigNumber
    maxRaise: ethers.BigNumber
    totalRaised: ethers.BigNumber
    presaleActive: boolean
    presaleFinalized: boolean
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!provider || !chainId) {
      setIsLoading(false)
      return
    }

    const fetchPresaleInfo = async () => {
      setIsLoading(true)
      try {
        const networkId = chainId || DEFAULT_CHAIN_ID
        const addresses = CONTRACT_ADDRESSES[networkId as keyof typeof CONTRACT_ADDRESSES]

        if (!addresses) {
          throw new Error(`Unsupported network ID: ${networkId}`)
        }

        const presaleContract = new ethers.Contract(addresses.presale, presaleAbi, provider)

        const [
          basePrice,
          priceIncrement,
          currentPrice,
          finalPrice,
          maxTokensForSale,
          tokensSold,
          maxRaise,
          wldRaised,
          wethRaised,
          presaleActive,
          presaleFinalized,
        ] = await Promise.all([
          presaleContract.basePrice(),
          presaleContract.priceIncrement(),
          presaleContract.getCurrentPrice(),
          presaleContract.getFinalPrice(),
          presaleContract.maxTokensForSale(),
          presaleContract.tokensSold(),
          presaleContract.maxRaise(),
          presaleContract.wldRaised(),
          presaleContract.wethRaised(),
          presaleContract.presaleActive(),
          presaleContract.presaleFinalized(),
        ])

        const totalRaised = wldRaised.add(wethRaised)

        setPresaleInfo({
          basePrice,
          priceIncrement,
          currentPrice,
          finalPrice,
          maxTokensForSale,
          tokensSold,
          maxRaise,
          totalRaised,
          presaleActive,
          presaleFinalized,
        })
        setError(null)
      } catch (error) {
        console.error("Error fetching presale info:", error)
        setError("Failed to load presale information. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPresaleInfo()

    // Set up an interval to refresh the data every 30 seconds
    const intervalId = setInterval(fetchPresaleInfo, 30000)

    return () => clearInterval(intervalId)
  }, [provider, chainId, setError])

  if (isLoading) {
    return <PresaleInfoSkeleton />
  }

  if (!presaleInfo) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Presale Information</h3>
        <p className="text-muted-foreground">
          Unable to load presale information. Please connect your wallet and try again.
        </p>
      </div>
    )
  }

  const {
    basePrice,
    priceIncrement,
    currentPrice,
    finalPrice,
    maxTokensForSale,
    tokensSold,
    maxRaise,
    totalRaised,
    presaleActive,
    presaleFinalized,
  } = presaleInfo

  const soldPercentage = maxTokensForSale.gt(0) ? tokensSold.mul(100).div(maxTokensForSale).toNumber() : 0
  const raisedPercentage = maxRaise.gt(0) ? totalRaised.mul(100).div(maxRaise).toNumber() : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <img src="/images/vldx-icon-new.png" alt="VLDX" className="h-12 w-12" />
        <div>
          <h3 className="text-xl font-semibold">VLDX Presale</h3>
          <div className="flex items-center mt-1">
            <span
              className={`inline-block h-3 w-3 rounded-full ${presaleActive ? "bg-green-500" : "bg-red-500"}`}
            ></span>
            <span className="ml-2 text-sm">
              {presaleFinalized ? "Presale Finalized" : presaleActive ? "Presale Active" : "Presale Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium">Bonding Curve</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Linear price increase from $0.001 to $0.002 over 500M tokens
        </p>
        <div className="mt-3 h-48 w-full">
          <BondingCurveChart
            basePrice={basePrice}
            finalPrice={finalPrice}
            maxTokens={maxTokensForSale}
            tokensSold={tokensSold}
            currentPrice={currentPrice}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-muted-foreground">Starting Price</p>
            <p className="font-medium">{formatUSD(basePrice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current Price</p>
            <p className="font-medium">{formatUSD(currentPrice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Final Price</p>
            <p className="font-medium">{formatUSD(finalPrice)}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Tokens Sold</h3>
          <span className="text-sm text-muted-foreground">{formatPercent(soldPercentage / 100)}</span>
        </div>
        <Progress value={soldPercentage} className="mt-2" />
        <p className="mt-1 text-sm text-muted-foreground">
          {formatAmount(tokensSold)} / {formatAmount(maxTokensForSale)} VLDX
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Funds Raised</h3>
          <span className="text-sm text-muted-foreground">{formatPercent(raisedPercentage / 100)}</span>
        </div>
        <Progress value={raisedPercentage} className="mt-2" />
        <p className="mt-1 text-sm text-muted-foreground">
          {formatUSD(totalRaised)} / {formatUSD(maxRaise)}
        </p>
      </div>

      <div className="rounded-lg bg-muted p-4">
        <h3 className="text-lg font-medium">Presale Details</h3>
        <ul className="mt-2 space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-muted-foreground">Total Supply:</span>
            <span>20,000,000,000 VLDX</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Presale Allocation:</span>
            <span>500,000,000 VLDX</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Price Range:</span>
            <span>
              {formatUSD(basePrice)} - {formatUSD(finalPrice)}
            </span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Max Raise:</span>
            <span>{formatUSD(maxRaise)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Accepted Tokens:</span>
            <span>WLD, WETH</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Network:</span>
            <span>World Chain</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

function PresaleInfoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-32 mt-1" />
        </div>
      </div>

      <div>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64 mt-1" />
        <Skeleton className="mt-3 h-48 w-full" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-1 h-5 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-1 h-5 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-1 h-5 w-full" />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-40" />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-40" />
      </div>

      <div className="rounded-lg bg-muted p-4">
        <Skeleton className="h-6 w-32" />
        <div className="mt-2 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  )
}
