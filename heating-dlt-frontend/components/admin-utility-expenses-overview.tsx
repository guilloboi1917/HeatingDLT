"use client"

import { useState, useEffect, useRef } from "react"
import { useContractStore } from "@/store/useContractStore"
import { toast } from "sonner"
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
import { HousePlus, FilePlus, FileChartColumn } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useFilePicker } from 'use-file-picker';
import { putPDFToIPFSHelper, downloadFromIPFS } from "@/lib/ipfs"



export default function AdminUtilityExpenses() {
    const { getUtilityExpenses, recordUtilityExpense, account, getTenants } = useContractStore();
    const [utilityExpenses, setUtilityExpenses] = useState<UtilityExpense[] | null>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<UtilityExpense[] | null>([]);
    const [isLoading, setIsLoading] = useState(true)
    const [totalExpenses, setTotalExpenses] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    // Record Utility Expense states
    const [amountTNCY, setAmountTNCY] = useState<number>(0);
    const [issuanceDate, setIssuanceDate] = useState<string>("");
    const [utilityType, setUtilityType] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [selectedTenants, setSelectedTenants] = useState<string[]>([])
    const [tenantAddresses, setTenantAddresses] = useState<string[]>([]);
    const [tenantNames, setTenantNames] = useState<string[]>([]);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");

    const [selectedPDFFile, setSelectedPDFFile] = useState<File | null>(null);

    // File picker
    const { openFilePicker, plainFiles } = useFilePicker({
        accept: '.pdf',
        multiple: false,
        readAs: 'ArrayBuffer', // important if you want to pass raw PDF content
    });

    useEffect(() => {
        fetchUtilityExpenses();
    }, [])

    useEffect(() => {
        if (utilityExpenses) {
            applyFilters();
        }
    }, [utilityExpenses, searchTerm, typeFilter, dateFilter])

    // This effect runs when a file is selected
    useEffect(() => {
        const uploadFile = async () => {
            if (plainFiles.length === 0) return;

            setSelectedPDFFile(plainFiles[0]);
            console.log("New PDF File selected: ", plainFiles[0]);
        };

        uploadFile();
    }, [plainFiles]);

    // Fetch tenants on mount
    useEffect(() => {
        const fetchTenants = async () => {
            const tenants = await getTenants();
            const addresses = tenants.map((t) => t.address);
            const names = tenants.map((t) => t.name);
            setTenantAddresses(addresses);
            setTenantNames(names);
        };

        fetchTenants();
    }, []);

    const toggleSelection = (value: string) => {
        if (value === "ALL") {
            // Toggle all selected
            if (selectedTenants.length === tenantAddresses.length) {
                setSelectedTenants([]); // deselect all
            } else {
                setSelectedTenants(tenantAddresses); // select all
            }
        } else {
            // Toggle individual selection
            setSelectedTenants((prev) =>
                prev.includes(value)
                    ? prev.filter((v) => v !== value)
                    : [...prev, value]
            );
        }
    };

    const fetchUtilityExpenses = async () => {
        try {
            setIsLoading(true);
            const fetchedUtilityExpenses = await getUtilityExpenses();
            setUtilityExpenses(fetchedUtilityExpenses);
            setTotalExpenses(Number(formatUnits(fetchedUtilityExpenses.reduce((sum, expense) => sum + expense.amountTNCY / BigInt(expense.tenants.length), 0n), "ether")).toFixed(2))
        }
        catch (error) {
            console.error("Error fetching Utility Expenses");
            toast.error(
                "Error fetching Utility Expenses")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddUtilityExpense = async () => {
        // First get the CID
        const cid = selectedPDFFile ? await putPDFToIPFSHelper(selectedPDFFile) : "";

        await recordUtilityExpense(amountTNCY, new Date(issuanceDate), utilityType, description, cid, selectedTenants);

        setDialogOpen(false);
        setIsSubmitting(false);
    }

    const handlePDFDownload = async (cid: string, type: string) => {
        console.log("Downloading: ", cid);
        await downloadFromIPFS(cid, type);
    }

    const isAddingExpenseDisabled = (): boolean => {
        return isSubmitting || !amountTNCY || !issuanceDate || !utilityType || !description || !selectedTenants

    }

    const handleUploadPDF = async () => {
        console.log("Opening file picker...");
        openFilePicker(); // This shows the file dialog
    }

    const [showTooltip, setShowTooltip] = useState(false);
    const hoverTimeout = useRef(null);

    const handleMouseEnter = () => {
        hoverTimeout.current = setTimeout(() => {
            setShowTooltip(true);
        }, 1000); // 2 second delay
    };

    const handleMouseLeave = () => {
        clearTimeout(hoverTimeout.current); // cancel if not completed
        setShowTooltip(false); // hide instantly
    };

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
                                            onChange={(e) => setAmountTNCY(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="issuanceDate">Date</Label>
                                        <Input
                                            type="date"
                                            id="issuanceDate"
                                            value={issuanceDate}
                                            onChange={(e) => setIssuanceDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="utilityType">Utility Type</Label>
                                        <Input
                                            id="utilityType"
                                            list="utility-types"
                                            placeholder="e.g. REPAIRS"
                                            value={utilityType}
                                            onChange={(e) => setUtilityType(e.target.value)}
                                        />
                                        <datalist id="utility-types">
                                            <option value="REPAIRS" />
                                            <option value="WATER" />
                                            <option value="ELECTRICITY" />
                                            <option value="GAS" />
                                            <option value="INTERNET" />
                                            <option value="SECURITY" />
                                        </datalist>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Short Description</Label>
                                        <Input
                                            id="description"
                                            placeholder="e.g. Hallway door did not close properly"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="tenantsList">List of Tenants</Label>
                                        <Select
                                            // A dummy value to keep it controlled — not standard usage, but works
                                            value=""
                                            onValueChange={toggleSelection}
                                        >
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={
                                                        selectedTenants.length === tenantAddresses.length
                                                            ? "All Tenants Selected"
                                                            : selectedTenants.length > 0
                                                                ? `${selectedTenants.length} selected`
                                                                : "Select tenants"
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">
                                                    {selectedTenants.length === tenantAddresses.length
                                                        ? "Deselect All"
                                                        : "Select All"}
                                                </SelectItem>
                                                {tenantAddresses.map((address, index) => (
                                                    <SelectItem key={address} value={address}>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                readOnly
                                                                checked={selectedTenants.includes(address)}
                                                                className="h-4 w-4"
                                                            />
                                                            <span className="flex overflow-visible">
                                                                <span className="w-60 truncate">{tenantNames[index]}</span>
                                                                <span
                                                                    className="relative group cursor-default"
                                                                    onMouseEnter={handleMouseEnter}
                                                                    onMouseLeave={handleMouseLeave}
                                                                >
                                                                    <span className="truncate">{address.substring(0, 6)}...{address.substring(address.length - 4)}</span>
                                                                    {showTooltip && (
                                                                        <span className="absolute bottom-full left-0 -translate-x-[50%] mt-1 w-max max-w-xs rounded bg-black text-white text-xs px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                                            {address}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Button onClick={handleUploadPDF}>
                                            <FilePlus className="mr-2 h-4 w-4"
                                            />
                                            Upload Expense PDF
                                        </Button>

                                        {selectedPDFFile ? (
                                            <div className="mt-5 flex items-center gap-2 italic">
                                                <button
                                                    onClick={() => {
                                                        setSelectedPDFFile(null);
                                                        // Optionally trigger a re-render if needed (see note below)
                                                    }}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                    title="Remove file"
                                                >
                                                    ✖
                                                </button>
                                                <p>File: {selectedPDFFile.name}</p>
                                            </div>
                                        ) : (
                                            <p className="mt-5 italic">No file selected</p>
                                        )}                                    </div>

                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddUtilityExpense} disabled={isAddingExpenseDisabled()}>
                                        {isSubmitting ? "Adding..." : "Add Utility Expense"}
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
        </div >
    )
}