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
    const [testFormData, setTestFormData] = useState({});
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

    // Initialize form data when tool details load
    const initializeFormData = (details) => {
        if (!details?.parameters?.properties) return {};

        const initialData = {};
        Object.entries(details.parameters.properties).forEach(([name, schema]) => {
            // Set default values based on type
            if (schema.type === "boolean") {
                initialData[name] = false;
            } else if (schema.type === "number" || schema.type === "integer") {
                initialData[name] = schema.default !== undefined ? schema.default : 0;
            } else if (schema.type === "array") {
                initialData[name] = "[]";
            } else if (schema.type === "object") {
                initialData[name] = "{}";
            } else {
                initialData[name] = schema.default !== undefined ? schema.default : "";
            }
        });

        return initialData;
    };

    // Reset form when tool changes
    if (toolDetails && Object.keys(testFormData).length === 0) {
        setTestFormData(initializeFormData(toolDetails));
    }

    const handleFormChange = (paramName, value) => {
        setTestFormData((prev) => ({
            ...prev,
            [paramName]: value,
        }));
    };

    const handleTestTool = () => {
        if (!selectedTool || !toolDetails) return;

        // Parse JSON strings for array/object types
        const args = {};
        Object.entries(testFormData).forEach(([key, value]) => {
            const schema = toolDetails.parameters?.properties?.[key];
            if (!schema) return;

            if (schema.type === "array" || schema.type === "object") {
                try {
                    args[key] = JSON.parse(value);
                } catch (e) {
                    args[key] = value; // Fallback to raw value
                }
            } else if (schema.type === "number" || schema.type === "integer") {
                args[key] = Number(value);
            } else if (schema.type === "boolean") {
                args[key] = Boolean(value);
            } else {
                args[key] = value;
            }
        });

        testMutation.mutate({ toolName: selectedTool, args });
    };

    const renderInputField = (paramName, schema) => {
        const value = testFormData[paramName] || "";
        const isRequired = toolDetails?.parameters?.required?.includes(paramName);

        // Boolean type
        if (schema.type === "boolean") {
            return (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id={paramName}
                        checked={Boolean(value)}
                        onChange={(e) => handleFormChange(paramName, e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor={paramName} className="text-sm text-neutral-700">
                        {schema.description || paramName}
                    </label>
                </div>
            );
        }

        // Number type
        if (schema.type === "number" || schema.type === "integer") {
            return (
                <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleFormChange(paramName, e.target.value)}
                    placeholder={schema.description || `Enter ${paramName}`}
                    step={schema.type === "integer" ? "1" : "any"}
                    className="text-sm font-mono"
                />
            );
        }

        // Array or Object type (JSON input)
        if (schema.type === "array" || schema.type === "object") {
            return (
                <textarea
                    value={value}
                    onChange={(e) => handleFormChange(paramName, e.target.value)}
                    placeholder={schema.type === "array" ? '["value1", "value2"]' : '{"key": "value"}'}
                    rows={3}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
            );
        }

        // Enum type (select)
        if (schema.enum && Array.isArray(schema.enum)) {
            return (
                <select
                    value={value}
                    onChange={(e) => handleFormChange(paramName, e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                    <option value="">Select {paramName}</option>
                    {schema.enum.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            );
        }

        // Default: String type
        return (
            <Input
                type="text"
                value={value}
                onChange={(e) => handleFormChange(paramName, e.target.value)}
                placeholder={schema.description || `Enter ${paramName}`}
                className="text-sm font-mono"
            />
        );
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
            <Sheet
                open={!!selectedTool}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedTool(null);
                        setTestFormData({});
                    }
                }}
            >
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

                            {/* Test Form */}
                            {toolDetails.parameters?.properties && (
                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900 mb-3">Test Parameters</h3>
                                    <div className="space-y-4">
                                        {Object.entries(toolDetails.parameters.properties).map(([name, schema]) => (
                                            <div key={name}>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <label className="text-sm font-medium text-neutral-700">
                                                        <code className="text-sm">{name}</code>
                                                    </label>
                                                    {toolDetails.parameters?.required?.includes(name) && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            required
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="text-xs">
                                                        {schema.type || "any"}
                                                    </Badge>
                                                </div>
                                                {schema.description && (
                                                    <p className="text-xs text-neutral-500 mb-2">
                                                        {schema.description}
                                                    </p>
                                                )}
                                                {renderInputField(name, schema)}
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
