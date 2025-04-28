"use client"

import { useState, useEffect } from "react"
import { useContractStore } from "@/store/useContractStore"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, UserPlus } from "lucide-react"
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
import { Tenant } from "@/types/types"


export default function TenantManagement() {
  const { getTenants, addTenant, removeTenant } = useContractStore()
  const { toast } = useToast()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [newTenantAddress, setNewTenantAddress] = useState("")
  const [newTenantName, setNewTenantName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      setIsLoading(true)
      const fetchedTenants = await getTenants()

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
      setIsLoading(true)

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
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error removing tenant:", error)
      toast({
        title: "Error removing tenant",
        description: "Failed to remove the tenant from the blockchain",
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
    </div>
  )
}
