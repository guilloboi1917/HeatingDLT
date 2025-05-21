"use client"

import { useState, useEffect } from "react"
import { useContractStore } from "@/store/useContractStore"
import { toast } from "sonner"
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
import { downloadFromIPFS } from "@/lib/ipfs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function TenantUtilityExpenses() {
    const { getTenantUtilityExpenses, account } = useContractStore();
    const [utilityExpenses, setUtilityExpenses] = useState<UtilityExpense[] | null>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<UtilityExpense[] | null>([]);
    const [isLoading, setIsLoading] = useState(true)
    const [totalExpenses, setTotalExpenses] = useState<string | null>(null)

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");

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
            toast.error(
                "Error fetching Utility Expenses",
                {
                    description: "Could not retrieve Utility Expenses from the blockchain"
                })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (utilityExpenses) {
            applyFilters();
        }
    }, [utilityExpenses, searchTerm, typeFilter, dateFilter])


    const handlePDFDownload = async (cid: string, type: string) => {
        console.log("Downloading: ", cid);
        await downloadFromIPFS(cid, type);
    }

    const applyFilters = () => {
        if (!utilityExpenses) return;

        let filtered = [...utilityExpenses];

        // Apply search term filter (description and issuer)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(expense =>
                expense.description.toLowerCase().includes(term) ||
                expense.issuer.toLowerCase().includes(term)
            );
        }

        // Apply type filter
        if (typeFilter !== "all") {
            filtered = filtered.filter(expense =>
                expense.utilityType.toLowerCase() === typeFilter.toLowerCase()
            );
        }

        // Apply date filter
        if (dateFilter) {
            filtered = filtered.filter(expense =>
                expense.dateIssuance.toLocaleDateString('de-CH').includes(dateFilter)
            );
        }

        setFilteredExpenses(filtered);
    }

    // Get unique utility types for filter dropdown
    const utilityTypes = utilityExpenses
        ? Array.from(new Set(utilityExpenses.map(expense => expense.utilityType)))
        : [];

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
                <CardContent className="space-y-4">
                    {/* Filter Controls */}
                    <div className="flex flex-col md:flex-row gap-4">

                        <Input
                            placeholder="Search by description or issuer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-md"
                        />

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {utilityTypes.map((type, index) => (
                                    <SelectItem key={index} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            type="text"
                            placeholder="Filter by date (DD.MM.YYYY)"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-[220px]"
                        /></div>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner />
                        </div>
                    ) : (filteredExpenses === null || filteredExpenses.length === 0) ? (
                        <div className="text-center py-4 text-slate-500">
                            {utilityExpenses?.length === 0
                                ? "No Utility Expenses found"
                                : "No expenses match your filters"}
                        </div>
                    ) : (

                        <div className="relative h-[400px] overflow-auto rounded-md border [&::-webkit-scrollbar]:w-2  [&::-webkit-scrollbar-track]:bg-gray-100  [&::-webkit-scrollbar-thumb]:bg-gray-300  dark:[&::-webkit-scrollbar-track]:bg-neutral-700  dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow>
                                        <TableHead>Issuer</TableHead>
                                        <TableHead>Amount (TNCY)</TableHead>
                                        <TableHead>Date Issued</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredExpenses.sort((a, b) => {
                                        // Convert dates to timestamps for comparison
                                        const dateA = a.dateIssuance.getTime();
                                        const dateB = b.dateIssuance.getTime();

                                        return dateB - dateA;
                                    }).map((expense: UtilityExpense, index) => (
                                        <TableRow key={index} className="hover:cursor-pointer" onClick={() => handlePDFDownload(expense.ipfsCID, expense.utilityType)}>
                                            <TableCell>{expense.issuer.substring(0, 6)}...{expense.issuer.substring(expense.issuer.length - 4)}</TableCell>
                                            <TableCell>{Number(formatUnits(expense.amountTNCY, 18)).toFixed(2)}</TableCell>
                                            <TableCell>{expense.dateIssuance.toLocaleDateString('de-CH')}</TableCell>
                                            <TableCell>{expense.utilityType}</TableCell>
                                            <TableCell className="max-w-[300px] truncate" title={expense.description}>
                                                {expense.description}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}