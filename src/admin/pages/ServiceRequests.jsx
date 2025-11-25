import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import { Input } from "@/admin/components/ui/input";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/admin/components/ui/popover";
import SearchFilterBar from "@/admin/components/ui/search-filter-bar.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { Textarea } from "@/admin/components/ui/textarea";
import { useToast } from "@/admin/components/ui/toast";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import { serviceRequestTypes } from "@/admin/modules/customers/constants/serviceRequestTypes.js";
import { createPageUrl } from "@/admin/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ClipboardList, Filter, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const STATUS_BADGE_MAP = {
  pending: "bg-amber-50 text-amber-700 border border-amber-100",
  in_progress: "bg-sky-50 text-sky-700 border border-sky-100",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  cancelled: "bg-slate-100 text-slate-600 border border-slate-200",
};

const PRIORITY_BADGE_MAP = {
  Low: "bg-slate-100 text-slate-600 border border-slate-200",
  Medium: "bg-blue-50 text-blue-700 border border-blue-100",
  High: "bg-orange-50 text-orange-700 border border-orange-100",
  Urgent: "bg-red-50 text-red-700 border border-red-100",
};

export default function ServiceRequests() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const storageKeys = {
    search: "advisorhub:service-requests:search",
    status: "advisorhub:service-requests:status",
    type: "advisorhub:service-requests:type",
  };

  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(storageKeys.search) ?? "";
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    return window.sessionStorage.getItem(storageKeys.status) ?? "all";
  });
  const [typeFilter, setTypeFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    return window.sessionStorage.getItem(storageKeys.type) ?? "all";
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    serviceType: "",
    subject: "",
    description: "",
    priority: "Medium",
    due_date: "",
    source_channel: "Portal",
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["service-requests"],
    queryFn: () => adviseUAdminApi.entities.ServiceRequest.list(),
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
        type: lead.customer_type ?? "Individual",
      });
    });
    entityCustomers.forEach((entity) => {
      map.set(entity.id, {
        name: entity.company_name ?? entity.name,
        type: "Entity",
      });
    });
    return map;
  }, [leads, entityCustomers]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return requests
      .filter((request) => {
        if (normalizedSearch) {
          const subject = request.subject?.toLowerCase() ?? "";
          const customerName = customerLookup.get(request.lead_id)?.name?.toLowerCase() ?? "";
          const matches =
            subject.includes(normalizedSearch) || customerName.includes(normalizedSearch);
          if (!matches) {
            return false;
          }
        }
        if (statusFilter !== "all" && request.status !== statusFilter) return false;
        if (typeFilter !== "all" && request.type !== typeFilter) return false;
        return true;
      })
      .sort((a, b) => (b.updated_at || b.created_at || "").localeCompare(a.updated_at || a.created_at || ""));
  }, [requests, searchTerm, statusFilter, typeFilter, customerLookup]);

  const selectedCustomerType = customerLookup.get(formData.customerId)?.type || null;
  const filteredServiceTypes = useMemo(
    () =>
      serviceRequestTypes.filter(
        (type) => !type.target || type.target.toLowerCase() === (selectedCustomerType || "").toLowerCase(),
      ),
    [selectedCustomerType],
  );

  useEffect(() => {
    if (formData.serviceType) {
      const stillValid = filteredServiceTypes.some((t) => t.id === formData.serviceType);
      if (!stillValid) {
        setFormData((prev) => ({ ...prev, serviceType: "" }));
      }
    }
  }, [filteredServiceTypes, formData.serviceType]);

  const mutation = useMutation({
    mutationFn: (payload) => adviseUAdminApi.entities.ServiceRequest.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      setDialogOpen(false);
      setFormData({
        customerId: "",
        serviceType: "",
        subject: "",
        description: "",
        priority: "Medium",
        due_date: "",
        source_channel: "Portal",
      });
      showToast({
        type: "success",
        title: t("serviceRequests.createdToast"),
      });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: t("serviceRequests.createErrorTitle"),
        description: error?.message ?? t("serviceRequests.createErrorBody"),
      });
    },
  });

  const handleCreateRequest = () => {
    if (!formData.customerId || !formData.serviceType || !formData.subject) {
      showToast({
        type: "error",
        title: t("serviceRequests.missingDetails"),
        description: t("serviceRequests.missingDetailsBody"),
      });
      return;
    }

    const targetCustomer = customerLookup.get(formData.customerId);
    mutation.mutate({
      lead_id: formData.customerId,
      type: formData.serviceType,
      status: "pending",
      subject: formData.subject,
      priority: formData.priority,
      due_date: formData.due_date || null,
      source_channel: formData.source_channel,
      payload: {
        description: formData.description,
        customer_type: targetCustomer?.type ?? "Individual",
        customer_name: targetCustomer?.name ?? "",
      },
    });
  };

  useMiraPageData(
    () => ({
      view: "service_request_list",
      filters: { searchTerm, statusFilter, typeFilter },
      total: requests.length,
      filtered: filteredRequests.length,
    }),
    [searchTerm, statusFilter, typeFilter, requests.length, filteredRequests.length],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-20 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-200 space-y-6">
          <PageHeader
            title={t("serviceRequests.title")}
            subtitle={t("serviceRequests.subtitle")}
            icon={ClipboardList}
            className="mb-0"
            actions={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("serviceRequests.newRequest")}
              </Button>
            }
          />

          <SearchFilterBar
            searchValue={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              if (typeof window !== "undefined") {
                window.sessionStorage.setItem(storageKeys.search, value);
              }
            }}
            placeholder={t("serviceRequests.searchPlaceholder")}
            filterButton={
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={statusFilter !== "all" || typeFilter !== "all" ? "default" : "outline"}
                    size="icon"
                    className={statusFilter !== "all" || typeFilter !== "all" ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
                    title={t("serviceRequests.filter")}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 mb-3">{t("serviceRequests.filterStatus")}</h4>
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                          setStatusFilter(value);
                          if (typeof window !== "undefined") {
                            window.sessionStorage.setItem(storageKeys.status, value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("serviceRequests.allStatuses")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("serviceRequests.allStatuses")}</SelectItem>
                          <SelectItem value="pending">{t("serviceRequests.status.pending")}</SelectItem>
                          <SelectItem value="in_progress">{t("serviceRequests.status.in_progress")}</SelectItem>
                          <SelectItem value="completed">{t("serviceRequests.status.completed")}</SelectItem>
                          <SelectItem value="cancelled">{t("serviceRequests.status.cancelled")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 mb-3">{t("serviceRequests.filterType")}</h4>
                      <Select
                        value={typeFilter}
                        onValueChange={(value) => {
                          setTypeFilter(value);
                          if (typeof window !== "undefined") {
                            window.sessionStorage.setItem(storageKeys.type, value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("serviceRequests.allTypes")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("serviceRequests.allTypes")}</SelectItem>
                          {serviceRequestTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            }
          />
        </div>

        {/* Service Requests List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-slate-50 py-16 text-center shadow-none">
              <CardContent>
                <ClipboardList className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900">{t("serviceRequests.emptyTitle")}</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                  {t("serviceRequests.emptyBody")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const customer = customerLookup.get(request.lead_id);
                const createdAt = request.created_at
                  ? format(new Date(request.created_at), "dd MMM yyyy, h:mm a")
                  : t("serviceRequests.notAvailable");
                const dueDate = request.due_date
                  ? format(new Date(request.due_date), "dd MMM yyyy")
                  : t("serviceRequests.noDueDate");

                return (
                  <Card
                    key={request.id}
                    className="cursor-pointer border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                    onClick={() => navigate(createPageUrl(`ServiceRequestDetail?id=${request.id}`))}
                  >
                    <CardHeader className="flex flex-col space-y-2 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          {request.subject || t("serviceRequests.untitled")}
                        </CardTitle>
                        <Badge
                          className={
                            STATUS_BADGE_MAP[request.status] ??
                            "bg-slate-100 text-slate-600 border border-slate-200"
                          }
                        >
                          {t(`serviceRequests.status.${request.status}`)}
                        </Badge>
                        <Badge
                          className={
                            PRIORITY_BADGE_MAP[request.priority] ??
                            "bg-slate-100 text-slate-600 border border-slate-200"
                          }
                        >
                          {t("serviceRequests.priorityLabel", { priority: request.priority })}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {serviceRequestTypes.find((type) => type.id === request.type)?.name ??
                          request.type}
                        {" · "}
                        {customer?.name || t("serviceRequests.unassignedCustomer")}
                      </p>
                    </CardHeader>
                    <CardContent className="grid gap-4 py-4 text-sm text-slate-600 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase text-slate-500">{t("serviceRequests.createdLabel")}</p>
                        <p className="mt-1 font-medium text-slate-900">{createdAt}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-500">{t("serviceRequests.dueDateLabel")}</p>
                        <p className="mt-1 font-medium text-slate-900">{dueDate}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-500">{t("serviceRequests.channelLabel")}</p>
                        <p className="mt-1 font-medium capitalize text-slate-900">
                          {request.source_channel || t("serviceRequests.channelDefault")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{t("serviceRequests.newRequest")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{t("serviceRequests.form.customer")}</label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, customerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("serviceRequests.form.selectCustomer")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("serviceRequests.form.selectCustomer")}</SelectItem>
                      <SelectItem disabled className="text-xs uppercase text-slate-400">
                        {t("serviceRequests.form.individualGroup")}
                      </SelectItem>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.name}
                        </SelectItem>
                      ))}
                      <SelectItem disabled className="text-xs uppercase text-slate-400">
                        {t("serviceRequests.form.entityGroup")}
                      </SelectItem>
                      {entityCustomers.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.company_name || entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{t("serviceRequests.form.serviceType")}</label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, serviceType: value }))}
                  >
                    <SelectTrigger>
                    <SelectValue placeholder={t("serviceRequests.form.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredServiceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{t("serviceRequests.form.subject")}</label>
                  <Input
                    value={formData.subject}
                    onChange={(event) => setFormData((prev) => ({ ...prev, subject: event.target.value }))}
                    placeholder={t("serviceRequests.form.subjectPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{t("serviceRequests.form.description")}</label>
                  <Textarea
                    rows={4}
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder={t("serviceRequests.form.descriptionPlaceholder")}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">{t("serviceRequests.form.priority")}</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("serviceRequests.form.selectPriority")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">{t("serviceRequests.priority.low")}</SelectItem>
                        <SelectItem value="Medium">{t("serviceRequests.priority.medium")}</SelectItem>
                        <SelectItem value="High">{t("serviceRequests.priority.high")}</SelectItem>
                        <SelectItem value="Urgent">{t("serviceRequests.priority.urgent")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">{t("serviceRequests.form.dueDate")}</label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(event) => setFormData((prev) => ({ ...prev, due_date: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleCreateRequest} disabled={mutation.isPending}>
                    {t("serviceRequests.create")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
