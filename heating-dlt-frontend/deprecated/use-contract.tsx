"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"
import HeatingDLTAbi from "@/contracts/HeatingDLT.json"
import SmartMeterCollectionAbi from "@/contracts/SmartMeterCollection.json"

// Contract address should be configured based on deployment
// const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3"
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"


export type Tenant = {
  id: number
  address: string
  name: string
}

export type Bill = {
  id: number
  tenantAddress: string
  amount: number
  dueDate: number
  isPaid: boolean
}

export type SmartMeter = {
  id: number
  address: string
  location: string
}

export type EnergyUsage = {
  date: number
  usage: number
}

export function useContract() {
  const [provider, setProvider] = useState<any | null>(null)
  const [signer, setSigner] = useState<any | null>(null)
  const [contract, setContract] = useState<any | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isTenant, setIsTenant] = useState(false)
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const { toast } = useToast()

  // // log state changes
  // useEffect(() => {
  //   console.log("Contract updated:", contract);
  // }, [contract]);

  // useEffect(() => {
  //   console.log("Connection status updated:", isConnected);
  // }, [isConnected]);

  // useEffect(() => {
  //   console.log("Signer updated:", signer);
  // }, [signer]);

  // Initialize provider from window.ethereum if available
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window === "undefined") return

      if (window.ethereum) {
        try {
          let web3Provider

          try {
            web3Provider = new ethers.BrowserProvider(window.ethereum)
          } catch (e) {
            web3Provider = new (ethers as any).providers.Web3Provider(window.ethereum)
          }

          setProvider(web3Provider)

          const accounts =
            (await web3Provider.listAccounts?.()) || (await window.ethereum.request({ method: "eth_accounts" }))
          if (accounts && accounts.length > 0) {
            await handleAccountsChanged(accounts)
          }

          window.ethereum.on("accountsChanged", handleAccountsChanged)
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

  const handleAccountsChanged = async (accounts: string[]) => {
    if (!accounts || accounts.length === 0) {
      console.log("Resetting");
      setAccount(null)
      setSigner(null)
      setContract(null)
      setIsConnected(false)
      setIsAdmin(false)
      setIsTenant(false)
      setTokenBalance(0)
    } else {
      const currentAccount = accounts[0]
      setAccount(currentAccount)

      if (provider) {
        let web3Signer

        try {
          web3Signer = await provider.getSigner()
        } catch (e) {
          web3Signer = provider.getSigner()
        }

        setSigner(web3Signer)

        try {
          const code = await provider.getCode(CONTRACT_ADDRESS)

          if (code === "0x" || code === "") {
            console.warn(`No contract found at address ${CONTRACT_ADDRESS}. Using demo mode.`)
            toast({
              title: "Demo Mode",
              description: "No contract found at the specified address. Using demo mode.",
              variant: "warning",
            })

            // Set up a minimal contract interface for demo mode
            setContract({
              // Admin functions
              isAdmin: async () => true,
              isTenant: async () => true,
              getTenantCount: async () => 3,
              getTenant: async (id: number) => {
                const demoTenants = [
                  { walletAddress: "0x1234567890123456789012345678901234567890", name: "Alice Smith" },
                  { walletAddress: "0x2345678901234567890123456789012345678901", name: "Bob Johnson" },
                  { walletAddress: "0x3456789012345678901234567890123456789012", name: "Carol Williams" },
                ]
                return demoTenants[id % demoTenants.length]
              },
              addTenant: async () => ({ wait: async () => { } }),
              removeTenant: async () => ({ wait: async () => { } }),
              getSmartMeterCount: async () => 2,
              getSmartMeter: async (id: number) => {
                const demoMeters = [
                  { address: "0x4567890123456789012345678901234567890123", location: "Apartment 101" },
                  { address: "0x5678901234567890123456789012345678901234", location: "Apartment 202" },
                ]
                return demoMeters[id % demoMeters.length]
              },
              addSmartMeter: async () => ({ wait: async () => { } }),
              removeSmartMeter: async () => ({ wait: async () => { } }),
              getBillsCount: async () => 4,
              getBill: async (id: number) => {
                const demoBills = [
                  {
                    tenantAddress: "0x1234567890123456789012345678901234567890",
                    amount: 120,
                    dueDate: Date.now() + 86400000,
                    isPaid: false,
                  },
                  {
                    tenantAddress: "0x2345678901234567890123456789012345678901",
                    amount: 85,
                    dueDate: Date.now() + 86400000 * 2,
                    isPaid: false,
                  },
                  {
                    tenantAddress: "0x1234567890123456789012345678901234567890",
                    amount: 95,
                    dueDate: Date.now() - 86400000,
                    isPaid: true,
                  },
                  {
                    tenantAddress: "0x3456789012345678901234567890123456789012",
                    amount: 110,
                    dueDate: Date.now() - 86400000 * 2,
                    isPaid: true,
                  },
                ]
                return demoBills[id % demoBills.length]
              },

              // Tenant functions
              getTokenBalance: async () => 500,
              getEnergyUsageCount: async () => 30,
              getEnergyUsage: async (id: number) => {
                const today = new Date()
                const date = new Date(today)
                date.setDate(today.getDate() - (30 - id))
                return { date: date.getTime() / 1000, usage: Math.floor(Math.random() * 10) + 5 }
              },
              getTenantBillsCount: async () => 6,
              getTenantBill: async (id: number) => {
                const demoBills = [
                  { id: 0, amount: 120, dueDate: Date.now() / 1000 + 86400, isPaid: false },
                  { id: 1, amount: 85, dueDate: Date.now() / 1000 + 86400 * 2, isPaid: false },
                  { id: 2, amount: 95, dueDate: Date.now() / 1000 - 86400, isPaid: true },
                  { id: 3, amount: 110, dueDate: Date.now() / 1000 - 86400 * 2, isPaid: true },
                  { id: 4, amount: 105, dueDate: Date.now() / 1000 - 86400 * 3, isPaid: true },
                  { id: 5, amount: 115, dueDate: Date.now() / 1000 - 86400 * 4, isPaid: true },
                ]
                return demoBills[id % demoBills.length]
              },
              payBill: async () => ({ wait: async () => { } }),
              topUpTokens: async () => ({ wait: async () => { } }),
            })

            // In demo mode, make the connected user tenant
            setIsAdmin(false)
            setIsTenant(true)
            setTokenBalance(500)
            setIsConnected(true)
            return
          }

          // Initialize contract
          const heatingContract = new ethers.Contract(CONTRACT_ADDRESS, SmartMeterCollectionAbi.abi, web3Signer)
          setContract(heatingContract)

          // Check if connected account is admin or tenant
          try {
            const role = await heatingContract.getRole();

            setIsAdmin(role === "admin" ? true : false)
            setIsTenant(role === "tenant" ? true : false)

            // Get token balance if tenant
            if (role === "tenant") {
              const balance = await heatingContract.getTokenBalance()
              setTokenBalance(Number(balance))
            }
          } catch (error) {
            console.error("Error checking user role:", error)
            setIsAdmin(false)
            setIsTenant(false)
          }

          setIsConnected(true)
        } catch (error) {
          console.error("Error initializing contract:", error)
          toast({
            title: "Contract Error",
            description: "Failed to connect to the smart contract. Some features may not work.",
            variant: "destructive",
          })
          setIsConnected(true)
          setIsAdmin(false)
          setIsTenant(false)
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
    setIsAdmin(false)
    setIsTenant(false)
    setTokenBalance(0)

    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  // Admin functions
  const getTenants = useCallback(async (): Promise<Tenant[]> => {
    if (!contract || !isConnected) return []

    try {
      const tenants: Tenant[] = await contract.getTenants();
      return tenants
    }
    catch (error) {
      console.error("Error fetching tenants:", error)
      return []
    }
  }, [contract, isConnected])

  const addTenant = useCallback(
    async (address: string, name: string): Promise<boolean> => {
      if (!contract || !isConnected || !isAdmin) return false

      try {
        const tx = await contract.addTenant(address, name)
        await tx.wait()
        return true
      } catch (error) {
        console.error("Error adding tenant:", error)
        return false
      }
    },
    [contract, isConnected, isAdmin],
  )

  const removeTenant = useCallback(
    async (id: number): Promise<boolean> => {
      if (!contract || !isConnected || !isAdmin) return false

      try {
        const tx = await contract.removeTenant(id)
        await tx.wait()
        return true
      } catch (error) {
        console.error("Error removing tenant:", error)
        return false
      }
    },
    [contract, isConnected, isAdmin],
  )

  const getSmartMeters = useCallback(async (): Promise<SmartMeter[]> => {
    if (!contract || !isConnected) return []

    try {
      const meterCount = await contract.getSmartMeterCount()
      const meters: SmartMeter[] = []

      for (let i = 0; i < meterCount; i++) {
        try {
          const meter = await contract.getSmartMeter(i)
          meters.push({
            id: i,
            address: meter.address,
            location: meter.location,
          })
        } catch (error) {
          console.error(`Error fetching smart meter at index ${i}:`, error)
        }
      }

      return meters
    } catch (error) {
      console.error("Error fetching smart meters:", error)
      return []
    }
  }, [contract, isConnected])

  const addSmartMeter = useCallback(
    async (address: string, location: string): Promise<boolean> => {
      if (!contract || !isConnected || !isAdmin) return false

      try {
        const tx = await contract.addSmartMeter(address, location)
        await tx.wait()
        return true
      } catch (error) {
        console.error("Error adding smart meter:", error)
        return false
      }
    },
    [contract, isConnected, isAdmin],
  )

  const removeSmartMeter = useCallback(
    async (id: number): Promise<boolean> => {
      if (!contract || !isConnected || !isAdmin) return false

      try {
        const tx = await contract.removeSmartMeter(id)
        await tx.wait()
        return true
      } catch (error) {
        console.error("Error removing smart meter:", error)
        return false
      }
    },
    [contract, isConnected, isAdmin],
  )

  const getAllBills = useCallback(async (): Promise<Bill[]> => {
    if (!contract || !isConnected) return []

    try {
      const billsCount = await contract.getBillsCount()
      const bills: Bill[] = []

      for (let i = 0; i < billsCount; i++) {
        try {
          const bill = await contract.getBill(i)
          bills.push({
            id: i,
            tenantAddress: bill.tenantAddress,
            amount: Number(bill.amount),
            dueDate: Number(bill.dueDate),
            isPaid: bill.isPaid,
          })
        } catch (error) {
          console.error(`Error fetching bill at index ${i}:`, error)
        }
      }

      return bills
    } catch (error) {
      console.error("Error fetching bills:", error)
      return []
    }
  }, [contract, isConnected])

  // Tenant functions
  const getEnergyUsage = useCallback(async (): Promise<EnergyUsage[]> => {
    if (!contract || !isConnected || !isTenant) return []

    try {
      const usageCount = await contract.getEnergyUsageCount(account)
      const usage: EnergyUsage[] = []

      for (let i = 0; i < usageCount; i++) {
        try {
          const data = await contract.getEnergyUsage(account, i)
          usage.push({
            date: Number(data.date),
            usage: Number(data.usage),
          })
        } catch (error) {
          console.error(`Error fetching energy usage at index ${i}:`, error)
        }
      }

      return usage
    } catch (error) {
      console.error("Error fetching energy usage:", error)
      return []
    }
  }, [contract, isConnected, isTenant, account])

  const getTenantBills = useCallback(async (): Promise<Bill[]> => {
    if (!contract || !isConnected || !isTenant) return []

    try {
      const billsCount = await contract.getTenantBillsCount(account)
      const bills: Bill[] = []

      for (let i = 0; i < billsCount; i++) {
        try {
          const bill = await contract.getTenantBill(account, i)
          bills.push({
            id: Number(bill.id),
            tenantAddress: account || "",
            amount: Number(bill.amount),
            dueDate: Number(bill.dueDate),
            isPaid: bill.isPaid,
          })
        } catch (error) {
          console.error(`Error fetching tenant bill at index ${i}:`, error)
        }
      }

      return bills
    } catch (error) {
      console.error("Error fetching tenant bills:", error)
      return []
    }
  }, [contract, isConnected, isTenant, account])

  const payBill = useCallback(
    async (billId: number): Promise<boolean> => {
      if (!contract || !isConnected || !isTenant) return false

      try {
        const tx = await contract.payBill(billId)
        await tx.wait()

        // Update token balance after payment
        if (isTenant && account) {
          const balance = await contract.getTokenBalance(account)
          setTokenBalance(Number(balance))
        }

        return true
      } catch (error) {
        console.error("Error paying bill:", error)
        return false
      }
    },
    [contract, isConnected, isTenant, account],
  )

  const topUpTokens = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!contract || !isConnected || !isTenant) return false

      try {
        const tx = await contract.topUpTokens(amount, { value: ethers.parseEther((amount * 0.01).toString()) })
        await tx.wait()

        // Update token balance after top-up
        if (isTenant && account) {
          const balance = await contract.getTokenBalance(account)
          setTokenBalance(Number(balance))
        }

        return true
      } catch (error) {
        console.error("Error topping up tokens:", error)
        return false
      }
    },
    [contract, isConnected, isTenant, account],
  )

  return {
    account,
    isConnected,
    isAdmin,
    isTenant,
    tokenBalance,
    connectWallet,
    disconnectWallet,
    // Admin functions
    getTenants,
    addTenant,
    removeTenant,
    getSmartMeters,
    addSmartMeter,
    removeSmartMeter,
    getAllBills,
    // Tenant functions
    getEnergyUsage,
    getTenantBills,
    payBill,
    topUpTokens,
  }
}
