"use client"

import { useState, useEffect } from "react"
import { useContractStore } from "@/store/useContractStore"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDate } from "@/lib/utils"
import { Bill } from "@/types/types"

export default function TenantBills() {
  const { getBills, payBill, tokenBalance, account } = useContractStore()
  const { toast } = useToast()
  const [bills, setBills] = useState<Bill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState<number | null>(null)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      setIsLoading(true)
      const fetchedBills = await getBills(account)
      setBills(fetchedBills)
    } catch (error) {
      console.error("Error fetching bills:", error)
      toast({
        title: "Error fetching bills",
        description: "Could not retrieve bill information from the blockchain",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayBill = async (billId: string, amount: number) => {
    if (tokenBalance < amount) {
      toast({
        title: "Insufficient tokens",
        description: "You don't have enough HEAT tokens to pay this bill. Please top up your balance.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsPaying(billId)
      const success = await payBill(billId, amount)

      // TODO fetch return from paybill
      if (true) {
        toast({
          title: "Bill paid",
          description: `Your bill of ${amount} HEAT has been paid successfully`,
        })

        // Refresh the bills list
        await fetchBills()
      } else {
        toast({
          title: "Error paying bill",
          description: "Failed to pay the bill. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error paying bill:", error)
      toast({
        title: "Error paying bill",
        description: "Failed to pay the bill. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPaying(null)
    }
  }

  // Calculate statistics
  const unpaidBills = bills.filter((bill) => !bill.paid)
  const totalUnpaid = unpaidBills.reduce((sum, bill) => sum + Number(bill.amountHEAT), 0)
  const overdueBills = unpaidBills.filter((bill) => { 
    const dueDate = new Date(Number(bill.dateIssuance) * 1000)
    dueDate.setDate(dueDate.getDate() + 30); // We set 30 days payment 
    return dueDate < new Date() })

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
            <div className="text-3xl font-bold">{totalUnpaid} HEAT</div>
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
          <CardTitle>Your Bills</CardTitle>
          <CardDescription>View and pay your heating bills</CardDescription>
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
                  <TableHead>Amount (HEAT)</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill, index) => (
                  <TableRow key={index}>
                    <TableCell>{Number(bill.amountHEAT)}</TableCell>
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
                        : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Pending
                          </Badge>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!bill.paid && (
                        <Button
                          size="sm"
                          onClick={() => handlePayBill(bill.billId, bill.amountHEAT)}
                          disabled={isPaying === Number(bill.billId)}
                        >
                          {isPaying === Number(bill.billId) ? "Processing..." : "Pay Bill"}
                        </Button>
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
