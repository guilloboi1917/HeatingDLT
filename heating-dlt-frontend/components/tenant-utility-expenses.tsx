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
import { formatUnits, ethers } from "ethers";
import { useSelectSingle } from "react-day-picker"
import { UtilityExpense } from "@/types/types"
import { tree } from "next/dist/build/templates/app-page"

export default function TenantUtilityExpenses() {
    const { getTenantUtilityExpenses, account } = useContractStore();
    const [utilityExpenses, setUtilityExpenses] = useState<UtilityExpense[] | null>([]);
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast();
    const [totalExpenses, setTotalExpenses] = useState<string | null>(null)

    useEffect(() => {
        fetchTenantUtilityExpenses();
    }, [])

    const fetchTenantUtilityExpenses = async () => {
        try {
            setIsLoading(true);
            const fetchedUtilityExpenses = await getTenantUtilityExpenses(account);
            setUtilityExpenses(fetchedUtilityExpenses);
            setTotalExpenses(Number(formatUnits(fetchedUtilityExpenses.reduce((sum, expense) => sum + expense.amountTNCY / BigInt(expense.tenants.length), 0n), "ether")).toFixed(2))
        }
        catch (error) {
            console.error("Error fetching Utility Expenses");
            toast({
                title: "Error fetching Utility Expenses",
                description: "Could not retrieve Utility Expenses from the blockchain",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Your Total Cost Share</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalExpenses} TNCY</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>My Utility Expenses</CardTitle>
                    <CardDescription>View your Utility Expenses</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner />
                        </div>
                    ) : (utilityExpenses === null || utilityExpenses.length === 0) ? (
                        <div className="text-center py-4 text-slate-500">No Utility Expenses found</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Issuer</TableHead>
                                    <TableHead>Amount (TNCY)</TableHead>
                                    <TableHead>Date Issued</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {utilityExpenses.map((expense: UtilityExpense, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{expense.issuer.substring(0, 6)}...{expense.issuer.substring(expense.issuer.length - 4)}</TableCell>
                                        <TableCell>{Number(formatUnits(expense.amountTNCY, 18)).toFixed(2)}</TableCell>
                                        <TableCell>{expense.dateIssuance.toLocaleDateString('de-CH')}</TableCell>
                                        <TableCell>{expense.utilityType}</TableCell>
                                        {/* Should shorten this probably */}
                                        <TableCell>{expense.description}</TableCell>
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