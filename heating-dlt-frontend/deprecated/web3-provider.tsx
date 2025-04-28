"use client"

import { createContext, useEffect, useState, type ReactNode } from "react"
import { ethers } from "ethers"
import HeatingDLTAbi from "@/contracts/HeatingDLT.json"
import { useToast } from "@/components/ui/use-toast"

// Update the CONTRACT_ADDRESS to be configurable
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3" // Local hardhat default

interface Web3ContextType {
  provider: any | null
  signer: any | null
  contract: any | null
  account: string | null
  isConnected: boolean
  isOwner: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
}

export const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  contract: null,
  account: null,
  isConnected: false,
  isOwner: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
})

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<any | null>(null)
  const [signer, setSigner] = useState<any | null>(null)
  const [contract, setContract] = useState<any | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const { toast } = useToast()

  // Initialize provider from window.ethereum if available
  useEffect(() => {
    const initProvider = async () => {
      // Check if we're in a browser environment
      if (typeof window === "undefined") return

      // Check if ethereum is available
      if (window.ethereum) {
        try {
          // Create provider - handle both ethers v5 and v6
          let web3Provider

          // Try ethers v6 approach first
          try {
            web3Provider = new ethers.BrowserProvider(window.ethereum)
          } catch (e) {
            // Fall back to ethers v5 approach
            web3Provider = new (ethers as any).providers.Web3Provider(window.ethereum)
          }

          setProvider(web3Provider)

          // Check if already connected
          const accounts =
            (await web3Provider.listAccounts?.()) || (await window.ethereum.request({ method: "eth_accounts" }))
          if (accounts && accounts.length > 0) {
            await handleAccountsChanged(accounts)
          }

          // Listen for account changes
          window.ethereum.on("accountsChanged", handleAccountsChanged)

          // Listen for chain changes
          window.ethereum.on("chainChanged", () => {
            window.location.reload()
          })

          return () => {
            if (window.ethereum) {
              window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
            }
          }
        } catch (error) {
          console.error("Error initializing Web3:", error)
        }
      } else {
        console.log("Please install MetaMask or another Web3 provider")
      }
    }

    initProvider()
  }, [])

  // Replace the handleAccountsChanged function with this improved version
  const handleAccountsChanged = async (accounts: string[]) => {
    if (!accounts || accounts.length === 0) {
      // User disconnected their wallet
      setAccount(null)
      setSigner(null)
      setContract(null)
      setIsConnected(false)
      setIsOwner(false)
    } else {
      const currentAccount = accounts[0]
      setAccount(currentAccount)

      if (provider) {
        let web3Signer

        // Try ethers v6 approach first
        try {
          web3Signer = await provider.getSigner()
        } catch (e) {
          // Fall back to ethers v5 approach
          web3Signer = provider.getSigner()
        }

        setSigner(web3Signer)

        try {
          // First check if the contract exists at the address
          const code = await provider.getCode(CONTRACT_ADDRESS)

          // If there's no code at the address, the contract is not deployed
          if (code === "0x" || code === "") {
            console.warn(`No contract found at address ${CONTRACT_ADDRESS}. Using demo mode.`)
            toast({
              title: "Demo Mode",
              description: "No contract found at the specified address. Using demo mode.",
              variant: "warning",
            })

            // Set up a minimal contract interface for demo mode
            setContract({
              getCurrentTemperature: async () => 21,
              getTargetTemperature: async () => 22,
              setTargetTemperature: async () => ({ wait: async () => {} }),
              getMeterReadingsCount: async () => 0,
              getMeterReading: async () => ({ value: 0, timestamp: Math.floor(Date.now() / 1000) }),
              addMeterReading: async () => ({ wait: async () => {} }),
              getTenantCount: async () => 0,
              getTenant: async () => ({ walletAddress: "", name: "" }),
              addTenant: async () => ({ wait: async () => {} }),
              removeTenant: async () => ({ wait: async () => {} }),
            })

            // In demo mode, make the connected user the owner
            setIsOwner(true)
            setIsConnected(true)
            return
          }

          // Initialize contract
          const heatingContract = new ethers.Contract(CONTRACT_ADDRESS, HeatingDLTAbi.abi, web3Signer)
          setContract(heatingContract)

          // Check if connected account is the owner
          try {
            const ownerAddress = await heatingContract.owner()
            setIsOwner(ownerAddress.toLowerCase() === currentAccount.toLowerCase())
          } catch (error) {
            console.error("Error checking owner:", error)
            console.log("Continuing without owner check. Some features may be limited.")
            // If we can't check owner, assume the user is not the owner
            setIsOwner(false)
          }

          setIsConnected(true)
        } catch (error) {
          console.error("Error initializing contract:", error)
          toast({
            title: "Contract Error",
            description: "Failed to connect to the smart contract. Some features may not work.",
            variant: "destructive",
          })
          // Set connected but without contract functionality
          setIsConnected(true)
          setIsOwner(false)
        }
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast({
        title: "Web3 provider not available",
        description: "Please install MetaMask or another Web3 provider",
        variant: "destructive",
      })
      return
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      await handleAccountsChanged(accounts)

      toast({
        title: "Wallet connected",
        description: "Your wallet has been connected successfully",
      })

    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast({
        title: "Connection failed",
        description: "Failed to connect your wallet",
        variant: "destructive",
      })
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setSigner(null)
    setContract(null)
    setIsConnected(false)
    setIsOwner(false)

    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        contract,
        account,
        isConnected,
        isOwner,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}
