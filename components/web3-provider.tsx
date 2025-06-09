"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface Web3ContextType {
  account: string | null
  chainId: number | null
  provider: ethers.providers.Web3Provider | null
  signer: ethers.Signer | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  isConnecting: boolean
  isWorldChain: boolean
  switchToWorldChain: () => Promise<void>
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  chainId: null,
  provider: null,
  signer: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isConnecting: false,
  isWorldChain: false,
  switchToWorldChain: async () => {},
})

export const useWeb3 = () => useContext(Web3Context)

// World Chain network parameters
const WORLD_CHAIN_MAINNET_ID = 480
const WORLD_CHAIN_TESTNET_ID = 4801

// Use testnet for development, change to mainnet for production
const WORLD_CHAIN_ID = WORLD_CHAIN_TESTNET_ID

const WORLD_CHAIN_PARAMS = {
  [WORLD_CHAIN_MAINNET_ID]: {
    chainId: `0x${WORLD_CHAIN_MAINNET_ID.toString(16)}`,
    chainName: "World Chain",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://worldchain-mainnet.g.alchemy.com/public"],
    blockExplorerUrls: ["https://worldscan.org"],
  },
  [WORLD_CHAIN_TESTNET_ID]: {
    chainId: `0x${WORLD_CHAIN_TESTNET_ID.toString(16)}`,
    chainName: "World Chain Sepolia",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://worldchain-sepolia.g.alchemy.com/public"],
    blockExplorerUrls: ["https://worldchain-sepolia.explorer.alchemy.com"],
  },
}

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  const isWorldChain = chainId === WORLD_CHAIN_ID

  // Initialize provider from window.ethereum
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum, "any")
      setProvider(ethersProvider)

      // Check if already connected
      ethersProvider.listAccounts().then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setSigner(ethersProvider.getSigner())
          ethersProvider.getNetwork().then((network) => {
            setChainId(network.chainId)
          })
        }
      })

      // Setup event listeners
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setAccount(null)
          setSigner(null)
        } else {
          setAccount(accounts[0])
          setSigner(ethersProvider.getSigner())
        }
      })

      window.ethereum.on("chainChanged", (chainIdHex: string) => {
        const newChainId = Number.parseInt(chainIdHex, 16)
        setChainId(newChainId)
        // Update provider and signer on chain change
        const updatedProvider = new ethers.providers.Web3Provider(window.ethereum, "any")
        setProvider(updatedProvider)
        if (account) {
          setSigner(updatedProvider.getSigner())
        }
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
        window.ethereum.removeAllListeners("chainChanged")
      }
    }
  }, [account])

  const connectWallet = async () => {
    if (!provider) {
      toast({
        title: "No Web3 Provider Found",
        description: "Please install MetaMask or another Web3 wallet to continue.",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)
    try {
      const accounts = await provider.send("eth_requestAccounts", [])
      setAccount(accounts[0])
      setSigner(provider.getSigner())

      const network = await provider.getNetwork()
      setChainId(network.chainId)

      if (network.chainId !== WORLD_CHAIN_ID) {
        toast({
          title: "Wrong Network",
          description: "Please switch to World Chain to participate in the presale.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setSigner(null)
  }

  const switchToWorldChain = async () => {
    if (!provider) return

    try {
      // Try to switch to World Chain
      await provider.send("wallet_switchEthereumChain", [{ chainId: `0x${WORLD_CHAIN_ID.toString(16)}` }])
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await provider.send("wallet_addEthereumChain", [WORLD_CHAIN_PARAMS[WORLD_CHAIN_ID]])
        } catch (addError) {
          console.error("Error adding World Chain to wallet:", addError)
          toast({
            title: "Network Error",
            description: "Failed to add World Chain to your wallet.",
            variant: "destructive",
          })
        }
      } else {
        console.error("Error switching to World Chain:", switchError)
        toast({
          title: "Network Error",
          description: "Failed to switch to World Chain.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        provider,
        signer,
        connectWallet,
        disconnectWallet,
        isConnecting,
        isWorldChain,
        switchToWorldChain,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export const ConnectWalletButton = () => {
  const { account, connectWallet, disconnectWallet, isConnecting, isWorldChain, switchToWorldChain } = useWeb3()

  if (!account) {
    return (
      <Button onClick={connectWallet} disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  if (!isWorldChain) {
    return (
      <Button onClick={switchToWorldChain} variant="destructive">
        Switch to World Chain
      </Button>
    )
  }

  return (
    <Button onClick={disconnectWallet} variant="outline">
      {account.substring(0, 6)}...{account.substring(account.length - 4)}
    </Button>
  )
}
