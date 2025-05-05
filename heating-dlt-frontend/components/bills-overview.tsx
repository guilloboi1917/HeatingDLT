"use client"

import { useState, useEffect } from "react"
import { useContractStore } from "@/store/useContractStore"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDate } from "@/lib/utils"
import { Tenant, Bill } from "@/types/types"
import { formatUnits, ethers } from "ethers";

// Lots to do here, date formatting etc etc.

export default function BillsOverview() {
  const { getBills, getTenants } = useContractStore()
  const { toast } = useToast()
  const [bills, setBills] = useState<Bill[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch tenants to map addresses to names
      const fetchedTenants = await getTenants()
      setTenants(fetchedTenants)

      console.log(fetchedTenants)

      // Fetch all bills for a tenant
      const fetchedBills = await getBills(fetchedTenants[0].address)
      setBills(fetchedBills)
    } catch (error) {
      console.error("Error fetching bills data:", error)
      toast({
        title: "Error fetching bills",
        description: "Could not retrieve bill information from the blockchain",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get tenant name from address
  const getTenantName = (address: string) => {
    const tenant = tenants.find((t) => t.address.toLowerCase() === address.toLowerCase())
    return tenant ? tenant.name : "Unknown Tenant"
  }

  // Calculate statistics
  const unpaidBills = bills.filter((bill) => !bill.paid)
  const totalUnpaid = unpaidBills.reduce((sum, bill) => sum + Number(bill.amountTNCY), 0)

  let formattedTotalUnpaid = formatUnits(ethers.toBigInt(totalUnpaid.toString()), "ether");

  const overdueBills = unpaidBills.filter((bill) => {
    const dueDate = new Date(Number(bill.dateIssuance) * 1000)
    dueDate.setDate(dueDate.getDate() + 30); // We set 30 days payment 
    return dueDate < new Date()
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Unpaid Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unpaidBills.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formattedTotalUnpaid} TNCY</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Overdue Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overdueBills.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bills Overview</CardTitle>
          <CardDescription>View all tenant bills and their payment status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-4 text-slate-500">No bills found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Amount (TNCY)</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill, index) => (
                  <TableRow key={index}>
                    <TableCell>{getTenantName(bill.billee)}</TableCell>
                    <TableCell>{formatUnits(BigInt(bill.amountTNCY), "ether")}</TableCell>
                    <TableCell>{formatDate(Number(bill.dateIssuance) * 1000)}</TableCell>
                    <TableCell>
                      {bill.paid ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Paid
                        </Badge>
                      )
                        : overdueBills.some(b => b.billId === bill.billId) ? (
                          <Badge variant="destructive">Overdue</Badge>
                        )
                          :
                          (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Pending
                            </Badge>
                          )}
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
