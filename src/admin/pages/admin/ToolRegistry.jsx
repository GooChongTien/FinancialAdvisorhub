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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Filter, Play, Search, Wrench } from "lucide-react";
import { useState } from "react";

async function fetchTools() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
        "Content-Type": "application/json",
    };

    if (anonKey) headers.apikey = anonKey;
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch("/api/admin-tools", {
        method: "GET",
        headers,
    });

    if (!response.ok) {
        throw new Error("Failed to fetch tools");
    }

    const result = await response.json();
    return result.tools || [];
}

async function fetchToolDetails(toolName) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
        "Content-Type": "application/json",
    };

    if (anonKey) headers.apikey = anonKey;
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`/api/admin-tools?name=${encodeURIComponent(toolName)}`, {
        method: "GET",
        headers,
    });

    if (!response.ok) {
        throw new Error("Failed to fetch tool details");
    }

    const result = await response.json();
    return result.tool;
}

async function testTool({ toolName, args }) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
        "Content-Type": "application/json",
    };

    if (anonKey) headers.apikey = anonKey;
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch("/api/admin-tools", {
        method: "POST",
        headers,
        body: JSON.stringify({ tool: toolName, args }),
    });

    if (!response.ok) {
        throw new Error("Tool execution failed");
    }

    return response.json();
}

export default function ToolRegistry() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTool, setSelectedTool] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const queryClient = useQueryClient();

    const { data: tools = [], isLoading, error } = useQuery({
        queryKey: ["admin-tools"],
        queryFn: fetchTools,
        staleTime: 60_000,
    });

    const { data: toolDetails, isLoading: isLoadingDetails } = useQuery({
        queryKey: ["admin-tools", selectedTool],
        queryFn: () => fetchToolDetails(selectedTool),
        enabled: !!selectedTool,
        staleTime: 30_000,
    });

    const testMutation = useMutation({
        mutationFn: testTool,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-tools"] });
        },
    });

    const categories = ["all", ...new Set(tools.map((t) => t.category))];

    const filteredTools = tools.filter((tool) => {
        const matchesSearch =
            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || tool.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleTestTool = () => {
        if (!selectedTool || !toolDetails) return;

        // Build simple test args from required params
        const args = {};
        if (toolDetails.parameters?.required) {
            toolDetails.parameters.required.forEach((param) => {
                args[param] = "test_value";
            });
        }

        testMutation.mutate({ toolName: selectedTool, args });
    };

    return (
        <div className="flex h-full flex-col bg-neutral-50">
            {/* Header */}
            <div className="border-b border-neutral-200 bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Tool Registry</h1>
                        <p className="text-sm text-neutral-600 mt-1">
                            Browse and manage Mira's available tools and capabilities
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {tools.length} tools
                        </Badge>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="mt-4 flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            placeholder="Search tools by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-neutral-500" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat === "all" ? "All Categories" : cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tools Table */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-sm text-neutral-500">Loading tools...</div>
                    </div>
                ) : error ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-sm text-red-600">Error loading tools: {error.message}</div>
                    </div>
                ) : filteredTools.length === 0 ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-center">
                            <Wrench className="mx-auto h-12 w-12 text-neutral-400" />
                            <p className="mt-2 text-sm text-neutral-500">No tools found</p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tool Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Parameters</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTools.map((tool) => (
                                    <TableRow
                                        key={tool.name}
                                        className="cursor-pointer hover:bg-neutral-50"
                                        onClick={() => setSelectedTool(tool.name)}
                                    >
                                        <TableCell className="font-mono text-sm font-medium">
                                            {tool.name}
                                        </TableCell>
                                        <TableCell className="max-w-md truncate text-sm text-neutral-600">
                                            {tool.description || "No description"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {tool.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-neutral-500">
                                            {tool.parameters?.length || 0} params
                                            {tool.requiredParams?.length > 0 && (
                                                <span className="ml-1 text-amber-600">
                                                    ({tool.requiredParams.length} required)
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={tool.isActive ? "success" : "secondary"}
                                                className="text-xs"
                                            >
                                                {tool.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedTool(tool.name);
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
                )}
            </div>

            {/* Tool Details Sheet */}
            <Sheet open={!!selectedTool} onOpenChange={(open) => !open && setSelectedTool(null)}>
                <SheetContent className="w-[600px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="font-mono">{selectedTool}</SheetTitle>
                        <SheetDescription>Tool configuration and testing</SheetDescription>
                    </SheetHeader>

                    {isLoadingDetails ? (
                        <div className="mt-8 flex justify-center">
                            <div className="text-sm text-neutral-500">Loading details...</div>
                        </div>
                    ) : toolDetails ? (
                        <div className="mt-6 space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-900">Description</h3>
                                <p className="mt-2 text-sm text-neutral-600">
                                    {toolDetails.description || "No description available"}
                                </p>
                            </div>

                            {/* Parameters */}
                            {toolDetails.parameters?.properties && (
                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Parameters</h3>
                                    <div className="mt-2 space-y-3">
                                        {Object.entries(toolDetails.parameters.properties).map(([name, schema]) => (
                                            <div
                                                key={name}
                                                className="rounded-md border border-neutral-200 bg-neutral-50 p-3"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm font-medium text-neutral-900">{name}</code>
                                                    {toolDetails.parameters?.required?.includes(name) && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            required
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-neutral-600">
                                                    {schema.description || "No description"}
                                                </p>
                                                <p className="mt-1 text-xs text-neutral-500">
                                                    Type: <code>{schema.type || "any"}</code>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Schema */}
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-900">Full Schema</h3>
                                <pre className="mt-2 overflow-x-auto rounded-md bg-neutral-900 p-4 text-xs text-neutral-100">
                                    {JSON.stringify(toolDetails, null, 2)}
                                </pre>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 border-t border-neutral-200 pt-4">
                                <Button
                                    onClick={handleTestTool}
                                    disabled={testMutation.isPending}
                                    className="flex-1"
                                >
                                    <Play className="mr-2 h-4 w-4" />
                                    {testMutation.isPending ? "Testing..." : "Test Tool"}
                                </Button>
                            </div>

                            {/* Test Result */}
                            {testMutation.data && (
                                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                                    <h4 className="text-sm font-semibold text-emerald-900">Test Result</h4>
                                    <pre className="mt-2 overflow-x-auto text-xs text-emerald-800">
                                        {JSON.stringify(testMutation.data, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {testMutation.error && (
                                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                                    <h4 className="text-sm font-semibold text-red-900">Error</h4>
                                    <p className="mt-1 text-xs text-red-800">{testMutation.error.message}</p>
                                </div>
                            )}
                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>
        </div>
    );
}
