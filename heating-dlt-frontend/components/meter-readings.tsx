"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { useWeb3 } from "@/hooks/use-web3"
import { useContractStore } from "@/store/useContractStore"
import { formatDate } from "@/lib/utils"

export default function MeterReadings() {
  const { toast } = useToast()
  const { contract, isConnected } = useContractStore()
  const [readings, setReadings] = useState<any[]>([])
  const [newReading, setNewReading] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (contract && isConnected) {
      fetchMeterReadings()
    } else {
      setIsLoading(false)
    }
  }, [contract, isConnected])

  // Update the fetchMeterReadings function to handle contract errors better
  const fetchMeterReadings = async () => {
    try {
      setIsLoading(true)

      // Check if contract is available
      if (!contract) {
        console.error("Contract not available")
        setReadings([])
        return
      }

      try {
        // Fetch meter readings from the contract
        const readingsCount = await contract.getMeterReadingsCount()
        const fetchedReadings = []

        for (let i = 0; i < readingsCount; i++) {
          try {
            const reading = await contract.getMeterReading(i)
            fetchedReadings.push({
              id: i,
              value: Number(reading.value),
              timestamp: Number(reading.timestamp) * 1000, // Convert to milliseconds
            })
          } catch (error) {
            console.error(`Error fetching reading at index ${i}:`, error)
          }
        }

        setReadings(fetchedReadings.reverse()) // Show newest first
      } catch (error) {
        console.error("Error fetching meter readings count:", error)
        setReadings([])
      }
    } catch (error) {
      console.error("Error in fetchMeterReadings:", error)
      toast({
        title: "Error fetching readings",
        description: "Could not retrieve meter readings from the blockchain",
        variant: "destructive",
      })
      setReadings([])
    } finally {
      setIsLoading(false)
    }
  }

  const submitMeterReading = async () => {
    if (!contract || !isConnected || !newReading) return

    try {
      setIsSubmitting(true)
      const readingValue = Number.parseFloat(newReading)

      if (isNaN(readingValue)) {
        throw new Error("Invalid reading value")
      }

      const tx = await contract.addMeterReading(readingValue)
      await tx.wait()

      setNewReading("")
      toast({
        title: "Reading submitted",
        description: `Your meter reading of ${readingValue} has been recorded`,
      })

      // Refresh the readings
      await fetchMeterReadings()
    } catch (error) {
      console.error("Error submitting meter reading:", error)
      toast({
        title: "Error submitting reading",
        description: "Failed to submit the meter reading to the blockchain",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Meter Reading</CardTitle>
          <CardDescription>Enter your current meter reading to record it on the blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="meterReading">Meter Reading</Label>
              <Input
                id="meterReading"
                type="number"
                step="0.01"
                placeholder="Enter current reading"
                value={newReading}
                onChange={(e) => setNewReading(e.target.value)}
              />
            </div>
            <Button onClick={submitMeterReading} disabled={isSubmitting || !newReading}>
              {isSubmitting ? "Submitting..." : "Submit Reading"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reading History</CardTitle>
          <CardDescription>View your past meter readings recorded on the blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading readings...</div>
          ) : readings.length === 0 ? (
            <div className="text-center py-4 text-slate-500">No readings found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Reading</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.map((reading) => (
                  <TableRow key={reading.id}>
                    <TableCell>{formatDate(reading.timestamp)}</TableCell>
                    <TableCell className="text-right">{reading.value.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
