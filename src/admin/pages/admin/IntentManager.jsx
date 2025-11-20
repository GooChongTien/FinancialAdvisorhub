import supabase from "@/admin/api/supabaseClient.js";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/admin/components/ui/dialog";
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
import { useToast } from "@/admin/components/ui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, ChevronRight, Edit2, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";

async function fetchIntents() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
        "Content-Type": "application/json",
    };

    if (anonKey) headers.apikey = anonKey;
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch("/api/admin-intents", {
        method: "GET",
        headers,
    });

    if (!response.ok) {
        throw new Error("Failed to fetch intents");
    }

    const result = await response.json();
    return result.intents || [];
}

async function createIntent(intentData) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
        "Content-Type": "application/json",
    };

    if (anonKey) headers.apikey = anonKey;
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch("/api/admin-intents", {
        method: "POST",
        headers,
        body: JSON.stringify(intentData),
    });

    if (!response.ok) {
        throw new Error("Failed to create intent");
    }

    return response.json();
}

async function updateIntent(id, intentData) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
        "Content-Type": "application/json",
    };

    if (anonKey) headers.apikey = anonKey;
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`/api/admin-intents?id=${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(intentData),
    });

    if (!response.ok) {
        throw new Error("Failed to update intent");
    }

    return response.json();
}

async function deleteIntent(id) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
        "Content-Type": "application/json",
    };

    if (anonKey) headers.apikey = anonKey;
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`/api/admin-intents?id=${id}`, {
        method: "DELETE",
        headers,
    });

    if (!response.ok) {
        throw new Error("Failed to delete intent");
    }

    return response.json();
}

export default function IntentManager() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIntent, setSelectedIntent] = useState(null);
    const [topicFilter, setTopicFilter] = useState("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        topic: "",
        subtopic: "",
        intent_name: "",
        display_name: "",
        description: "",
        example_phrases: [],
        trigger_workflow_id: null,
    });
    const [newPhrase, setNewPhrase] = useState("");
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const { data: intents = [], isLoading, error } = useQuery({
        queryKey: ["admin-intents"],
        queryFn: fetchIntents,
        staleTime: 60_000,
    });

    // Fetch workflows for trigger selection
    const { data: workflows = [] } = useQuery({
        queryKey: ["admin-workflows"],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke("admin-workflows", {
                method: "GET",
            });
            if (error) throw error;
            return data.workflows || [];
        },
        staleTime: 60_000,
    });

    const createMutation = useMutation({
        mutationFn: createIntent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-intents"] });
            setIsCreateDialogOpen(false);
            setFormData({
                topic: "",
                subtopic: "",
                intent_name: "",
                display_name: "",
                description: "",
                example_phrases: [],
                trigger_workflow_id: null,
            });
            showToast({ type: "success", title: "Intent created successfully" });
        },
        onError: (error) => {
            showToast({ type: "error", title: "Failed to create intent", description: error.message });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateIntent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-intents"] });
            setIsCreateDialogOpen(false);
            setIsEditMode(false);
            setFormData({
                topic: "",
                subtopic: "",
                intent_name: "",
                display_name: "",
                description: "",
                example_phrases: [],
                trigger_workflow_id: null,
            });
            showToast({ type: "success", title: "Intent updated successfully" });
        },
        onError: (error) => {
            showToast({ type: "error", title: "Failed to update intent", description: error.message });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteIntent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-intents"] });
            setSelectedIntent(null);
            showToast({ type: "success", title: "Intent deleted successfully" });
        },
        onError: (error) => {
            showToast({ type: "error", title: "Failed to delete intent", description: error.message });
        },
    });

    const topics = ["all", ...new Set(intents.map((i) => i.topic).filter(Boolean))];

    const filteredIntents = intents.filter((intent) => {
        const matchesSearch =
            intent.intent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            intent.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            intent.subtopic?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTopic = topicFilter === "all" || intent.topic === topicFilter;
        return matchesSearch && matchesTopic;
    });

    const handleOpenCreateDialog = () => {
        setIsEditMode(false);
        setFormData({
            topic: "",
            subtopic: "",
            intent_name: "",
            display_name: "",
            description: "",
            example_phrases: [],
            trigger_workflow_id: null,
        });
        setIsCreateDialogOpen(true);
    };

    const handleOpenEditDialog = (intent) => {
        setIsEditMode(true);
        setFormData({
            id: intent.id,
            topic: intent.topic || "",
            subtopic: intent.subtopic || "",
            intent_name: intent.intent || "",
            display_name: intent.display_name || "",
            description: intent.description || "",
            example_phrases: intent.example_phrases || [],
            trigger_workflow_id: intent.trigger_workflow_id || null,
        });
        setIsCreateDialogOpen(true);
        setSelectedIntent(null);
    };

    const handleAddPhrase = () => {
        if (newPhrase.trim()) {
            setFormData((prev) => ({
                ...prev,
                example_phrases: [...prev.example_phrases, newPhrase.trim()],
            }));
            setNewPhrase("");
        }
    };

    const handleRemovePhrase = (index) => {
        setFormData((prev) => ({
            ...prev,
            example_phrases: prev.example_phrases.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = () => {
        if (isEditMode) {
            updateMutation.mutate({ id: formData.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <div className="flex h-full flex-col bg-neutral-50">
            {/* Header */}
            <div className="border-b border-neutral-200 bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Intent Manager</h1>
                        <p className="text-sm text-neutral-600 mt-1">
                            Manage Mira's intent classification training data
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {intents.length} intents
                        </Badge>
                        <Button size="sm" onClick={handleOpenCreateDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Intent
                        </Button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="mt-4 flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            placeholder="Search intents by topic, subtopic, or intent..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-neutral-500" />
                        <select
                            value={topicFilter}
                            onChange={(e) => setTopicFilter(e.target.value)}
                            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                            {topics.map((topic) => (
                                <option key={topic} value={topic}>
                                    {topic === "all" ? "All Topics" : topic}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Intents Table */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-sm text-neutral-500">Loading intents...</div>
                    </div>
                ) : error ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-sm text-red-600">Error loading intents: {error.message}</div>
                    </div>
                ) : filteredIntents.length === 0 ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-center">
                            <Brain className="mx-auto h-12 w-12 text-neutral-400" />
                            <p className="mt-2 text-sm text-neutral-500">No intents found</p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Topic</TableHead>
                                    <TableHead>Subtopic</TableHead>
                                    <TableHead>Intent</TableHead>
                                    <TableHead>Training Phrases</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredIntents.map((intent) => (
                                    <TableRow
                                        key={intent.id}
                                        className="cursor-pointer hover:bg-neutral-50"
                                        onClick={() => setSelectedIntent(intent)}
                                    >
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {intent.topic || "—"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-neutral-600">
                                            {intent.subtopic || "—"}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm font-medium max-w-md truncate">
                                            {intent.intent}
                                        </TableCell>
                                        <TableCell className="text-sm text-neutral-500">
                                            {intent.example_phrases?.length || 0} phrases
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedIntent(intent);
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

            {/* Intent Details Sheet */}
            <Sheet open={!!selectedIntent} onOpenChange={(open) => !open && setSelectedIntent(null)}>
                <SheetContent className="w-[600px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{selectedIntent?.intent}</SheetTitle>
                        <SheetDescription>Intent classification details and training</SheetDescription>
                    </SheetHeader>

                    {selectedIntent && (
                        <div className="mt-6 space-y-6">
                            {/* Metadata */}
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Topic</h3>
                                    <Badge variant="outline" className="mt-1">
                                        {selectedIntent.topic || "None"}
                                    </Badge>
                                </div>

                                {selectedIntent.subtopic && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-neutral-900">Subtopic</h3>
                                        <p className="mt-1 text-sm text-neutral-600">{selectedIntent.subtopic}</p>
                                    </div>
                                )}
                            </div>

                            {/* Example Phrases */}
                            {selectedIntent.example_phrases && selectedIntent.example_phrases.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Training Phrases</h3>
                                    <div className="mt-2 space-y-2">
                                        {selectedIntent.example_phrases.map((phrase, index) => (
                                            <div
                                                key={index}
                                                className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
                                            >
                                                {phrase}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 border-t border-neutral-200 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => handleOpenEditDialog(selectedIntent)}
                                >
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Edit Intent
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => deleteMutation.mutate(selectedIntent.id)}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {deleteMutation.isPending ? "Deleting..." : "Delete Intent"}
                                </Button>
                            </div>

                            {deleteMutation.error && (
                                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                                    <h4 className="text-sm font-semibold text-red-900">Error</h4>
                                    <p className="mt-1 text-xs text-red-800">{deleteMutation.error.message}</p>
                                </div>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Create/Edit Intent Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? "Edit Intent" : "Create New Intent"}</DialogTitle>
                        <DialogDescription>
                            {isEditMode
                                ? "Update intent details and training phrases"
                                : "Add a new intent with training phrases for Mira's classification system"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Topic */}
                        <div>
                            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                                Topic <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={formData.topic}
                                onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
                                placeholder="e.g., customer, analytics, proposal"
                                className="text-sm"
                            />
                        </div>

                        {/* Subtopic */}
                        <div>
                            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Subtopic</label>
                            <Input
                                value={formData.subtopic}
                                onChange={(e) => setFormData((prev) => ({ ...prev, subtopic: e.target.value }))}
                                placeholder="e.g., search, details, list"
                                className="text-sm"
                            />
                        </div>

                        {/* Intent Name */}
                        <div>
                            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                                Intent Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={formData.intent_name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, intent_name: e.target.value }))}
                                placeholder="e.g., customer.search, analytics.view_metrics"
                                className="text-sm font-mono"
                            />
                        </div>

                        {/* Display Name */}
                        <div>
                            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Display Name</label>
                            <Input
                                value={formData.display_name}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, display_name: e.target.value }))
                                }
                                placeholder="e.g., Search Customers"
                                className="text-sm"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe what this intent is for..."
                                className="w-full min-h-[60px] rounded-md border border-neutral-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Trigger Workflow */}
                        <div>
                            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                                Trigger Workflow (optional)
                            </label>
                            <select
                                value={formData.trigger_workflow_id || ""}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        trigger_workflow_id: e.target.value || null,
                                    }))
                                }
                                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">None (manual handling)</option>
                                {workflows.map((workflow) => (
                                    <option key={workflow.id} value={workflow.id}>
                                        {workflow.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-neutral-500 mt-1">
                                Automatically execute this workflow when the intent is detected
                            </p>
                        </div>

                        {/* Training Phrases */}
                        <div>
                            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                                Training Phrases <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2">
                                {/* Add Phrase Input */}
                                <div className="flex gap-2">
                                    <Input
                                        value={newPhrase}
                                        onChange={(e) => setNewPhrase(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddPhrase();
                                            }
                                        }}
                                        placeholder='e.g., "find customers", "search for a customer"'
                                        className="text-sm flex-1"
                                    />
                                    <Button type="button" size="sm" onClick={handleAddPhrase}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                    </Button>
                                </div>

                                {/* Phrase List */}
                                {formData.example_phrases.length > 0 && (
                                    <div className="space-y-1.5 mt-3">
                                        {formData.example_phrases.map((phrase, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
                                            >
                                                <span className="text-sm text-neutral-700 flex-1">{phrase}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePhrase(index)}
                                                    className="text-neutral-400 hover:text-red-600 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {formData.example_phrases.length === 0 && (
                                    <p className="text-xs text-neutral-500 mt-2">
                                        Add at least 3-5 example phrases for better classification accuracy
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCreateDialogOpen(false);
                                setFormData({
                                    topic: "",
                                    subtopic: "",
                                    intent_name: "",
                                    display_name: "",
                                    description: "",
                                    example_phrases: [],
                                });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                !formData.topic ||
                                !formData.intent_name ||
                                formData.example_phrases.length === 0 ||
                                createMutation.isPending ||
                                updateMutation.isPending
                            }
                        >
                            {createMutation.isPending || updateMutation.isPending
                                ? "Saving..."
                                : isEditMode
                                ? "Update Intent"
                                : "Create Intent"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
