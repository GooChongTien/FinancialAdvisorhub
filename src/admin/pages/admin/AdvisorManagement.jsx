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
import { Calendar, Edit, Mail, Search, Shield, UserPlus } from "lucide-react";
import { useState } from "react";

async function fetchAdvisors() {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
}

async function updateAdvisor({ id, updates }) {
    const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

async function inviteUser({ email, full_name, role }) {
    // Use Supabase Admin API to invite user
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
            full_name,
            role: role || "advisor",
        },
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export default function AdvisorManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAdvisor, setSelectedAdvisor] = useState(null);
    const [roleFilter, setRoleFilter] = useState("all");
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        email: "",
        full_name: "",
        role: "advisor",
    });
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const { data: advisors = [], isLoading, error } = useQuery({
        queryKey: ["advisors"],
        queryFn: fetchAdvisors,
        staleTime: 30_000,
    });

    const updateMutation = useMutation({
        mutationFn: updateAdvisor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["advisors"] });
            setSelectedAdvisor(null);
            showToast({ type: "success", title: "User updated successfully" });
        },
        onError: (error) => {
            showToast({ type: "error", title: "Failed to update user", description: error.message });
        },
    });

    const inviteMutation = useMutation({
        mutationFn: inviteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["advisors"] });
            setIsInviteDialogOpen(false);
            setInviteForm({ email: "", full_name: "", role: "advisor" });
            showToast({
                type: "success",
                title: "Invitation sent",
                description: "User will receive an email to set up their account",
            });
        },
        onError: (error) => {
            showToast({ type: "error", title: "Failed to invite user", description: error.message });
        },
    });

    const roles = ["all", "admin", "advisor"];

    const filteredAdvisors = advisors.filter((advisor) => {
        const matchesSearch =
            advisor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            advisor.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || advisor.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("en-SG", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="flex h-full flex-col bg-neutral-50">
            {/* Header */}
            <div className="border-b border-neutral-200 bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Advisor Management</h1>
                        <p className="text-sm text-neutral-600 mt-1">
                            Manage user accounts and permissions
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {advisors.length} users
                        </Badge>
                        <Button size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="mt-4 flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-neutral-500" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {role === "all" ? "All Roles" : role}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Advisors Table */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-sm text-neutral-500">Loading users...</div>
                    </div>
                ) : error ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-sm text-red-600">Error loading users: {error.message}</div>
                    </div>
                ) : filteredAdvisors.length === 0 ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-center">
                            <Shield className="mx-auto h-12 w-12 text-neutral-400" />
                            <p className="mt-2 text-sm text-neutral-500">No users found</p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAdvisors.map((advisor) => (
                                    <TableRow
                                        key={advisor.id}
                                        className="cursor-pointer hover:bg-neutral-50"
                                        onClick={() => setSelectedAdvisor(advisor)}
                                    >
                                        <TableCell className="font-medium">
                                            {advisor.full_name || "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-neutral-600">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3 w-3 text-neutral-400" />
                                                {advisor.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={advisor.role === "admin" ? "default" : "outline"}
                                                className="text-xs"
                                            >
                                                {advisor.role || "advisor"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={advisor.account_status === "Active" ? "success" : "secondary"}
                                                className="text-xs"
                                            >
                                                {advisor.account_status || "Active"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-neutral-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-neutral-400" />
                                                {formatDate(advisor.created_at)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedAdvisor(advisor);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Advisor Details Sheet */}
            <Sheet open={!!selectedAdvisor} onOpenChange={(open) => !open && setSelectedAdvisor(null)}>
                <SheetContent className="w-[600px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{selectedAdvisor?.full_name || "User Details"}</SheetTitle>
                        <SheetDescription>Manage user profile and permissions</SheetDescription>
                    </SheetHeader>

                    {selectedAdvisor && (
                        <div className="mt-6 space-y-6">
                            {/* Profile Info */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Email</h3>
                                    <p className="mt-1 text-sm text-neutral-600">{selectedAdvisor.email}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Role</h3>
                                    <div className="mt-2 flex gap-2">
                                        {["admin", "advisor"].map((role) => (
                                            <Button
                                                key={role}
                                                size="sm"
                                                variant={selectedAdvisor.role === role ? "default" : "outline"}
                                                onClick={() => {
                                                    updateMutation.mutate({
                                                        id: selectedAdvisor.id,
                                                        updates: { role },
                                                    });
                                                }}
                                            >
                                                {role}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Account Status</h3>
                                    <div className="mt-2 flex gap-2">
                                        {["Active", "Inactive"].map((status) => (
                                            <Button
                                                key={status}
                                                size="sm"
                                                variant={selectedAdvisor.account_status === status ? "default" : "outline"}
                                                onClick={() => {
                                                    updateMutation.mutate({
                                                        id: selectedAdvisor.id,
                                                        updates: { account_status: status },
                                                    });
                                                }}
                                            >
                                                {status}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Member Since</h3>
                                    <p className="mt-1 text-sm text-neutral-600">
                                        {formatDate(selectedAdvisor.created_at)}
                                    </p>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
                                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Metadata</h3>
                                <pre className="overflow-x-auto text-xs text-neutral-700">
                                    {JSON.stringify(
                                        {
                                            id: selectedAdvisor.id,
                                            created_at: selectedAdvisor.created_at,
                                            updated_at: selectedAdvisor.updated_at,
                                        },
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>

                            {updateMutation.error && (
                                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                                    <h4 className="text-sm font-semibold text-red-900">Error</h4>
                                    <p className="mt-1 text-xs text-red-800">{updateMutation.error.message}</p>
                                </div>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Invite User Dialog */}
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite New User</DialogTitle>
                        <DialogDescription>
                            Send an invitation email to a new user. They will receive a link to set up their account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="email"
                                value={inviteForm.email}
                                onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                                placeholder="user@example.com"
                                className="text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Full Name</label>
                            <Input
                                value={inviteForm.full_name}
                                onChange={(e) => setInviteForm((prev) => ({ ...prev, full_name: e.target.value }))}
                                placeholder="John Doe"
                                className="text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Role</label>
                            <select
                                value={inviteForm.role}
                                onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value }))}
                                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                                <option value="advisor">Advisor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsInviteDialogOpen(false)}
                            disabled={inviteMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => inviteMutation.mutate(inviteForm)}
                            disabled={!inviteForm.email || inviteMutation.isPending}
                        >
                            {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
