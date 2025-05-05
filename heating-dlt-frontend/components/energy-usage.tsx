"use client"

import { useState, useEffect } from "react"
import { useContractStore } from "@/store/useContractStore"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDate } from "@/lib/utils"
import { ChartData, DailyMeasurementData, HourlyData } from "@/types/types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { fetchIPFSData } from "@/lib/ipfs"

export default function EnergyUsage() {
  const { getEnergyUsage, account } = useContractStore()
  const { toast } = useToast()
  const [usageData, setUsageData] = useState<DailyMeasurementData[] | null>(new Array<DailyMeasurementData>())
  const [selectedDate, setSelectedDate] = useState<ChartData | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [isFetchingHourly, setIsFetchingHourly] = useState(false);
  const [isLoading, setIsLoading] = useState(true)
  const [totalUsage, setTotalUsage] = useState<Number>()
  const [averageDailyUsage, setAverageDailyUsage] = useState<Number>()
  const [chartData, setChartData] = useState<any[]>()

  useEffect(() => {
    fetchEnergyUsage()
    console.log(usageData)
  }, [])


  // Handle bar click
  const handleBarClick = async (data: DailyMeasurementData) => {
    setSelectedDate(data);

    console.log(data);
    setIsFetchingHourly(true);

    try {
      // Fetch hourly data from IPFS
      console.log("Fetching IPFS data: ", data.ipfsCID);
      const ipfsData = await fetchIPFSData(data.ipfsCID);
      setHourlyData(ipfsData.measurements.map(m => ({
        ...m,
        hour: new Date(m.timestamp).getHours()
      })));
    } catch (error) {
      console.error("Failed to fetch IPFS data:", error);
    } finally {
      setIsFetchingHourly(false);
    }
  };

  const fetchEnergyUsage = async () => {
    try {
      setIsLoading(true)
      const data = await getEnergyUsage(account)
      setUsageData(data)

      const totalUsageTemp = data.reduce((sum, item) => sum + item.usage, 0)

      // Calculate total usage
      setTotalUsage(totalUsageTemp)

      // Calculate average daily usage
      setAverageDailyUsage(data.length > 0 ? totalUsageTemp / data.length : 0)

      setChartData(data ? data.map((item) => ({
        ipfsCID: item.ipfsCID,
        date: item.timestamp,
        usage: item.usage,
        formattedDate: item.timestamp.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      })) : []);


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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Energy Usage</CardTitle>
            <CardDescription>Total heating energy consumed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalUsage?.toFixed(2)} kWh</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Daily Usage</CardTitle>
            <CardDescription>Average heating energy consumed per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{averageDailyUsage?.toFixed(2)} kWh</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Energy Usage History</CardTitle>
          <CardDescription className="text-sm">
            Daily heating energy consumption (kWh)
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="ml-4 text-sm text-blue-500 hover:underline"
              >
                Back to overview
              </button>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          {selectedDate ? (
            <div className="h-full">
              <h3 className="text-lg font-medium mb-4">
                Hourly Usage for {selectedDate.formattedDate}
              </h3>
              {isFetchingHourly ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingSpinner className="h-8 w-8" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="hour"
                      label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      label={{
                        value: 'kWh',
                        angle: -90,
                        position: 'insideLeft'
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value} kWh`, 'Usage']}
                      labelFormatter={(hour) => `Hour: ${hour}:00`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="formattedDate"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                  interval={Math.ceil(usageData.length / 10)}
                />
                <YAxis
                  label={{
                    value: "kWh",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 12,
                  }}
                  width={60}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-white p-4 shadow-lg dark:bg-gray-900">
                          <p className="font-medium">
                            {data.date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-blue-500">
                            {data.usage.toFixed(2)} kWh
                          </p>
                          <p className="text-xs mt-1 text-gray-500">
                            Click for hourly details
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="usage"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  onClick={(data) => handleBarClick(data.payload)}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* IPFS CID Display */}
      {selectedDate && (
        <Card className="p-4">
          <div className="text-sm">
            <span className="font-medium">IPFS CID:</span> {selectedDate.ipfsCID}
          </div>
        </Card>
      )}
    </div>
  )
}
