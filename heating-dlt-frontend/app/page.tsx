"use client"

import { useEffect, useState } from "react"
import { useContractStore } from "@/store/useContractStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import AdminDashboard from "@/components/admin-dashboard"
import TenantDashboard from "@/components/tenant-dashboard"
import ContractStatus from "@/components/contract-status"

export default function Home() {
  const { isConnected, isAdmin, isTenant, connectWallet } = useContractStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Short delay to prevent flash of loading state
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isConnected) {
    return <ConnectWalletScreen connectWallet={connectWallet} />
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center space-x-4">
            <img
              src="/Tency Logo.png"
              alt="Tency Logo"
              className="h-20 w-20 object-contain rounded-lg"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">Heating DLT Dashboard</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Manage your heating system with blockchain technology by Tency.
          </p>
        </header>

        <div className="mb-6">
          <ContractStatus />
        </div>

        {isAdmin && <AdminDashboard />}
        {isTenant && !isAdmin && <TenantDashboard />}
        {!isAdmin && !isTenant && <NoAccessScreen />}
      </div>
    </main>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-slate-600 dark:text-slate-300">Loading dashboard...</p>
    </div>
  )
}

function ConnectWalletScreen({ connectWallet }: { connectWallet: () => Promise<void> }) {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md mx-auto pt-20">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Connect your wallet to access the heating management system</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Button onClick={connectWallet} size="lg">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function NoAccessScreen() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No Access</CardTitle>
        <CardDescription>Your wallet address is not registered as an admin or tenant in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 dark:text-slate-300">
          Please contact the system administrator to get access to the heating management system.
        </p>
      </CardContent>
    </Card>
  )
}
