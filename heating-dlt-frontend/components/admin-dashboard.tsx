"use client"

import { useState } from "react"
import { useContractStore } from "@/store/useContractStore"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, House } from "lucide-react"
import TenantManagement from "@/components/tenant-management"
import SmartMeterManagement from "@/components/smart-meter-management"
import AdminUtilityExpenses from "@/components/admin-utility-expenses-overview"
import { formatPhoneNumber } from "@/lib/utils"

export default function AdminDashboard() {
  const { account, ownerName, ownerContactInfo } = useContractStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("tenants")

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Alert>
          <AlertCircle className="h-4 w-4 " />
          <AlertTitle>Admin Dashboard</AlertTitle>
          <AlertDescription>Connected as {ownerName}</AlertDescription>
          <AlertDescription>With account {account}</AlertDescription>
        </Alert>

        {ownerContactInfo && (
          <Alert>
            <House className="h-4 w-4" />
            <AlertTitle>My Contact Details</AlertTitle>
            {ownerContactInfo.ownerName &&
              <AlertDescription>{ownerContactInfo.ownerName}</AlertDescription>}
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
          </Alert>)
        }
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="meters">Smart Meters</TabsTrigger>
          <TabsTrigger value="utilityExpenses">Utility Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="mt-4">
          <TenantManagement />
        </TabsContent>

        <TabsContent value="meters" className="mt-4">
          <SmartMeterManagement />
        </TabsContent>

        <TabsContent value="utilityExpenses" className="mt-4">
          <AdminUtilityExpenses />
        </TabsContent>
      </Tabs>
    </div>
  )
}
