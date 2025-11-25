import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { Skeleton } from "@/admin/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { EntityCustomerForm } from "@/admin/modules/customers/components/EntityCustomerForm";
import { CompanyDetailsCard } from "@/admin/modules/customers/components/CompanyDetailsCard";
import { useToast } from "@/admin/components/ui/toast";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import {
  Building2,
  Users,
  Factory,
  Filter,
  PencilLine,
  Plus,
} from "lucide-react";

export default function EntityCustomers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const storageKeys = {
    search: "advisorhub:entity-customers:search",
    industry: "advisorhub:entity-customers:industry",
    size: "advisorhub:entity-customers:size",
  };

  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(storageKeys.search) ?? "";
  });
  const [industryFilter, setIndustryFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    return window.sessionStorage.getItem(storageKeys.industry) ?? "all";
  });
  const [sizeFilter, setSizeFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    return window.sessionStorage.getItem(storageKeys.size) ?? "all";
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKeys.search, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKeys.industry, industryFilter);
  }, [industryFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKeys.size, sizeFilter);
  }, [sizeFilter]);

  const { data: entityCustomers = [], isLoading } = useQuery({
    queryKey: ["entity-customers"],
    queryFn: () => adviseUAdminApi.entities.EntityCustomer.list(),
  });

  const industries = useMemo(() => {
    const list = Array.from(
      new Set(
        entityCustomers
          .map((customer) => customer.industry)
          .filter(Boolean)
          .map((value) => value.trim()),
      ),
    ).sort((a, b) => a.localeCompare(b));
    return list;
  }, [entityCustomers]);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return entityCustomers
      .filter((customer) => {
        if (normalizedSearch) {
          const fields = [
            customer.company_name,
            customer.business_registration_no,
            customer.name,
            customer.contact_number,
          ]
            .filter(Boolean)
            .map((value) => String(value).toLowerCase());
          const matches = fields.some((field) => field.includes(normalizedSearch));
          if (!matches) {
            return false;
          }
        }

        if (industryFilter !== "all" && customer.industry !== industryFilter) {
          return false;
        }

        if (sizeFilter !== "all") {
          const employees = Number(customer.num_employees || 0);
          if (sizeFilter === "lt50" && employees >= 50) return false;
          if (sizeFilter === "50_200" && (employees < 50 || employees > 200)) return false;
          if (sizeFilter === "gt200" && employees <= 200) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const left = a.updated_at ?? a.created_at ?? "";
        const right = b.updated_at ?? b.created_at ?? "";
        return right.localeCompare(left);
      });
  }, [entityCustomers, industryFilter, searchTerm, sizeFilter]);

  const dialogTitle = editingCustomer ? "Edit Entity Customer" : "New Entity Customer";

  const mutation = useMutation({
    mutationFn: async (values) => {
      if (editingCustomer) {
        return adviseUAdminApi.entities.EntityCustomer.update(editingCustomer.id, values);
      }
      return adviseUAdminApi.entities.EntityCustomer.create(values);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["entity-customers"] });
      setDialogOpen(false);
      setEditingCustomer(null);
      showToast({
        type: "success",
        title: editingCustomer ? "Customer updated" : "Customer created",
        description: `${result?.company_name ?? "Entity customer"} saved successfully.`,
      });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Unable to save customer",
        description: error?.message ?? "Please try again.",
      });
    },
  });

  const handleCreate = () => {
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  useMiraPageData(
    () => ({
      view: "entity_customer_list",
      searchTerm,
      industryFilter,
      sizeFilter,
      resultCount: filteredCustomers.length,
    }),
    [searchTerm, industryFilter, sizeFilter, filteredCustomers.length],
  );

  const summaryStats = useMemo(() => {
    const totalEmployees = entityCustomers.reduce(
      (acc, customer) => acc + (Number(customer.num_employees) || 0),
      0,
    );
    const totalRevenue = entityCustomers.reduce(
      (acc, customer) => acc + (Number(customer.annual_revenue) || 0),
      0,
    );
    return {
      count: entityCustomers.length,
      employees: totalEmployees,
      revenue: totalRevenue,
    };
  }, [entityCustomers]);

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Entity Customers"
        subtitle="Manage your corporate relationships and keyman coverage"
        icon={Building2}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Entity Customer
          </Button>
        }
      />

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-500">Search</label>
            <div className="relative">
              <Input
                placeholder="Search by company, BRN, or contact"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-3"
              />
              <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">Industry</label>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="All industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">
                Company size
              </label>
              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="All sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sizes</SelectItem>
                  <SelectItem value="lt50">&lt; 50 employees</SelectItem>
                  <SelectItem value="50_200">50 - 200 employees</SelectItem>
                  <SelectItem value="gt200">&gt; 200 employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm text-slate-500">Total companies</p>
              <p className="text-2xl font-bold text-slate-900">{summaryStats.count}</p>
            </div>
            <div className="rounded-full bg-primary-50 p-3 text-primary-600">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm text-slate-500">Employees covered</p>
              <p className="text-2xl font-bold text-slate-900">
                {summaryStats.employees.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-slate-50 p-3 text-slate-700">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm text-slate-500">Est. annual revenue</p>
              <p className="text-2xl font-bold text-slate-900">
                {summaryStats.revenue > 0
                  ? `SGD ${Math.round(summaryStats.revenue).toLocaleString()}`
                  : "—"}
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
              <Factory className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-slate-50 py-16 text-center shadow-none">
          <CardContent>
            <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900">No entity customers yet</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              Use the “Add Entity Customer” button to onboard a company client. Once created, you
              can manage keyman coverage, employee enrollment, and service requests from their
              detail page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    {customer.company_name || customer.name}
                  </CardTitle>
                  <p className="text-sm text-slate-500">{customer.business_registration_no}</p>
                </div>
                <div className="flex gap-2">
                  {customer.industry ? (
                    <Badge variant="secondary">{customer.industry}</Badge>
                  ) : null}
                  <Badge variant="outline">
                    {customer.num_employees ? `${customer.num_employees} employees` : "Size n/a"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <CompanyDetailsCard data={customer} />
                <div className="flex flex-wrap justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(createPageUrl(`EntityCustomerDetail?id=${customer.id}`))
                    }
                  >
                    View Detail
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(customer)}
                    className="text-primary-600"
                  >
                    <PencilLine className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingCustomer(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <EntityCustomerForm
            initialData={editingCustomer}
            customerType="Entity"
            onSubmit={(values) => mutation.mutate({ ...values, customer_type: "Entity" })}
            onCancel={() => {
              setDialogOpen(false);
              setEditingCustomer(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
