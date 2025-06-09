"use client"

import { useEffect, useRef } from "react"
import { ethers } from "ethers"
import { formatUSD } from "@/lib/utils"

interface BondingCurveChartProps {
  basePrice: ethers.BigNumber
  finalPrice: ethers.BigNumber
  maxTokens: ethers.BigNumber
  tokensSold: ethers.BigNumber
  currentPrice: ethers.BigNumber
}

export function BondingCurveChart({
  basePrice,
  finalPrice,
  maxTokens,
  tokensSold,
  currentPrice,
}: BondingCurveChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get canvas dimensions
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Convert BigNumber values to numbers for easier calculation
    const basePriceNum = Number.parseFloat(ethers.utils.formatUnits(basePrice, 18))
    const finalPriceNum = Number.parseFloat(ethers.utils.formatUnits(finalPrice, 18))
    const maxTokensNum = Number.parseFloat(ethers.utils.formatUnits(maxTokens, 18))
    const tokensSoldNum = Number.parseFloat(ethers.utils.formatUnits(tokensSold, 18))
    const currentPriceNum = Number.parseFloat(ethers.utils.formatUnits(currentPrice, 18))

    // Calculate padding
    const padding = { top: 10, right: 10, bottom: 30, left: 50 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Calculate scales
    const xScale = (x: number) => (x / maxTokensNum) * chartWidth + padding.left
    const yScale = (y: number) =>
      height - padding.bottom - ((y - basePriceNum) / (finalPriceNum - basePriceNum)) * chartHeight

    // Draw axes
    ctx.beginPath()
    ctx.strokeStyle = "#94a3b8" // slate-400
    ctx.lineWidth = 1

    // X-axis
    ctx.moveTo(padding.left, height - padding.bottom)
    ctx.lineTo(width - padding.right, height - padding.bottom)

    // Y-axis
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, height - padding.bottom)
    ctx.stroke()

    // Draw bonding curve
    ctx.beginPath()
    ctx.strokeStyle = "#6366f1" // indigo-500
    ctx.lineWidth = 2

    ctx.moveTo(xScale(0), yScale(basePriceNum))

    // Draw line segments for the curve
    const segments = 100
    for (let i = 1; i <= segments; i++) {
      const x = (i / segments) * maxTokensNum
      const y = basePriceNum + ((finalPriceNum - basePriceNum) * x) / maxTokensNum
      ctx.lineTo(xScale(x), yScale(y))
    }

    ctx.stroke()

    // Draw filled area for sold tokens
    if (tokensSoldNum > 0) {
      ctx.beginPath()
      ctx.fillStyle = "rgba(99, 102, 241, 0.2)" // indigo-500 with opacity

      ctx.moveTo(xScale(0), yScale(basePriceNum))

      for (let i = 1; i <= segments; i++) {
        const x = (i / segments) * tokensSoldNum
        const y = basePriceNum + ((finalPriceNum - basePriceNum) * x) / maxTokensNum
        ctx.lineTo(xScale(x), yScale(y))
      }

      ctx.lineTo(xScale(tokensSoldNum), height - padding.bottom)
      ctx.lineTo(xScale(0), height - padding.bottom)
      ctx.closePath()
      ctx.fill()
    }

    // Draw current price point
    if (tokensSoldNum > 0) {
      ctx.beginPath()
      ctx.fillStyle = "#ef4444" // red-500
      ctx.arc(xScale(tokensSoldNum), yScale(currentPriceNum), 5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw X-axis labels
    ctx.fillStyle = "#64748b" // slate-500
    ctx.font = "10px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    // Start
    ctx.fillText("0", padding.left, height - padding.bottom + 5)

    // Middle
    ctx.fillText(formatNumber(maxTokensNum / 2), xScale(maxTokensNum / 2), height - padding.bottom + 5)

    // End
    ctx.fillText(formatNumber(maxTokensNum), xScale(maxTokensNum), height - padding.bottom + 5)

    // Draw Y-axis labels
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"

    // Base price
    ctx.fillText(formatUSD(basePrice).replace("$", ""), padding.left - 5, yScale(basePriceNum))

    // Middle price
    const middlePrice = (basePriceNum + finalPriceNum) / 2
    ctx.fillText(
      formatUSD(ethers.utils.parseEther(middlePrice.toFixed(18))).replace("$", ""),
      padding.left - 5,
      yScale(middlePrice),
    )

    // Final price
    ctx.fillText(formatUSD(finalPrice).replace("$", ""), padding.left - 5, yScale(finalPriceNum))

    // Draw axis titles
    ctx.fillStyle = "#334155" // slate-700
    ctx.font = "12px sans-serif"

    // X-axis title
    ctx.textAlign = "center"
    ctx.textBaseline = "bottom"
    ctx.fillText("Tokens Sold", width / 2, height - 5)

    // Y-axis title
    ctx.save()
    ctx.translate(10, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillText("Price (USD)", 0, 0)
    ctx.restore()
  }, [basePrice, finalPrice, maxTokens, tokensSold, currentPrice])

  return <canvas ref={canvasRef} width={500} height={200} className="w-full h-full" style={{ maxHeight: "200px" }} />
}

// Helper function to format numbers with abbreviations
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  } else {
    return num.toString()
  }
}
