"use client"

import { useState, useEffect } from "react"
import { Web3Provider, useWeb3 } from "@/components/web3-provider"
import { PresaleInfo } from "@/components/presale-info"
import { PresaleForm } from "@/components/presale-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function PresaleContainer() {
  return (
    <Web3Provider>
      <div className="w-full max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-3xl">VLDX Token Presale</CardTitle>
            <CardDescription className="text-center">
              Participate in the Validium-X token presale by contributing WLD or WETH
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PresaleContent />
          </CardContent>
        </Card>
      </div>
    </Web3Provider>
  )
}

function PresaleContent() {
  const { account, chainId, provider, isWorldChain } = useWeb3()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reset error when account or chain changes
    setError(null)
  }, [account, chainId])

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <h3 className="mb-4 text-xl font-semibold">Connect Your Wallet</h3>
        <p className="mb-6 text-center text-muted-foreground">
          Please connect your wallet to participate in the VLDX token presale.
        </p>
      </div>
    )
  }

  if (!isWorldChain) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Wrong Network</AlertTitle>
        <AlertDescription>Please switch to World Chain to participate in the presale.</AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <PresaleInfo setError={setError} />
      <PresaleForm setError={setError} />
    </div>
  )
}
