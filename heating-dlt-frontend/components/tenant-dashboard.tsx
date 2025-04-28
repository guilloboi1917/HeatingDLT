"use client"

import { useState } from "react"
import { useContractStore } from "@/store/useContractStore"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Flame } from "lucide-react"
import EnergyUsage from "@/components/energy-usage"
import TenantBills from "@/components/tenant-bills"
import TokenBalance from "@/components/token-balance"

export default function TenantDashboard() {
  const { account, tokenBalance } = useContractStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("usage")

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tenant Dashboard</AlertTitle>
          <AlertDescription>Connected as {account}</AlertDescription>
        </Alert>

        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <Flame className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>HEAT Token Balance</AlertTitle>
          <AlertDescription>{tokenBalance} HEAT</AlertDescription>
        </Alert>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="usage">Energy Usage</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="mt-4">
          <EnergyUsage />
        </TabsContent>

        <TabsContent value="bills" className="mt-4">
          <TenantBills />
        </TabsContent>

        <TabsContent value="tokens" className="mt-4">
          <TokenBalance />
        </TabsContent>
      </Tabs>
    </div>
  )
}
