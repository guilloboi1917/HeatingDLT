"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Thermometer, BarChart3, Settings, AlertCircle } from "lucide-react"
import MeterReadings from "@/components/meter-readings"
import TenantManagement from "@/components/tenant-management"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useContractStore } from "@/store/useContractStore"

export default function HeatingDashboard() {
  const { toast } = useToast()
  const { account, contract, isConnected, connectWallet, isAdmin } = useContractStore()
  const [currentTemperature, setCurrentTemperature] = useState<number | null>(null)
  const [targetTemperature, setTargetTemperature] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (contract && isConnected) {
      fetchHeatingData()
    } else {
      setIsLoading(false)
    }
  }, [contract, isConnected])

  // Update the fetchHeatingData function to handle contract errors better
  const fetchHeatingData = async () => {
    try {
      setIsLoading(true)

      // Check if contract is available
      if (!contract) {
        console.error("Contract not available")
        toast({
          title: "Contract not available",
          description: "Could not connect to the blockchain contract",
          variant: "destructive",
        })
        setCurrentTemperature(21) // Default value
        setTargetTemperature(22) // Default value
        return
      }

      try {
        // Fetch current temperature from the contract
        const currentTemp = await contract.getCurrentTemperature()
        setCurrentTemperature(Number(currentTemp))
      } catch (error) {
        console.error("Error fetching current temperature:", error)
        setCurrentTemperature(21) // Default value
      }

      try {
        // Fetch target temperature from the contract
        const targetTemp = await contract.getTargetTemperature()
        setTargetTemperature(Number(targetTemp))
      } catch (error) {
        console.error("Error fetching target temperature:", error)
        setTargetTemperature(22) // Default value
      }
    } catch (error) {
      console.error("Error in fetchHeatingData:", error)
      toast({
        title: "Error fetching data",
        description: "Could not retrieve heating information from the blockchain",
        variant: "destructive",
      })
      // Set default values
      setCurrentTemperature(21)
      setTargetTemperature(22)
    } finally {
      setIsLoading(false)
    }
  }

  const updateTargetTemperature = async (newTemp: number) => {
    if (!contract || !isConnected) return

    try {
      setIsLoading(true)
      const tx = await contract.setTargetTemperature(newTemp)
      await tx.wait()

      setTargetTemperature(newTemp)
      toast({
        title: "Temperature updated",
        description: `Target temperature set to ${newTemp}°C`,
      })
    } catch (error) {
      console.error("Error updating temperature:", error)
      toast({
        title: "Error updating temperature",
        description: "Failed to update the target temperature",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <Card className="w-full">
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
    )
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Connected Account</AlertTitle>
        <AlertDescription>{account}</AlertDescription>
      </Alert>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="readings">Meter Readings</TabsTrigger>
          {isAdmin && <TabsTrigger value="management">Management</TabsTrigger>}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Thermometer className="mr-2 h-5 w-5" />
                  Current Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{isLoading ? "Loading..." : `${currentTemperature}°C`}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Target Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-4">{isLoading ? "Loading..." : `${targetTemperature}°C`}</div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => targetTemperature !== null && updateTargetTemperature(targetTemperature - 1)}
                    disabled={isLoading || targetTemperature === null || targetTemperature <= 16}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={targetTemperature ?? ""}
                    onChange={(e) => setTargetTemperature(Number(e.target.value))}
                    min={16}
                    max={30}
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => targetTemperature !== null && updateTargetTemperature(targetTemperature + 1)}
                    disabled={isLoading || targetTemperature === null || targetTemperature >= 30}
                  >
                    +
                  </Button>
                  <Button
                    onClick={() => targetTemperature !== null && updateTargetTemperature(targetTemperature)}
                    disabled={isLoading}
                  >
                    Set
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Energy Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-slate-500">
                Energy usage chart will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readings" className="mt-4">
          <MeterReadings />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="management" className="mt-4">
            <TenantManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
