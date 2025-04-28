"use client"

import { useState, useEffect } from "react"
import { useContractStore } from "@/store/useContractStore"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDate } from "@/lib/utils"

export default function EnergyUsage() {
  // const { getEnergyUsage } = useContractStore()
  const { toast } = useToast()
  const [usageData, setUsageData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchEnergyUsage()
  }, [])

  const fetchEnergyUsage = async () => {
    try {
      setIsLoading(true)
      const data = []//await getEnergyUsage()
      setUsageData(data)
    } catch (error) {
      console.error("Error fetching energy usage:", error)
      toast({
        title: "Error fetching energy usage",
        description: "Could not retrieve energy usage data from the blockchain",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate total usage
  const totalUsage = usageData.reduce((sum, item) => sum + item.usage, 0)

  // Calculate average daily usage
  const averageDailyUsage = usageData.length > 0 ? totalUsage / usageData.length : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Energy Usage</CardTitle>
            <CardDescription>Total heating energy consumed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalUsage.toFixed(2)} kWh</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Daily Usage</CardTitle>
            <CardDescription>Average heating energy consumed per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{averageDailyUsage.toFixed(2)} kWh</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Energy Usage History</CardTitle>
          <CardDescription>Daily heating energy consumption</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : usageData.length === 0 ? (
            <div className="text-center py-4 text-slate-500">No energy usage data found</div>
          ) : (
            <div className="relative h-[300px]">
              {/* Simple bar chart visualization */}
              <div className="absolute inset-0 flex items-end">
                {usageData.map((item, index) => {
                  const height = `${(item.usage / Math.max(...usageData.map((d) => d.usage))) * 100}%`
                  return (
                    <div
                      key={index}
                      className="flex-1 mx-0.5 bg-blue-500 dark:bg-blue-600 rounded-t-sm hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
                      style={{ height }}
                      title={`${formatDate(item.date * 1000)}: ${item.usage} kWh`}
                    />
                  )
                })}
              </div>

              {/* X-axis labels (show every 5th day for clarity) */}
              <div className="absolute bottom-0 left-0 right-0 flex pt-6 border-t border-slate-200 dark:border-slate-700">
                {usageData.map((item, index) => (
                  <div key={index} className="flex-1 text-center">
                    {index % 5 === 0 && (
                      <span className="text-xs text-slate-500 -rotate-45 block origin-top-left">
                        {new Date(item.date * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
