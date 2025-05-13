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
import { Label } from "@/components/ui/label"
import { Bill, UtilityExpense } from "@/types/types"
import { formatUnits, ethers } from "ethers";
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HousePlus } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"


export default function AdminUtilityExpenses() {
    const { getUtilityExpenses, account } = useContractStore();
    const [utilityExpenses, setUtilityExpenses] = useState<UtilityExpense[] | null>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<UtilityExpense[] | null>([]);
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast();
    const [totalExpenses, setTotalExpenses] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    // Record Utility Expense states
    const [amountTNCY, setAmountTNCY] = useState<string>("");

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");

    useEffect(() => {
        fetchUtilityExpenses();
    }, [])

    useEffect(() => {
        if (utilityExpenses) {
            applyFilters();
        }
    }, [utilityExpenses, searchTerm, typeFilter, dateFilter])

    const fetchUtilityExpenses = async () => {
        try {
            setIsLoading(true);
            const fetchedUtilityExpenses = await getUtilityExpenses();
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

    const handleAddUtilityExpense = async () => {

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
                        />

                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <HousePlus className="mr-2 h-4 w-4" />
                                    Add Utility Expense
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add new Utility Expense</DialogTitle>
                                    <DialogDescription>Add a new Utility Expense</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="amountTNCY">TNCY Amount</Label>
                                        <Input
                                            id="amountTNCY"
                                            placeholder="Enter TNCY Amount e.g. 200 TNCY"
                                            value={amountTNCY}
                                            onChange={(e) => setAmountTNCY(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="issuanceDate">Date</Label>
                                        <Input
                                            id="issuanceDate"
                                            placeholder="e.g. 14.5.2025"
                                            value={amountTNCY}
                                            onChange={(e) => setAmountTNCY(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="utilityType">Utility Type</Label>
                                        <Input
                                            id="utilityType"
                                            placeholder="e.g. REPAIRS"
                                            value={amountTNCY}
                                            onChange={(e) => setAmountTNCY(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Short Description</Label>
                                        <Input
                                            id="description"
                                            placeholder="e.g. Hallway door did not close properly"
                                            value={amountTNCY}
                                            onChange={(e) => setAmountTNCY(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="tenantsList">List of Tenants</Label>
                                        <Input
                                            id="tenantsList"
                                            placeholder="[0x..., 0x...]"
                                            value={amountTNCY}
                                            onChange={(e) => setAmountTNCY(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddUtilityExpense} disabled={isSubmitting || !amountTNCY }>
                                        {isSubmitting ? "Adding..." : "Add Tenant"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

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
                                    {filteredExpenses.map((expense: UtilityExpense, index) => (
                                        <TableRow key={index}>
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