"use client"

import { useState, useEffect } from "react"
import { useContractStore } from "@/store/useContractStore"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, UserPlus, Unplug, Contact, HousePlug } from "lucide-react"
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
import { SmartMeter, Tenant } from "@/types/types"
import { isZeroAddress } from "@/lib/utils"
import { ethers } from "ethers"


export default function TenantManagement() {
  const { getTenants, addTenant, removeTenant, assignSmartMeter, getSmartMeters } = useContractStore()
  const { toast } = useToast()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [newTenantAddress, setNewTenantAddress] = useState("")
  const [newTenantName, setNewTenantName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAssigment, setIsLoadingAssigment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [selectedSmartMeter, setSelectedSmartMeter] = useState<string>("");
  const [availableSmartMeters, setAvailableSmartMeters] = useState<SmartMeter[]>([]);


  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      setIsLoading(true)
      const fetchedTenants = await getTenants()


      const fetchedSmartMeters = await getSmartMeters();

      const filteredSmartMeters: SmartMeter[] = fetchedSmartMeters.filter(sm => isZeroAddress(sm.assignedTenantAddress))

      // Filter smart meters that are unassigned (assignedTenant is zero address)
      setAvailableSmartMeters(filteredSmartMeters);

      setTenants(fetchedTenants)
    } catch (error) {
      console.error("Error fetching tenants:", error)
      toast({
        title: "Error fetching tenants",
        description: "Could not retrieve tenant information from the blockchain",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTenant = async () => {
    if (!newTenantAddress || !newTenantName) return

    try {
      setIsSubmitting(true)

      // Validate Ethereum address
      if (!newTenantAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error("Invalid Ethereum address")
      }

      const success = await addTenant(newTenantAddress, newTenantName)

      if (success) {
        setNewTenantAddress("")
        setNewTenantName("")
        setDialogOpen(false)

        toast({
          title: "Tenant added",
          description: `${newTenantName} has been added as a tenant`,
        })

        // Refresh the tenants list
        await fetchTenants()
      } else {
        toast({
          title: "Error adding tenant",
          description: "Failed to add the tenant to the blockchain",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding tenant:", error)
      toast({
        title: "Error adding tenant",
        description: "Failed to add the tenant to the blockchain",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveTenant = async (address: string) => {
    try {

      const success = await removeTenant(address)

      if (success) {
        toast({
          title: "Tenant removed",
          description: `${address} has been removed as a tenant`,
        })

        // Refresh the tenants list
        await fetchTenants()
      } else {
        toast({
          title: "Error removing tenant",
          description: "Failed to remove the tenant from the blockchain",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing tenant:", error)
      toast({
        title: "Error removing tenant",
        description: "Failed to remove the tenant from the blockchain",
        variant: "destructive",
      })
    }
  }

  const handleSelect = async (tenantAddress: string) => {
    if (!selectedSmartMeter) return;

    handleAssignSmartMeter(tenantAddress, selectedSmartMeter);
  };

  const handleAssignSmartMeter = async (tenantAddress: string, smartMeterAddress: string) => {
    try {
      setIsSubmitting(true);

      const success = await assignSmartMeter(tenantAddress, smartMeterAddress);

      if (success) {
        setSelectedSmartMeter("");
        setAssignmentDialogOpen(false);
        toast({
          title: "SmartMeter Assigned",
          description: `SmartMeter Assignment Successful`,
        })

        // Refresh the tenants list
        await fetchTenants()
      } else {
        toast({
          title: "Error Assigning SmartMeter",
          description: "Failed to assign SmartMeter",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error Assigning SmartMeter:", error)
      toast({
        title: "Error Assigning SmartMeter",
        description: "Failed to assign SmartMeter",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tenant Management</CardTitle>
            <CardDescription>Manage tenants who have access to the heating system</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Tenant</DialogTitle>
                <DialogDescription>Add a new tenant to give them access to the heating system</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tenantName">Tenant Name</Label>
                  <Input
                    id="tenantName"
                    placeholder="Enter tenant name"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenantAddress">Wallet Address</Label>
                  <Input
                    id="tenantAddress"
                    placeholder="0x..."
                    value={newTenantAddress}
                    onChange={(e) => setNewTenantAddress(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTenant} disabled={isSubmitting || !newTenantAddress || !newTenantName}>
                  {isSubmitting ? "Adding..." : "Add Tenant"}
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
          ) : tenants.length === 0 ? (
            <div className="text-center py-4 text-slate-500">No tenants found
              <Button onClick={() => fetchTenants()}> Fetch Tenants </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Assigned SmartMeter</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant, index) => (
                  <TableRow key={index}>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {tenant.address.substring(0, 6)}...{tenant.address.substring(tenant.address.length - 4)}
                    </TableCell>
                    {!isZeroAddress(tenant.assignedSmartMeterAddress) ? <TableCell className="font-mono text-xs">
                      {tenant.assignedSmartMeterAddress.substring(0, 6)}...{tenant.assignedSmartMeterAddress.substring(tenant.assignedSmartMeterAddress.length - 4)}
                    </TableCell> :
                      <TableCell>
                        <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <HousePlug className="h-4 w-4"></HousePlug>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Smart Meter</DialogTitle>
                              <DialogDescription>
                                Assign an available smart meter to this tenant
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="smartMeter">Available Smart Meters</Label>
                                <Select
                                  value={selectedSmartMeter}
                                  onValueChange={setSelectedSmartMeter}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a smart meter" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableSmartMeters.length > 0 ? (
                                      availableSmartMeters.map((sm) => (
                                        <SelectItem key={sm.smartMeterAddress} value={sm.smartMeterAddress}>
                                          {sm.smartMeterAddress} (ID: {sm.smartMeterId})
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <div className="py-2 text-center text-sm text-muted-foreground px-2">
                                        No available smart meters
                                      </div>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => handleSelect(tenant.address)}
                                disabled={isSubmitting || !selectedSmartMeter || availableSmartMeters.length === 0}
                              >
                                {isSubmitting ? "Assigning..." : "Assign"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    }

                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveTenant(tenant.address)}>
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
    </div >
  )
}
