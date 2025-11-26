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
import { useTranslation } from "react-i18next";

const STATUS_OPTIONS = ["pending", "in_progress", "completed", "cancelled"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

export default function ServiceRequestDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation();
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
        title: t("serviceRequestDetail.toast.updated"),
      });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: t("serviceRequestDetail.toast.updateError"),
        description: error?.message ?? t("serviceRequestDetail.toast.updateErrorBody"),
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
        <p className="text-slate-500">{t("serviceRequestDetail.notFound")}</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(createPageUrl("ServiceRequests"))}>
          {t("serviceRequestDetail.back")}
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
                <h1 className="text-2xl font-semibold text-slate-900">
                  {request.subject || t("serviceRequests.untitled")}
                </h1>
                <p className="text-sm text-slate-500">
                  {serviceRequestTypes.find((type) => type.id === request.type)?.name ??
                    request.type}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <Badge>
                {t(`serviceRequests.status.${request.status}`, {
                  defaultValue: request.status?.replace("_", " ") ?? "",
                })}
              </Badge>
              <Badge variant="outline">
                {t("serviceRequestDetail.badges.priority", {
                  priority:
                    t(`serviceRequests.priority.${(request.priority || "").toLowerCase()}`, {
                      defaultValue: request.priority,
                    }) || request.priority,
                })}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>{t("serviceRequestDetail.details.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-slate-500">
                    {t("serviceRequestDetail.details.created")}
                  </p>
                  <p className="mt-1 text-base text-slate-900">
                    {request.created_at
                      ? format(new Date(request.created_at), "dd MMM yyyy, h:mm a")
                      : t("serviceRequests.notAvailable")}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">
                    {t("serviceRequestDetail.details.updated")}
                  </p>
                  <p className="mt-1 text-base text-slate-900">
                    {request.updated_at
                      ? format(new Date(request.updated_at), "dd MMM yyyy, h:mm a")
                      : t("serviceRequests.notAvailable")}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">
                  {t("serviceRequestDetail.details.description")}
                </p>
                <p className="mt-1 whitespace-pre-line text-base text-slate-900">
                  {request.payload?.description || t("serviceRequestDetail.details.descriptionEmpty")}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">
                  {t("serviceRequestDetail.details.resolution")}
                </p>
                <p className="mt-1 text-base text-slate-900">
                  {request.resolution_notes || t("serviceRequestDetail.details.resolutionEmpty")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>{t("serviceRequestDetail.customer.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2 text-base text-slate-900">
                {customer?.type === "Entity" ? (
                  <Building2 className="h-4 w-4 text-primary-600" />
                ) : (
                  <User className="h-4 w-4 text-primary-600" />
                )}
                {customer?.name ?? t("serviceRequestDetail.customer.unassigned")}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Badge variant="secondary">
                  {customer?.type ?? t("serviceRequestDetail.customer.unknownType")}
                </Badge>
                {customer?.detailUrl ? (
                  <Button
                    variant="link"
                    className="p-0 text-primary-700"
                    onClick={() => navigate(customer.detailUrl)}
                  >
                    {t("serviceRequestDetail.customer.viewDetail")}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>{t("serviceRequestDetail.update.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {t("serviceRequestDetail.update.status")}
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={statusForm.status}
                  onChange={(event) =>
                    setStatusForm((prev) => ({ ...prev, status: event.target.value }))
                  }
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {t(`serviceRequests.status.${status}`, {
                        defaultValue: status.replace("_", " "),
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {t("serviceRequestDetail.update.priority")}
                </label>
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
              <label className="text-sm font-medium text-slate-700">
                {t("serviceRequestDetail.update.dueDate")}
              </label>
              <Input
                type="date"
                value={statusForm.due_date || ""}
                onChange={(event) =>
                  setStatusForm((prev) => ({ ...prev, due_date: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t("serviceRequestDetail.update.resolutionNotes")}
              </label>
              <Textarea
                rows={4}
                value={statusForm.resolution_notes || ""}
                onChange={(event) =>
                  setStatusForm((prev) => ({ ...prev, resolution_notes: event.target.value }))
                }
                placeholder={t("serviceRequestDetail.update.resolutionPlaceholder")}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleStatusSubmit} disabled={updateMutation.isPending}>
                {t("serviceRequestDetail.update.save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
