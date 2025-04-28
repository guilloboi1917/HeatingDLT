"use client"

import { useEffect, useState } from "react"
import { useContractStore } from "@/store/useContractStore"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function ContractStatus() {
  const { account, isConnected, isAdmin, isTenant } = useContractStore()
  const [networkName, setNetworkName] = useState<string>("")

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3"

  useEffect(() => {
    if (isConnected) {
      getNetworkInfo()
    }
  }, [isConnected])

  const getNetworkInfo = async () => {
    try {
      // This is a simplified version - in a real app, you'd get this from the provider
      const networkId = window.ethereum?.networkVersion || "unknown"
      const networks: Record<string, string> = {
        "1": "Ethereum Mainnet",
        "5": "Goerli Testnet",
        "11155111": "Sepolia Testnet",
        "31337": "Hardhat Local",
        "1337": "Local Network",
      }
      setNetworkName(networks[networkId] || `Chain ID: ${networkId}`)
    } catch (error) {
      console.error("Error getting network info:", error)
      setNetworkName("Unknown")
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <Alert className={isAdmin || isTenant ? "bg-green-50 dark:bg-green-900/20" : "bg-amber-50 dark:bg-amber-900/20"}>
      {isAdmin || isTenant ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      )}
      <AlertTitle>{isAdmin ? "Admin Access" : isTenant ? "Tenant Access" : "No System Access"}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <div>
          {isAdmin
            ? "You have administrator access to the heating system."
            : isTenant
              ? "You have tenant access to the heating system."
              : "Your wallet is not registered in the system. Please contact the administrator."}
        </div>
        <div>Network: {networkName}</div>
      </AlertDescription>
    </Alert>
  )
}
