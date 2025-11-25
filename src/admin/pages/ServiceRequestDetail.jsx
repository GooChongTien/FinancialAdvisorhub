import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { createPageUrl } from "@/admin/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { Textarea } from "@/admin/components/ui/textarea";
import { Input } from "@/admin/components/ui/input";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { useToast } from "@/admin/components/ui/toast";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import { serviceRequestTypes } from "@/admin/modules/customers/constants/serviceRequestTypes.js";
import { format } from "date-fns";
import { ArrowLeft, ClipboardList, User, Building2 } from "lucide-react";

const STATUS_OPTIONS = ["pending", "in_progress", "completed", "cancelled"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

export default function ServiceRequestDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("id");

  const { data: request, isLoading } = useQuery({
    queryKey: ["service-request", requestId],
    queryFn: () => adviseUAdminApi.entities.ServiceRequest.getById(requestId),
    enabled: Boolean(requestId),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["service-request-leads"],
    queryFn: () => adviseUAdminApi.entities.Lead.list("-updated_at", 200),
  });

  const { data: entityCustomers = [] } = useQuery({
    queryKey: ["service-request-entities"],
    queryFn: () => adviseUAdminApi.entities.EntityCustomer.list(),
  });

  const customerLookup = useMemo(() => {
    const map = new Map();
    leads.forEach((lead) => {
      map.set(lead.id, {
        name: lead.name,
        type: "Individual",
        detailUrl: createPageUrl(`CustomerDetail?id=${lead.id}`),
      });
    });
    entityCustomers.forEach((entity) => {
      map.set(entity.id, {
        name: entity.company_name ?? entity.name,
        type: "Entity",
        detailUrl: createPageUrl(`EntityCustomerDetail?id=${entity.id}`),
      });
    });
    return map;
  }, [leads, entityCustomers]);

  const [statusForm, setStatusForm] = useState({
    status: "pending",
    priority: "Medium",
    due_date: "",
    resolution_notes: "",
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => adviseUAdminApi.entities.ServiceRequest.update(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      showToast({
        type: "success",
        title: "Service request updated",
      });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Unable to update request",
        description: error?.message ?? "Please try again.",
      });
    },
  });

  useMiraPageData(
    () => ({
      view: "service_request_detail",
      requestId,
      status: request?.status,
      priority: request?.priority,
    }),
    [requestId, request?.status, request?.priority],
  );

  useEffect(() => {
    if (!request) return;
    setStatusForm({
      status: request.status ?? "pending",
      priority: request.priority ?? "Medium",
      due_date: request.due_date ?? "",
      resolution_notes: request.resolution_notes ?? "",
    });
  }, [request]);

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-6 h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Service request not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(createPageUrl("ServiceRequests"))}>
          Back to Service Requests
        </Button>
      </div>
    );
  }

  const customer = customerLookup.get(request.lead_id);

  const handleStatusSubmit = () => {
    updateMutation.mutate(statusForm);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("ServiceRequests"))}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-10 w-10 text-primary-600" />
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{request.subject}</h1>
                <p className="text-sm text-slate-500">
                  {serviceRequestTypes.find((type) => type.id === request.type)?.name ??
                    request.type}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <Badge>{request.status.replace("_", " ")}</Badge>
              <Badge variant="outline">Priority: {request.priority}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-slate-500">Created</p>
                  <p className="mt-1 text-base text-slate-900">
                    {request.created_at
                      ? format(new Date(request.created_at), "dd MMM yyyy, h:mm a")
                      : "Unavailable"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Last Updated</p>
                  <p className="mt-1 text-base text-slate-900">
                    {request.updated_at
                      ? format(new Date(request.updated_at), "dd MMM yyyy, h:mm a")
                      : "Unavailable"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Description</p>
                <p className="mt-1 whitespace-pre-line text-base text-slate-900">
                  {request.payload?.description || "No description provided."}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Resolution Notes</p>
                <p className="mt-1 text-base text-slate-900">
                  {request.resolution_notes || "Not resolved yet."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2 text-base text-slate-900">
                {customer?.type === "Entity" ? (
                  <Building2 className="h-4 w-4 text-primary-600" />
                ) : (
                  <User className="h-4 w-4 text-primary-600" />
                )}
                {customer?.name ?? "Unassigned"}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Badge variant="secondary">{customer?.type ?? "Unknown"}</Badge>
                {customer?.detailUrl ? (
                  <Button
                    variant="link"
                    className="p-0 text-primary-700"
                    onClick={() => navigate(customer.detailUrl)}
                  >
                    View Detail
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={statusForm.status}
                  onChange={(event) =>
                    setStatusForm((prev) => ({ ...prev, status: event.target.value }))
                  }
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Priority</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={statusForm.priority}
                  onChange={(event) =>
                    setStatusForm((prev) => ({ ...prev, priority: event.target.value }))
                  }
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Due Date</label>
              <Input
                type="date"
                value={statusForm.due_date || ""}
                onChange={(event) =>
                  setStatusForm((prev) => ({ ...prev, due_date: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Resolution Notes</label>
              <Textarea
                rows={4}
                value={statusForm.resolution_notes || ""}
                onChange={(event) =>
                  setStatusForm((prev) => ({ ...prev, resolution_notes: event.target.value }))
                }
                placeholder="Document how the request was resolved."
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleStatusSubmit} disabled={updateMutation.isPending}>
                Save Update
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
