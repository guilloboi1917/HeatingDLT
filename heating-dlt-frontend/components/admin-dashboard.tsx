"use client"

import { useState } from "react"
import { useContractStore } from "@/store/useContractStore"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import TenantManagement from "@/components/tenant-management"
import SmartMeterManagement from "@/components/smart-meter-management"
import BillsOverview from "@/components/bills-overview"

export default function AdminDashboard() {
  const { account } = useContractStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("tenants")

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Admin Dashboard</AlertTitle>
        <AlertDescription>Connected as {account}</AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="meters">Smart Meters</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="mt-4">
          <TenantManagement />
        </TabsContent>

        <TabsContent value="meters" className="mt-4">
          <SmartMeterManagement />
        </TabsContent>

        <TabsContent value="bills" className="mt-4">
          <BillsOverview />
        </TabsContent>
      </Tabs>
    </div>
  )
}
