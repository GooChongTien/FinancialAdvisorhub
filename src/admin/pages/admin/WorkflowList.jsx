import { supabase } from "@/admin/api/supabaseClient";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/admin/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import { Input } from "@/admin/components/ui/input";
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
import { Copy, Edit, MoreHorizontal, Play, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function WorkflowList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [search, setSearch] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newWorkflow, setNewWorkflow] = useState({ name: "", description: "", trigger_intent: "" });

    // Fetch workflows
    const { data: workflows = [], isLoading } = useQuery({
        queryKey: ["admin-workflows"],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke("admin-workflows", {
                method: "GET",
            });
            if (error) throw error;
            return data;
        },
    });

    // Create workflow mutation
    const createMutation = useMutation({
        mutationFn: async (payload) => {
            const { data, error } = await supabase.functions.invoke("admin-workflows", {
                method: "POST",
                body: payload,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-workflows"]);
            setIsCreateOpen(false);
            setNewWorkflow({ name: "", description: "", trigger_intent: "" });
            showToast({ type: "success", title: "Workflow created" });
        },
        onError: (error) => {
            showToast({ type: "error", title: "Failed to create", description: error.message });
        },
    });

    // Delete workflow mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.functions.invoke(`admin-workflows/${id}`, {
                method: "DELETE",
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-workflows"]);
            showToast({ type: "success", title: "Workflow deleted" });
        },
    });

    const filteredWorkflows = workflows.filter((w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.trigger_intent?.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = () => {
        if (!newWorkflow.name) return;
        createMutation.mutate(newWorkflow);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "published": return "bg-green-100 text-green-800";
            case "draft": return "bg-slate-100 text-slate-800";
            case "archived": return "bg-red-100 text-red-800";
            default: return "bg-slate-100 text-slate-800";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
                    <p className="text-slate-500">Manage your Expert Brain workflows</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Plus className="w-4 h-4" />
                            New Workflow
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Workflow</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    placeholder="e.g., Claims Processing"
                                    value={newWorkflow.name}
                                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    placeholder="Brief description of what this workflow does"
                                    value={newWorkflow.description}
                                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Trigger Intent</label>
                                <Input
                                    placeholder="e.g., claims_processing"
                                    value={newWorkflow.trigger_intent}
                                    onChange={(e) => setNewWorkflow({ ...newWorkflow, trigger_intent: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Creating..." : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search workflows..."
                    className="flex-1 outline-none text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Trigger Intent</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                    Loading workflows...
                                </TableCell>
                            </TableRow>
                        ) : filteredWorkflows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                    No workflows found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredWorkflows.map((workflow) => (
                                <TableRow key={workflow.id} className="hover:bg-slate-50">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="text-slate-900">{workflow.name}</span>
                                            <span className="text-xs text-slate-500">{workflow.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {workflow.trigger_intent ? (
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {workflow.trigger_intent}
                                            </Badge>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(workflow.status)}>
                                            {workflow.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{workflow.version}</TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {new Date(workflow.updated_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/admin/workflows/${workflow.id}`)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Play className="mr-2 h-4 w-4" />
                                                    Test Run
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => {
                                                        if (confirm("Are you sure you want to delete this workflow?")) {
                                                            deleteMutation.mutate(workflow.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
