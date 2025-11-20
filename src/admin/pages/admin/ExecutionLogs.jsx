import supabase from "@/admin/api/supabaseClient.js";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/admin/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/admin/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Clock, Search, XCircle } from "lucide-react";
import { useState } from "react";

async function fetchExecutionLogs({ page = 0, pageSize = 25, status = "all" }) {
    // Calculate range for pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Build query
    let query = supabase
        .from("mira_workflow_executions")
        .select("*", { count: "exact" })
        .order("started_at", { ascending: false });

    // Apply status filter
    if (status !== "all") {
        query = query.eq("status", status);
    }

    // Apply pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.warn("Error fetching execution logs:", error);
        return { executions: [], totalCount: 0 };
    }

    return { executions: data || [], totalCount: count || 0 };
}

export default function ExecutionLogs() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedExecution, setSelectedExecution] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(25);

    const { data, isLoading, error } = useQuery({
        queryKey: ["execution-logs", statusFilter, currentPage, pageSize],
        queryFn: () => fetchExecutionLogs({ page: currentPage, pageSize, status: statusFilter }),
        staleTime: 10_000,
        refetchInterval: 30_000, // Auto-refresh every 30s
    });

    const executions = data?.executions || [];
    const totalCount = data?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const statuses = ["all", "completed", "failed", "running"];

    // Client-side search filter (applied after server-side status filter and pagination)
    const filteredExecutions = executions.filter((exec) => {
        if (!searchQuery) return true;
        return (
            exec.workflow_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exec.execution_id?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    // Reset to first page when status filter changes
    const handleStatusFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        setCurrentPage(0);
    };

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(0, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
    };

    const handlePageClick = (pageNum) => {
        setCurrentPage(pageNum);
    };

    const formatDuration = (startedAt, completedAt) => {
        if (!startedAt) return "—";
        const start = new Date(startedAt);
        const end = completedAt ? new Date(completedAt) : new Date();
        const durationMs = end - start;
        const seconds = Math.floor(durationMs / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
    };

    const formatTime = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleString("en-SG", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-4 w-4 text-emerald-600" />;
            case "failed":
                return <XCircle className="h-4 w-4 text-red-600" />;
            case "running":
                return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
            default:
                return <AlertCircle className="h-4 w-4 text-neutral-400" />;
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case "completed":
                return "success";
            case "failed":
                return "destructive";
            case "running":
                return "default";
            default:
                return "secondary";
        }
    };

    return (
        <div className="flex h-full flex-col bg-neutral-50">
            {/* Header */}
            <div className="border-b border-neutral-200 bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Execution Logs</h1>
                        <p className="text-sm text-neutral-600 mt-1">
                            Monitor workflow execution history and debug issues
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {executions.length} executions
                        </Badge>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="mt-4 flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            placeholder="Search by workflow name or execution ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-neutral-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusFilterChange(e.target.value)}
                            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                            {statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status === "all" ? "All Statuses" : status}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Execution Logs Table */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-sm text-neutral-500">Loading execution logs...</div>
                    </div>
                ) : error ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-sm text-red-600">Error loading logs: {error.message}</div>
                    </div>
                ) : filteredExecutions.length === 0 ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-center">
                            <Activity className="mx-auto h-12 w-12 text-neutral-400" />
                            <p className="mt-2 text-sm text-neutral-500">No execution logs found</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Workflow</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Started</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Execution ID</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredExecutions.map((execution) => (
                                        <TableRow
                                            key={execution.execution_id}
                                            className="cursor-pointer hover:bg-neutral-50"
                                            onClick={() => setSelectedExecution(execution)}
                                        >
                                            <TableCell className="font-medium">
                                                {execution.workflow_name || execution.workflow_id}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(execution.status)}
                                                    <Badge variant={getStatusVariant(execution.status)} className="text-xs">
                                                        {execution.status || "unknown"}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-neutral-600">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3 w-3 text-neutral-400" />
                                                    {formatTime(execution.started_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-neutral-600">
                                                {formatDuration(execution.started_at, execution.completed_at)}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-neutral-500">
                                                {execution.execution_id?.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedExecution(execution);
                                                    }}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3">
                                <div className="text-sm text-neutral-600">
                                    Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalCount)} of {totalCount} executions
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handlePreviousPage}
                                        disabled={currentPage === 0}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i;
                                            } else if (currentPage < 3) {
                                                pageNum = i;
                                            } else if (currentPage > totalPages - 4) {
                                                pageNum = totalPages - 5 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    size="sm"
                                                    variant={currentPage === pageNum ? "default" : "ghost"}
                                                    onClick={() => handlePageClick(pageNum)}
                                                    className="min-w-[36px]"
                                                >
                                                    {pageNum + 1}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleNextPage}
                                        disabled={currentPage >= totalPages - 1}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Execution Details Sheet */}
            <Sheet open={!!selectedExecution} onOpenChange={(open) => !open && setSelectedExecution(null)}>
                <SheetContent className="w-[700px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{selectedExecution?.workflow_name || "Execution Details"}</SheetTitle>
                        <SheetDescription>View execution trace and debug information</SheetDescription>
                    </SheetHeader>

                    {selectedExecution && (
                        <div className="mt-6 space-y-6">
                            {/* Status Overview */}
                            <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                                {getStatusIcon(selectedExecution.status)}
                                <div className="flex-1">
                                    <div className="text-sm font-semibold text-neutral-900">
                                        {selectedExecution.status}
                                    </div>
                                    <div className="text-xs text-neutral-600">
                                        Duration: {formatDuration(selectedExecution.started_at, selectedExecution.completed_at)}
                                    </div>
                                </div>
                            </div>

                            {/* Execution Metadata */}
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Execution ID</h3>
                                    <code className="mt-1 block rounded bg-neutral-100 px-2 py-1 text-xs">
                                        {selectedExecution.execution_id}
                                    </code>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Workflow ID</h3>
                                    <code className="mt-1 block rounded bg-neutral-100 px-2 py-1 text-xs">
                                        {selectedExecution.workflow_id}
                                    </code>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Timeline</h3>
                                    <div className="mt-2 space-y-1 text-xs text-neutral-600">
                                        <div>Started: {formatTime(selectedExecution.started_at)}</div>
                                        {selectedExecution.completed_at && (
                                            <div>Completed: {formatTime(selectedExecution.completed_at)}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Error Details */}
                            {selectedExecution.error_message && (
                                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                                    <h3 className="text-sm font-semibold text-red-900">Error Details</h3>
                                    <pre className="mt-2 overflow-x-auto text-xs text-red-800">
                                        {selectedExecution.error_message}
                                    </pre>
                                </div>
                            )}

                            {/* Input/Output */}
                            {selectedExecution.input_data && (
                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Input Data</h3>
                                    <pre className="mt-2 overflow-x-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs">
                                        {JSON.stringify(selectedExecution.input_data, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedExecution.output_data && (
                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Output Data</h3>
                                    <pre className="mt-2 overflow-x-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs">
                                        {JSON.stringify(selectedExecution.output_data, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Execution Trace */}
                            {selectedExecution.trace && (
                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Execution Trace</h3>
                                    <pre className="mt-2 overflow-x-auto rounded-md border border-neutral-200 bg-neutral-900 p-3 text-xs text-neutral-100">
                                        {JSON.stringify(selectedExecution.trace, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
