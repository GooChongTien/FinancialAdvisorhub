import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { createPageUrl } from "@/admin/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/admin/components/ui/tabs";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Badge } from "@/admin/components/ui/badge";
import { Skeleton } from "@/admin/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import { EntityCustomerForm } from "@/admin/modules/customers/components/EntityCustomerForm";
import { CompanyDetailsCard } from "@/admin/modules/customers/components/CompanyDetailsCard";
import { KeymanDetailsForm } from "@/admin/modules/customers/components/KeymanDetailsForm";
import { EmployeeListUpload } from "@/admin/modules/customers/components/EmployeeListUpload";
import CustomerPortfolio from "@/admin/modules/customers/components/CustomerPortfolio";
import CustomerServicing from "@/admin/modules/customers/components/CustomerServicing";
import CustomerGapAnalysis from "@/admin/modules/customers/components/CustomerGapAnalysis";
import OurJourneyTimeline from "@/admin/modules/customers/components/OurJourneyTimeline";
import { useToast } from "@/admin/components/ui/toast";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/admin/state/PreferencesContext.jsx";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  PencilLine,
  UserRound,
  Upload,
  CalendarPlus,
  Users,
  NotebookText,
} from "lucide-react";

export default function EntityCustomerDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { prefs } = usePreferences();
  const { showToast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const entityId = params.get("id");
  const storageKey = `advisorhub:entity-customer-tab:${entityId ?? "default"}`;
  const employeeStorageKey = `advisorhub:entity-customer:${entityId}:employees`;
  const milestoneStorageKey = `advisorhub:entity-customer-tab:${entityId}:milestone`;

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "overview";
    const stored = window.sessionStorage.getItem(storageKey) ?? "overview";
    return stored === "gap" ? "overview" : stored;
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [keymanDialogOpen, setKeymanDialogOpen] = useState(false);
  const [editingKeymanIndex, setEditingKeymanIndex] = useState(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [employeeRoster, setEmployeeRoster] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.sessionStorage.getItem(employeeStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [milestoneForm, setMilestoneForm] = useState({
    milestone_title: "",
    milestone_date: "",
    milestone_description: "",
    category: "General",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey, activeTab);
  }, [activeTab, storageKey]);

  const { data: customer, isLoading } = useQuery({
    queryKey: ["entity-customer", entityId],
    queryFn: () => adviseUAdminApi.entities.EntityCustomer.getById(entityId),
    enabled: Boolean(entityId),
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["entity-customer-policies", entityId],
    queryFn: () => adviseUAdminApi.entities.Policy.filter({ lead_id: entityId }),
    enabled: Boolean(entityId),
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ["entity-customer-milestones", entityId],
    queryFn: () => adviseUAdminApi.entities.Milestone.list({ lead_id: entityId }),
    enabled: Boolean(entityId),
  });

  const [activeMilestoneId, setActiveMilestoneId] = useState(() => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(milestoneStorageKey) ?? null;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeMilestoneId) {
      window.sessionStorage.setItem(milestoneStorageKey, activeMilestoneId);
    } else {
      window.sessionStorage.removeItem(milestoneStorageKey);
    }
  }, [activeMilestoneId, milestoneStorageKey]);

  useEffect(() => {
    if (customer?.employee_roster && !employeeRoster.length) {
      try {
        const parsed =
          typeof customer.employee_roster === "string"
            ? JSON.parse(customer.employee_roster)
            : customer.employee_roster;
        if (Array.isArray(parsed)) {
          setEmployeeRoster(parsed);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(employeeStorageKey, JSON.stringify(parsed));
          }
        }
      } catch {
        // ignore invalid payloads
      }
    }
  }, [customer, employeeRoster.length, employeeStorageKey]);

  const leadProxy = useMemo(() => {
    if (!customer) return null;
    return {
      ...customer,
      id: customer.id,
      name: customer.company_name || customer.name,
      is_client: true,
      customer_type: "Entity",
    };
  }, [customer]);

  useMiraPageData(
    () => ({
      view: "entity_customer_detail",
      entityId,
      activeTab,
      company: customer?.company_name ?? customer?.name,
    }),
    [entityId, activeTab, customer?.company_name, customer?.name],
  );

  const keymanList = useMemo(() => {
    if (!customer?.keyman_details) return [];
    if (Array.isArray(customer.keyman_details)) return customer.keyman_details;
    if (typeof customer.keyman_details === "string") {
      try {
        const parsed = JSON.parse(customer.keyman_details);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [customer]);

  const normalizedMilestones = useMemo(() => {
    return milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.milestone_title ?? milestone.title,
      description: milestone.milestone_description ?? milestone.description,
      date: milestone.milestone_date ?? milestone.date,
      category: (milestone.category || "general").toLowerCase(),
      status:
        milestone.status ??
        (new Date(milestone.milestone_date) < new Date() ? "completed" : "upcoming"),
      celebrated: milestone.is_celebrated,
      celebrationMethod: milestone.celebration_method,
    }));
  }, [milestones]);

  const updateKeymanMutation = useMutation({
    mutationFn: (nextList) =>
      adviseUAdminApi.entities.EntityCustomer.update(customer.id, {
        keyman_details: nextList,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-customer", entityId] });
      setKeymanDialogOpen(false);
      setEditingKeymanIndex(null);
      showToast({
        type: "success",
        title: "Keyman details saved",
      });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Unable to save keyman",
        description: error?.message ?? "Try again.",
      });
    },
  });

  const updateEmployeeRosterMutation = useMutation({
    mutationFn: async (rows) => {
      if (!customer?.id) {
        throw new Error("Missing entity customer id");
      }
      const payload = {
        employee_roster: rows,
        employee_roster_uploaded_at: new Date().toISOString(),
      };
      return adviseUAdminApi.entities.EntityCustomer.update(customer.id, payload);
    },
    onSuccess: (_, rows) => {
      setEmployeeRoster(rows);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(employeeStorageKey, JSON.stringify(rows));
      }
      queryClient.invalidateQueries({ queryKey: ["entity-customer", entityId] });
      setEmployeeDialogOpen(false);
      showToast({
        type: "success",
        title: "Employee list uploaded",
        description: `${rows.length} employees captured for quick servicing.`,
      });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Unable to save employee roster",
        description: error?.message ?? "Please try again.",
      });
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: (payload) => adviseUAdminApi.entities.Milestone.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-customer-milestones", entityId] });
      setMilestoneForm({
        milestone_title: "",
        milestone_date: "",
        milestone_description: "",
        category: "General",
      });
      setMilestoneDialogOpen(false);
      showToast({
        type: "success",
        title: "Milestone added",
      });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Unable to add milestone",
        description: error?.message ?? "Please try again",
      });
    },
  });

  const handleKeymanSubmit = (values) => {
    const nextList = [...keymanList];
    if (editingKeymanIndex !== null && editingKeymanIndex >= 0) {
      nextList[editingKeymanIndex] = values;
    } else {
      nextList.push(values);
    }
    updateKeymanMutation.mutate(nextList);
  };

  const handleRemoveKeyman = (index) => {
    const nextList = keymanList.filter((_, idx) => idx !== index);
    updateKeymanMutation.mutate(nextList);
  };

  const handleEmployeeUpload = (rows) => {
    updateEmployeeRosterMutation.mutate(rows);
  };

  const handleMilestoneSubmit = () => {
    if (!milestoneForm.milestone_title || !milestoneForm.milestone_date) {
      showToast({
        type: "error",
        title: "Incomplete milestone",
        description: "Title and date are required.",
      });
      return;
    }
    updateMilestoneMutation.mutate({
      lead_id: entityId,
      advisor_id: customer?.advisor_id,
      milestone_title: milestoneForm.milestone_title,
      milestone_description: milestoneForm.milestone_description,
      milestone_date: milestoneForm.milestone_date,
      category: milestoneForm.category,
      milestone_type: milestoneForm.category?.toLowerCase() ?? "general",
    });
  };

  const activeMilestone = useMemo(() => {
    if (!activeMilestoneId) return null;
    return normalizedMilestones.find((item) => item.id === activeMilestoneId) ?? null;
  }, [activeMilestoneId, normalizedMilestones]);

  const renderKeymanCard = useCallback(
    (keyman, index) => (
      <Card key={`${keyman.keyman_name}-${index}`} className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">{keyman.keyman_name}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingKeymanIndex(index);
                  setKeymanDialogOpen(true);
                }}
              >
                <PencilLine className="mr-1 h-4 w-4" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleRemoveKeyman(index)}>
                Remove
              </Button>
            </div>
          </div>
          <p className="text-sm text-slate-500">{keyman.position}</p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span>{keyman.role_in_business || "No role specified"}</span>
          </div>
          <div className="flex items-center gap-2">
            <NotebookText className="h-4 w-4 text-slate-400" />
            <span>
              Coverage:{" "}
              {keyman.coverage_amount
                ? formatCurrency(Number(keyman.coverage_amount) || 0, prefs)
                : "Not set"}
            </span>
          </div>
        </CardContent>
      </Card>
    ),
    [],
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-6 h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Entity customer not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(createPageUrl("EntityCustomers"))}>
          Back to Entity Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => navigate(createPageUrl("EntityCustomers"))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-3">
              <Building2 className="h-10 w-10 text-primary-600" />
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  {customer.company_name || customer.name}
                </h1>
                <p className="text-sm text-slate-500">{customer.business_registration_no}</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                Entity Client
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
              {customer.contact_number ? (
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {customer.contact_number}
                </span>
              ) : null}
              {customer.email ? (
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {customer.email}
                </span>
              ) : null}
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <PencilLine className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="scrollbar-hide overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="servicing">Servicing</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="overview" className="space-y-6">
            <CompanyDetailsCard
              data={customer}
              onEdit={() => setEditDialogOpen(true)}
              className="border-slate-200 shadow-sm"
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex items-center justify-between pb-2">
                  <CardTitle>Keyman Coverage</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingKeymanIndex(null);
                      setKeymanDialogOpen(true);
                    }}
                  >
                    <UserRound className="mr-2 h-4 w-4" />
                    Add Keyman
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {keymanList.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      No keyman captured yet.
                    </div>
                  )}
                  {keymanList.map((keyman, index) => renderKeymanCard(keyman, index))}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex items-center justify-between pb-2">
                  <CardTitle>Employee Coverage</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setEmployeeDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload List
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {employeeRoster.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      Upload a CSV of employees to prefill group servicing requests.
                    </div>
                  ) : (
                    <>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                        {employeeRoster.length} employees stored for this entity.
                      </div>
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100">
                            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Email</th>
                              <th className="px-3 py-2">Role</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeRoster.slice(0, 5).map((employee, index) => (
                              <tr key={`${employee.email}-${index}`} className="border-t border-slate-100">
                                <td className="px-3 py-2">{employee.name || employee.employee_name || "—"}</td>
                                <td className="px-3 py-2 text-slate-500">
                                  {employee.email || employee.work_email || "—"}
                                </td>
                                <td className="px-3 py-2">{employee.role || employee.position || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle>Our Journey</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setMilestoneDialogOpen(true)}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Add Milestone
                </Button>
              </CardHeader>
              <CardContent>
                {milestonesLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <OurJourneyTimeline
                        milestones={normalizedMilestones}
                        activeId={activeMilestoneId}
                        onSelect={(milestone) => setActiveMilestoneId(milestone.id)}
                        emptyMessage="No milestones yet. Capture anniversaries, claims, and wins here."
                      />
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <h3 className="text-base font-semibold text-slate-900">Milestone Detail</h3>
                      {activeMilestone ? (
                        <div className="mt-3 space-y-3 text-sm text-slate-600">
                          <p className="text-slate-900">{activeMilestone.title}</p>
                          <p>{activeMilestone.description || "No description provided"}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(activeMilestone.date).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          Select a milestone to view the details.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <CustomerPortfolio lead={leadProxy} policies={policies} />
          </TabsContent>

          <TabsContent value="servicing">
            <CustomerServicing lead={leadProxy} />
          </TabsContent>

        </Tabs>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Entity Customer</DialogTitle>
          </DialogHeader>
          <EntityCustomerForm
            initialData={customer}
            customerType="Entity"
            onSubmit={(values) => {
              adviseUAdminApi.entities.EntityCustomer.update(customer.id, values).then(
                (updated) => {
                  queryClient.invalidateQueries({ queryKey: ["entity-customer", entityId] });
                  setEditDialogOpen(false);
                  showToast({
                    type: "success",
                    title: "Entity updated",
                    description: `${updated.company_name} saved successfully.`,
                  });
                },
                (error) =>
                  showToast({
                    type: "error",
                    title: "Unable to update",
                    description: error?.message ?? "Please try again.",
                  }),
              );
            }}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={keymanDialogOpen} onOpenChange={setKeymanDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingKeymanIndex !== null ? "Edit Keyman" : "Add Keyman"}</DialogTitle>
          </DialogHeader>
          <KeymanDetailsForm
            initialData={editingKeymanIndex !== null ? keymanList[editingKeymanIndex] : undefined}
            onSubmit={handleKeymanSubmit}
            onCancel={() => {
              setKeymanDialogOpen(false);
              setEditingKeymanIndex(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload Employee List</DialogTitle>
          </DialogHeader>
          <EmployeeListUpload
            requiredColumns={["name", "email", "role"]}
            onUpload={handleEmployeeUpload}
            onCancel={() => setEmployeeDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={milestoneForm.milestone_title}
                onChange={(event) =>
                  setMilestoneForm((prev) => ({ ...prev, milestone_title: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={milestoneForm.milestone_date}
                onChange={(event) =>
                  setMilestoneForm((prev) => ({ ...prev, milestone_date: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={milestoneForm.category}
                onChange={(event) =>
                  setMilestoneForm((prev) => ({ ...prev, category: event.target.value }))
                }
              >
                <option>General</option>
                <option>Policy</option>
                <option>Life Event</option>
                <option>Financial Goal</option>
                <option>Service</option>
                <option>Relationship</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={milestoneForm.milestone_description}
                onChange={(event) =>
                  setMilestoneForm((prev) => ({
                    ...prev,
                    milestone_description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setMilestoneDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMilestoneSubmit} disabled={updateMilestoneMutation.isPending}>
                Save Milestone
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
