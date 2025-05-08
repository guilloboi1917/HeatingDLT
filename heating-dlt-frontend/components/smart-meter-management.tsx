"use client"

import { useState, useEffect } from "react"
import { useContractStore } from "@/store/useContractStore"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, PlusCircle, PowerOff, Power } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SmartMeter } from "@/types/types"

export default function SmartMeterManagement() {
  const { getSmartMeters, registerSmartMeter, getSmartMeterInfo } = useContractStore()
  const { toast } = useToast()
  const [meters, setMeters] = useState<SmartMeter[]>([])
  const [newMeterAddress, setNewMeterAddress] = useState("")
  const [newSmartMeterId, setNewSmartMeterId] = useState("")
  const [newOwnerName, setNewOwnerName] = useState("")
  const [newSmartMeterName, setNewSmartMeterName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchSmartMeters()
  }, [])

  const fetchSmartMeters = async () => {
    try {
      setIsLoading(true)
      const fetchedMeters = await getSmartMeters()
      setMeters(fetchedMeters)
    } catch (error) {
      console.error("Error fetching smart meters:", error)
      toast({
        title: "Error fetching smart meters",
        description: "Could not retrieve smart meter information from the blockchain",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSmartMeter = async () => {
    if (!newMeterAddress || !newSmartMeterId) return

    try {
      setIsSubmitting(true)

      // Validate Ethereum address
      if (!newMeterAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error("Invalid Ethereum address")
      }

      const success = await registerSmartMeter(newSmartMeterName, newOwnerName, newMeterAddress, newSmartMeterId)
      console.log("success: ", success)

      if (success) {
        setNewMeterAddress("")
        setNewSmartMeterId("")
        setNewOwnerName("")
        setNewSmartMeterName("")
        setDialogOpen(false)

        console.log("Closing Dialog")

        toast({
          title: "Smart meter added",
          description: `Smart meter for ${newSmartMeterId} has been added`,
        })

        // Refresh the meters list
        await fetchSmartMeters()
      } else {
        toast({
          title: "Error adding smart meter",
          description: "Failed to add the smart meter to the blockchain",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding smart meter:", error)
      toast({
        title: "Error adding smart meter",
        description: "Failed to add the smart meter to the blockchain",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveSmartMeter = async (id: number, location: string) => {
    return false;
    try {
      setIsLoading(true)

      const success = await removeSmartMeter(id)

      if (success) {
        toast({
          title: "Smart meter removed",
          description: `Smart meter for ${location} has been removed`,
        })

        // Refresh the meters list
        await fetchSmartMeters()
      } else {
        toast({
          title: "Error removing smart meter",
          description: "Failed to remove the smart meter from the blockchain",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error removing smart meter:", error)
      toast({
        title: "Error removing smart meter",
        description: "Failed to remove the smart meter from the blockchain",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Smart Meter Management</CardTitle>
            <CardDescription>Manage smart meters connected to the heating system</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Smart Meter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Smart Meter</DialogTitle>
                <DialogDescription>Add a new smart meter to the heating system</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="smartMeterName">Device Name</Label>
                  <Input
                    id="smartMeterName"
                    placeholder="e.g. Apartment 101"
                    value={newSmartMeterName}
                    onChange={(e) => setNewSmartMeterName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    placeholder="e.g. Property Management Inc."
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meterAddress">Device Address</Label>
                  <Input
                    id="meterAddress"
                    placeholder="0x..."
                    value={newMeterAddress}
                    onChange={(e) => setNewMeterAddress(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="smartMeterId">SmartMeter Id (unique)</Label>
                  <Input
                    id="smartMeterId"
                    placeholder="e.g. SM-1001"
                    value={newSmartMeterId}
                    onChange={(e) => setNewSmartMeterId(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddSmartMeter} disabled={isSubmitting || !newMeterAddress || !newSmartMeterId}>
                  {isSubmitting ? "Adding..." : "Add Smart Meter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : meters.length === 0 ? (
            <div className="text-center py-4 text-slate-500">No smart meters found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Id</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meters.map((meter, index) => (
                  <TableRow key={index}>
                    <TableCell>{meter.name}</TableCell>
                    <TableCell>{meter.ownerName}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {meter.smartMeterAddress.substring(0, 6)}...{meter.smartMeterAddress.substring(meter.smartMeterAddress.length - 4)}
                    </TableCell>
                    <TableCell>{meter.smartMeterId}</TableCell>
                    <TableCell>{meter.isActive ? <Power className="stroke-green-400  h-4 w-4 "></Power> : <PowerOff className="stroke-red-400 h-4 w-4"></PowerOff>}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSmartMeter(meter.id, meter.location)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
