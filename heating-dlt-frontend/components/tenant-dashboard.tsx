"use client"

import { useState } from "react"
import { useContractStore } from "@/store/useContractStore"
import {toast} from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Flame, House } from "lucide-react"
import EnergyUsage from "@/components/energy-usage"
import TenantUtilityExpenses from "@/components/tenant-utility-expenses"
import TokenBalance from "@/components/token-balance"
import { formatUnits } from "ethers";
import { ethers } from "ethers";
import { formatPhoneNumber } from "@/lib/utils"

export default function TenantDashboard() {
  const { account, tokenBalance, fullName, ownerContactInfo } = useContractStore()
  const [activeTab, setActiveTab] = useState("usage")

  const formattedTokenBalance = Number(
    formatUnits(
      BigInt(tokenBalance), // Directly use BigInt constructor
      "ether"
    )
  ).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tenant Dashboard</AlertTitle>
          <AlertDescription>Connected as {fullName}</AlertDescription>
          <AlertDescription>With account {account}</AlertDescription>
        </Alert>

        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <Flame className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>TNCY Token Balance</AlertTitle>
          <AlertDescription className="text-4xl font-bold">{formattedTokenBalance} TNCY</AlertDescription>
        </Alert>

        {ownerContactInfo && (
          <Alert>
            <House className="h-4 w-4" />
            <AlertTitle>Provided by {ownerContactInfo.ownerName}</AlertTitle>
            {ownerContactInfo.streetName && (
              <AlertDescription>{ownerContactInfo.streetName}</AlertDescription>
            )}
            {(ownerContactInfo.cityCode || ownerContactInfo.cityName) && (
              <AlertDescription>{ownerContactInfo.cityCode} {ownerContactInfo.cityName}</AlertDescription>
            )}
            {ownerContactInfo.country && (
              <AlertDescription>{ownerContactInfo.country}</AlertDescription>
            )}
            {ownerContactInfo.email && (
              <AlertDescription>
                <a href={`mailto:${ownerContactInfo.email}`}>{ownerContactInfo.email}</a>
              </AlertDescription>
            )}
            {ownerContactInfo.phone && (
              <AlertDescription>{formatPhoneNumber(ownerContactInfo.phone)}</AlertDescription>
            )}
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="usage">Energy Usage</TabsTrigger>
          <TabsTrigger value="bills">Utility Expenses</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="mt-4">
          <EnergyUsage />
        </TabsContent>

        <TabsContent value="bills" className="mt-4">
          <TenantUtilityExpenses />
        </TabsContent>

        <TabsContent value="tokens" className="mt-4">
          <TokenBalance />
        </TabsContent>
      </Tabs>
    </div>
  )
}
