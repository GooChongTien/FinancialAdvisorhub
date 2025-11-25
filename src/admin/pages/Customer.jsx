import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent } from "@/admin/components/ui/card";
import { Label } from "@/admin/components/ui/label";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/admin/components/ui/popover";
import SearchFilterBar from "@/admin/components/ui/search-filter-bar.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Skeleton } from "@/admin/components/ui/skeleton";
import TemperatureBadge from "@/admin/components/ui/TemperatureBadge.jsx";
import { useToast } from "@/admin/components/ui/toast";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import useMiraPopupListener from "@/admin/hooks/useMiraPopupListener.js";
import AddEventDialog from "@/admin/modules/customers/components/AddEventDialog";
import NewLeadDialog from "@/admin/modules/customers/components/NewLeadDialog";
import { usePreferences } from "@/admin/state/PreferencesContext.jsx";
import { createPageUrl } from "@/admin/utils";
import { calculateCustomerTemperature } from "@/lib/customer-temperature";
import { MIRA_POPUP_TARGETS } from "@/lib/mira/popupTargets.ts";
import { MIRA_PREFILL_TARGETS, matchesPrefillTarget, resolvePrefillTarget } from "@/lib/mira/prefillTargets.ts";
import { formatCurrency } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, format } from "date-fns";
import {
  ArrowUpDown,
  Building2,
  FileText,
  Filter,
  Mail,
  Phone,
  Plus,
  Users,
  X
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Customer() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { prefs } = usePreferences();
  const storageKeys = {
    search: "advisorhub:customers-search",
    customerType: "advisorhub:customers-customer-type",
    source: "advisorhub:customers-source",
    createdStart: "advisorhub:customers-created-start",
    createdEnd: "advisorhub:customers-created-end",
    lastContacted: "advisorhub:customers-last-contacted",
    relationship: "advisorhub:customers-relationship",
    temperature: "advisorhub:customers-temperature",
    sort: "advisorhub:customers-sort",
    filtersCollapsed: "advisorhub:customers-filters-collapsed",
  };

  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(storageKeys.search) ?? "";
  });
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);
  const [customerTypeFilter, setCustomerTypeFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    return window.sessionStorage.getItem(storageKeys.customerType) ?? "all";
  });
  const [sourceFilter, setSourceFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    return window.sessionStorage.getItem(storageKeys.source) ?? "all";
  });
  const [createdDateStart, setCreatedDateStart] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(storageKeys.createdStart) ?? "";
  });
  const [createdDateEnd, setCreatedDateEnd] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(storageKeys.createdEnd) ?? "";
  });
  const [lastContactedFilter, setLastContactedFilter] = useState(() => {
    if (typeof window === "undefined") return "any";
    return window.sessionStorage.getItem(storageKeys.lastContacted) ?? "any";
  });
  const [relationshipFilter, setRelationshipFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    return window.sessionStorage.getItem(storageKeys.relationship) ?? "all";
  });
  const [temperatureFilter, setTemperatureFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    return window.sessionStorage.getItem(storageKeys.temperature) ?? "all";
  });
  const [sortOrder, setSortOrder] = useState(() => {
    if (typeof window === "undefined") return "lastContacted";
    return window.sessionStorage.getItem(storageKeys.sort) ?? "lastContacted";
  });
  const [leadForScheduling, setLeadForScheduling] = useState(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [pendingLead, setPendingLead] = useState(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(storageKeys.filtersCollapsed) === "true";
  });
  const { showToast } = useToast();
  const autoLeadDialogRef = useRef({ correlationId: null, autoOpened: false });
  const dialogOpenRef = useRef(showNewLeadDialog);

  const launchAutoLeadDialog = useCallback((correlationId) => {
    if (!correlationId) return;
    const autoOpened = !dialogOpenRef.current;
    autoLeadDialogRef.current = { correlationId, autoOpened };
    if (!dialogOpenRef.current) {
      setShowNewLeadDialog(true);
    }
  }, []);

  useEffect(() => {
    dialogOpenRef.current = showNewLeadDialog;
    if (!showNewLeadDialog) {
      autoLeadDialogRef.current = { correlationId: null, autoOpened: false };
    }
  }, [showNewLeadDialog]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKeys.search, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKeys.customerType, customerTypeFilter);
  }, [customerTypeFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKeys.source, sourceFilter);
  }, [sourceFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (createdDateStart) {
      window.sessionStorage.setItem(storageKeys.createdStart, createdDateStart);
    } else {
      window.sessionStorage.removeItem(storageKeys.createdStart);
    }
  }, [createdDateStart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (createdDateEnd) {
      window.sessionStorage.setItem(storageKeys.createdEnd, createdDateEnd);
    } else {
      window.sessionStorage.removeItem(storageKeys.createdEnd);
    }
  }, [createdDateEnd]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      storageKeys.lastContacted,
      lastContactedFilter,
    );
  }, [lastContactedFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      storageKeys.relationship,
      relationshipFilter,
    );
  }, [relationshipFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      storageKeys.temperature,
      temperatureFilter,
    );
  }, [temperatureFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKeys.sort, sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      storageKeys.filtersCollapsed,
      filtersCollapsed ? "true" : "false",
    );
  }, [filtersCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onPrefill = (event) => {
      const detail = event?.detail ?? {};
      const action = detail?.action ?? null;
      if (!action) return;
      const target = resolvePrefillTarget(action);
      if (!matchesPrefillTarget(target, MIRA_PREFILL_TARGETS.NEW_LEAD_FORM)) return;
      const correlationId = detail?.correlationId ?? action?.correlationId ?? action?.id ?? null;
      launchAutoLeadDialog(correlationId);
    };
    window.addEventListener("mira:prefill", onPrefill);
    return () => {
      window.removeEventListener("mira:prefill", onPrefill);
    };
  }, [launchAutoLeadDialog]);

  useMiraPopupListener(MIRA_POPUP_TARGETS.NEW_LEAD_FORM, ({ correlationId }) => {
    launchAutoLeadDialog(correlationId);
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onUndo = (event) => {
      const id = event?.detail?.id;
      if (!id) return;
      const info = autoLeadDialogRef.current;
      if (!info || info.correlationId !== id) return;
      if (info.autoOpened) {
        setShowNewLeadDialog(false);
      }
      autoLeadDialogRef.current = { correlationId: null, autoOpened: false };
    };
    window.addEventListener("mira:auto-actions:undo", onUndo);
    return () => window.removeEventListener("mira:auto-actions:undo", onUndo);
  }, []);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => adviseUAdminApi.entities.Lead.list("-updated_date"),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => adviseUAdminApi.entities.Task.list("-date"),
  });

  const totalLeads = leads?.length ?? 0;

  // Simple in-memory pagination for large lists
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useMiraPageData(
    () => ({
      view: "customer_list",
      searchTerm,
      customerTypeFilter,
      sourceFilter,
      lastContactedFilter,
      relationshipFilter,
      temperatureFilter,
      sortOrder,
      filtersCollapsed,
      visibleCount,
      totalLeads,
    }),
    [
      searchTerm,
      customerTypeFilter,
      sourceFilter,
      lastContactedFilter,
      relationshipFilter,
      temperatureFilter,
      sortOrder,
      filtersCollapsed,
      visibleCount,
      totalLeads,
    ],
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "new") {
      setShowNewLeadDialog(true);
    }

    const preset = params.get("preset");

    let relationshipParam = params.get("relationship");
    // Accept singular alias `lead` for `leads`
    if (relationshipParam === "lead") relationshipParam = "leads";
    const allowedRelationships = new Set(["all", "clients", "leads"]);
    if (relationshipParam && allowedRelationships.has(relationshipParam)) {
      if (relationshipParam !== relationshipFilter) {
        setRelationshipFilter(relationshipParam);
      }
    } else if (preset === "hot-leads" && relationshipFilter !== "all") {
      setRelationshipFilter("all");
    }

    let lastContactTarget = params.get("lastContacted");
    const allowedLastContact = new Set([
      "any",
      "7",
      "30",
      "over30",
      "never",
    ]);
    if (preset === "hot-leads" && !lastContactTarget) {
      lastContactTarget = "7";
    }
    if (
      lastContactTarget &&
      allowedLastContact.has(lastContactTarget) &&
      lastContactTarget !== lastContactedFilter
    ) {
      setLastContactedFilter(lastContactTarget);
    }

    let sortTarget = params.get("sort");
    const allowedSorts = new Set(["lastContacted", "name", "nextAppointment"]);
    if (preset === "hot-leads" && !sortTarget) {
      sortTarget = "lastContacted";
    }
    if (
      sortTarget &&
      allowedSorts.has(sortTarget) &&
      sortTarget !== sortOrder
    ) {
      setSortOrder(sortTarget);
    }

    // Optional temperature alias: map to lastContacted filter
    const temperatureParam = params.get("temperature");
    if (temperatureParam) {
      const map = { hot: "7", warm: "30", cool: "over30", cold: "over30" };
      const mapped = map[String(temperatureParam).toLowerCase()];
      if (mapped && mapped !== lastContactedFilter) {
        setLastContactedFilter(mapped);
      }
    }

    if (preset === "hot-leads") {
      if (sourceFilter !== "all") {
        setSourceFilter("all");
      }
    }
  }, [
    location,
    lastContactedFilter,
    relationshipFilter,
    sortOrder,
    sourceFilter,
  ]);

  const createLeadMutation = useMutation({
    mutationFn: ({ payload }) => adviseUAdminApi.entities.Lead.create(payload),
    onSuccess: (newLead, variables) => {
      queryClient.invalidateQueries(["leads"]);
      const leadName = newLead?.name ?? t("customers.toasts.fallbackName");
      showToast({
        type: "success",
        title: t("customers.toasts.createTitle"),
        description: t("customers.toasts.createDescription", {
          name: leadName,
        }),
      });
      setShowNewLeadDialog(false);
      setPendingLead(newLead);
      if (variables?.action === "schedule") {
        setLeadForScheduling(newLead);
        setShowScheduleDialog(true);
      } else {
        navigate(createPageUrl(`CustomerDetail?id=${newLead.id}`));
        setPendingLead(null);
      }
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: t("customers.toasts.createErrorTitle"),
        description:
          error?.message ?? t("customers.toasts.createErrorDescription"),
      });
    },
  });

  const scheduleEventMutation = useMutation({
    mutationFn: ({ task }) => adviseUAdminApi.entities.Task.create(task),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["tasks"]);
      queryClient.invalidateQueries(["tasks-today"]);
      showToast({
        type: "success",
        title: t("customers.toasts.scheduleTitle"),
        description: t("customers.toasts.scheduleDescription"),
      });
      setShowScheduleDialog(false);
      setLeadForScheduling(null);
      if (variables?.navigateToDetail ?? true) {
        const leadIdToOpen = variables?.leadId ?? pendingLead?.id;
        if (leadIdToOpen) {
          navigate(createPageUrl(`CustomerDetail?id=${leadIdToOpen}`));
        }
      }
      setPendingLead(null);
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: t("customers.toasts.scheduleErrorTitle"),
        description:
          error?.message ?? t("customers.toasts.scheduleErrorDescription"),
      });
    },
  });

  // Static list of allowed lead sources per specification
  const leadSources = useMemo(
    () => [
      { value: "Event", label: t("customers.leadSources.event") },
      { value: "Referral", label: t("customers.leadSources.referral") },
      { value: "Social Media", label: t("customers.leadSources.social") },
    ],
    [t],
  );

  const upcomingAppointments = useMemo(() => {
    const map = new Map();
    const now = new Date();
    tasks.forEach((task) => {
      if (task.type !== "Appointment" || !task.linked_lead_id) {
        return;
      }
      if (!task.date) return;
      const slot = new Date(`${task.date}T${task.time ?? "00:00"}`);
      if (Number.isNaN(slot.getTime()) || slot < now) {
        return;
      }
      const existing = map.get(task.linked_lead_id);
      if (!existing) {
        map.set(task.linked_lead_id, task);
        return;
      }
      const existingSlot = new Date(`${existing.date}T${existing.time ?? "00:00"}`);
      if (slot < existingSlot) {
        map.set(task.linked_lead_id, task);
      }
    });
    return map;
  }, [tasks]);

  const escapeRegExp = useCallback(
    (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    [],
  );

  const highlightText = useCallback(
    (value) => {
      if (!value && value !== 0) return "";
      const term = searchTerm.trim();
      if (!term) return value;
      const pattern = new RegExp(`(${escapeRegExp(term)})`, "gi");
      const parts = String(value).split(pattern);
      return parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark
            key={`${part}-${index}`}
            className="rounded bg-primary-100 px-1 font-semibold text-primary-800"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
        ),
      );
    },
    [escapeRegExp, searchTerm],
  );

  const filteredLeads = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = leads.filter((lead) => {
      if (normalizedSearch) {
        const fields = [
          lead.name,
          lead.contact_number,
          lead.email,
          lead.national_id,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());
        const matchesSearch = fields.some((field) =>
          field.includes(normalizedSearch),
        );
        if (!matchesSearch) {
          return false;
        }
      }

      if (customerTypeFilter !== "all") {
        const customerType = lead.customer_type || "Individual"; // Default to Individual if not specified
        if (customerTypeFilter !== customerType) {
          return false;
        }
      }

      if (sourceFilter !== "all" && lead.lead_source !== sourceFilter) {
        return false;
      }

      // Relationship filter: New (no policies) vs Existing (has policies)
      if (relationshipFilter === "new") {
        if (lead.is_client) {
          return false;
        }
      }

      if (relationshipFilter === "existing") {
        if (!lead.is_client) {
          return false;
        }
      }

      if (temperatureFilter !== "all") {
        const temperatureResult = calculateCustomerTemperature({
          lastInteractionAt: lead.last_contacted,
          activeProposals: lead.active_proposals ?? 0,
          openServiceRequests: lead.open_service_requests ?? 0,
        });
        if (temperatureFilter !== temperatureResult.bucket) {
          return false;
        }
      }

      // Created date filters removed per QA request

      if (lastContactedFilter !== "any") {
        const lastContacted = lead.last_contacted
          ? new Date(lead.last_contacted)
          : null;

        if (lastContactedFilter === "never") {
          return !lastContacted;
        }

        if (!lastContacted) {
          return false;
        }

        const daysAgo = differenceInCalendarDays(new Date(), lastContacted);

        if (lastContactedFilter === "7") {
          return daysAgo <= 7;
        }
        if (lastContactedFilter === "30") {
          return daysAgo <= 30;
        }
        if (lastContactedFilter === "over30") {
          return daysAgo > 30;
        }
      }

      return true;
    });

    const getCreatedTimestamp = (lead) => {
      const raw =
        lead.created_at ?? lead.updated_at ?? lead.updated_date ?? null;
      if (!raw) return 0;
      const time = new Date(raw).getTime();
      return Number.isNaN(time) ? 0 : time;
    };

    const getLastContactTimestamp = (lead) => {
      if (!lead.last_contacted) return null;
      const time = new Date(lead.last_contacted).getTime();
      return Number.isNaN(time) ? null : time;
    };

    const getAppointmentTimestamp = (leadId) => {
      const appointment = upcomingAppointments.get(leadId);
      if (!appointment || !appointment.date) return null;
      const time = new Date(
        `${appointment.date}T${appointment.time ?? "00:00"}`,
      ).getTime();
      return Number.isNaN(time) ? null : time;
    };

    return filtered.sort((a, b) => {
      if (sortOrder === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortOrder === "nextAppointment") {
        const timeA = getAppointmentTimestamp(a.id);
        const timeB = getAppointmentTimestamp(b.id);
        if (timeA !== null && timeB !== null) {
          return timeA - timeB;
        }
        if (timeA !== null) return -1;
        if (timeB !== null) return 1;
      }

      const lastA = getLastContactTimestamp(a);
      const lastB = getLastContactTimestamp(b);
      if (lastA !== null && lastB !== null && lastA !== lastB) {
        return lastB - lastA;
      }
      if (lastA !== null && lastB === null) return -1;
      if (lastA === null && lastB !== null) return 1;

      const createdA = getCreatedTimestamp(a);
      const createdB = getCreatedTimestamp(b);
      return createdB - createdA;
    });
  }, [
    leads,
    searchTerm,
    customerTypeFilter,
    sourceFilter,
    relationshipFilter,
    temperatureFilter,
    lastContactedFilter,
    sortOrder,
    upcomingAppointments,
  ]);

  // Reset the visible count when filters/search/sort change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    searchTerm,
    customerTypeFilter,
    sourceFilter,
    relationshipFilter,
    temperatureFilter,
    lastContactedFilter,
    sortOrder,
  ]);

  const displayedLeads = useMemo(
    () => filteredLeads.slice(0, visibleCount),
    [filteredLeads, visibleCount],
  );

  const customerTypeLabels = useMemo(
    () => ({
      all: t("customers.filters.allTypes"),
      Individual: t("customers.list.customerType.individual"),
      Entity: t("customers.list.customerType.entity"),
    }),
    [t],
  );

  const relationshipLabels = useMemo(
    () => ({
      all: t("customers.filters.allRelationships"),
      new: t("customers.filters.new"),
      existing: t("customers.filters.existing"),
      leads: t("customers.filters.leadsOnly"),
      clients: t("customers.filters.clientsOnly"),
    }),
    [t],
  );

  const temperatureLabels = useMemo(
    () => ({
      all: t("customers.filters.allTemperatures"),
      hot: t("customers.filters.hot"),
      warm: t("customers.filters.warm"),
      cold: t("customers.filters.cold"),
    }),
    [t],
  );

  const lastContactedOptions = useMemo(
    () => [
      { value: "any", label: t("customers.filters.anyTime") },
      { value: "7", label: t("customers.filters.last7Days") },
      { value: "30", label: t("customers.filters.last30Days") },
      { value: "over30", label: t("customers.filters.over30Days") },
      { value: "never", label: t("customers.filters.never") },
    ],
    [t],
  );

  const lastContactedLabels = useMemo(
    () =>
      Object.fromEntries(
        lastContactedOptions.map((option) => [option.value, option.label]),
      ),
    [lastContactedOptions],
  );

  const getLeadSourceLabel = useCallback(
    (value) =>
      leadSources.find((source) => source.value === value)?.label ?? value,
    [leadSources],
  );

  const activeFilters = useMemo(() => {
    const chips = [];
    if (customerTypeFilter !== "all") {
      chips.push({
        key: "customerType",
        label: t("customers.badges.type", {
          value: customerTypeLabels[customerTypeFilter] ?? customerTypeFilter,
        }),
        onRemove: () => setCustomerTypeFilter("all"),
      });
    }
    if (relationshipFilter !== "all") {
      const relationshipLabel =
        relationshipLabels[relationshipFilter] ?? relationshipFilter;
      chips.push({
        key: "relationship",
        label: t("customers.badges.relationship", { value: relationshipLabel }),
        onRemove: () => setRelationshipFilter("all"),
      });
    }
    if (temperatureFilter !== "all") {
      chips.push({
        key: "temperature",
        label: t("customers.badges.temperature", {
          value: temperatureLabels[temperatureFilter] ?? temperatureFilter,
        }),
        onRemove: () => setTemperatureFilter("all"),
      });
    }
    if (sourceFilter !== "all") {
      chips.push({
        key: "source",
        label: t("customers.badges.source", {
          value: getLeadSourceLabel(sourceFilter),
        }),
        onRemove: () => setSourceFilter("all"),
      });
    }
    if (createdDateStart || createdDateEnd) {
      const labelParts = [];
      if (createdDateStart) {
        labelParts.push(
          t("customers.badges.createdFrom", {
            date: format(new Date(createdDateStart), "MMM d, yyyy"),
          }),
        );
      }
      if (createdDateEnd) {
        labelParts.push(
          t("customers.badges.createdTo", {
            date: format(new Date(createdDateEnd), "MMM d, yyyy"),
          }),
        );
      }
      chips.push({
        key: "created",
        label: t("customers.badges.created", {
          range: labelParts.join(" "),
        }),
        onRemove: () => {
          setCreatedDateStart("");
          setCreatedDateEnd("");
        },
      });
    }
    if (lastContactedFilter !== "any") {
      chips.push({
        key: "lastContacted",
        label: t("customers.badges.lastContacted", {
          value: lastContactedLabels[lastContactedFilter]
            ?? lastContactedFilter,
        }),
        onRemove: () => setLastContactedFilter("any"),
      });
    }
    return chips;
  }, [
    customerTypeFilter,
    customerTypeLabels,
    getLeadSourceLabel,
    lastContactedFilter,
    lastContactedLabels,
    relationshipFilter,
    relationshipLabels,
    temperatureFilter,
    temperatureLabels,
    sourceFilter,
    t,
  ]);

  const clearAllFilters = useCallback(() => {
    setCustomerTypeFilter("all");
    setSourceFilter("all");
    setLastContactedFilter("any");
    setRelationshipFilter("all");
    setTemperatureFilter("all");
  }, []);

  const renderFilterBadges = useCallback(
    ({
      containerClassName = "",
      badgeClassName = "",
      buttonVariant = "ghost",
      buttonClassName = "text-slate-600 hover:text-primary-700",
    } = {}) => {
      if (activeFilters.length === 0) return null;

      const containerClasses = [
        "flex flex-wrap items-center gap-2",
        containerClassName,
      ]
        .filter(Boolean)
        .join(" ");

      const badgeClasses = [
        "flex items-center gap-2 border-primary-200 bg-primary-50 text-primary-700",
        badgeClassName,
      ]
        .filter(Boolean)
        .join(" ");

      return (
        <div className={containerClasses}>
          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="outline" className={badgeClasses}>
              {filter.label}
              <button
                type="button"
                onClick={filter.onRemove}
                className="rounded-full p-0.5 text-primary-600 transition hover:bg-primary-100"
                aria-label={t("customers.badges.remove", {
                  label: filter.label,
                })}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant={buttonVariant}
            size="sm"
            onClick={clearAllFilters}
            className={buttonClassName}
          >
            {t("customers.filters.clearAllFilters")}
          </Button>
        </div>
      );
    },
    [activeFilters, clearAllFilters, t],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-20 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-200 space-y-6">
          <PageHeader
            title={t("customers.title")}
            subtitle={t("customers.subtitle")}
            icon={Users}
            className="mb-0"
            actions={(
              <Button onClick={() => setShowNewLeadDialog(true)} className="bg-primary-600 shadow-lg hover:bg-primary-700">
                <Plus className="mr-2 h-4 w-4" />
                {t("customers.newLead")}
              </Button>
            )}
          />

          {/* Unified Search/Filter/Sort Bar */}
          <SearchFilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={t("customers.searchPlaceholder")}
            filterButton={
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={activeFilters.length > 0 ? "default" : "outline"}
                    size="icon"
                    className={activeFilters.length > 0 ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
                    title={t("common.filter")}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    <div className="flex items-center justify-between sticky top-0 bg-white pb-3">
                      <h4 className="font-semibold text-sm text-slate-900">
                        {t("customers.filters.title")}
                      </h4>
                      <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                        {t("customers.filters.clearAll")}
                      </Button>
                    </div>

                    {/* Customer Type */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 mb-2">
                        {t("customers.filters.customerType")}
                      </Label>
                      <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("customers.filters.allTypes")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("customers.filters.allTypes")}</SelectItem>
                          <SelectItem value="Individual">{t("customers.filters.individual")}</SelectItem>
                          <SelectItem value="Entity">{t("customers.filters.entity")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lead Source */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 mb-2">
                        {t("customers.filters.leadSource")}
                      </Label>
                      <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("customers.filters.allSources")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("customers.filters.allSources")}</SelectItem>
                          {leadSources.map((source) => (
                            <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Relationship */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 mb-2">
                        {t("customers.filters.relationship")}
                      </Label>
                      <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("customers.filters.allRelationships")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("customers.filters.allRelationships")}</SelectItem>
                          <SelectItem value="new">{t("customers.filters.new")}</SelectItem>
                          <SelectItem value="existing">{t("customers.filters.existing")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Temperature */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 mb-2">
                        {t("customers.filters.temperature")}
                      </Label>
                      <Select value={temperatureFilter} onValueChange={setTemperatureFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("customers.filters.allTemperatures")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("customers.filters.allTemperatures")}</SelectItem>
                          <SelectItem value="hot">{t("customers.filters.hot")}</SelectItem>
                          <SelectItem value="warm">{t("customers.filters.warm")}</SelectItem>
                          <SelectItem value="cold">{t("customers.filters.cold")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Last Contacted */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 mb-2">
                        {t("customers.filters.lastContacted")}
                      </Label>
                      <Select value={lastContactedFilter} onValueChange={setLastContactedFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("customers.filters.anyTime")} />
                        </SelectTrigger>
                        <SelectContent>
                          {lastContactedOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Active Filters */}
                    {activeFilters.length > 0 && (
                      <div className="pt-3 border-t">
                        {renderFilterBadges({ badgeClassName: "text-xs" })}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            }
            sortButton={
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={sortOrder !== "lastContacted" ? "default" : "outline"}
                    size="icon"
                    className={sortOrder !== "lastContacted" ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
                    title={t("customers.sort.title")}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3">
                      {t("customers.sort.title")}
                    </h4>
                    <div className="space-y-2">
                      <Button
                        variant={sortOrder === "lastContacted" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSortOrder("lastContacted")}
                      >
                        {t("customers.sort.lastContacted")}
                      </Button>
                      <Button
                        variant={sortOrder === "name" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSortOrder("name")}
                      >
                        {t("customers.sort.name")}
                      </Button>
                      <Button
                        variant={sortOrder === "nextAppointment" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSortOrder("nextAppointment")}
                      >
                        {t("customers.sort.nextAppointment")}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            }
            rightActions={
              <div className="text-sm text-slate-500">
                {leads.length
                  ? t("customers.counts.showing", {
                    visible: Math.min(visibleCount, filteredLeads.length),
                    total: leads.length,
                  })
                  : t("customers.counts.empty")}
              </div>
            }
          />
        </div>

        {/* Advanced Filters - Removed, now using popover-based filters */}
        {false && (
          <Card className="border-slate-200 shadow-lg">
            <CardContent id="customer-filter-panel" className="space-y-6 p-6">
              {filtersCollapsed ? (
                activeFilters.length > 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
                    <p className="flex items-center gap-2 font-semibold text-slate-700">
                      <Filter className="h-4 w-4 text-primary-600" />
                      {t("customers.advanced.activeFiltersHeading")}
                    </p>
                    {renderFilterBadges({
                      containerClassName: "mt-3",
                      buttonVariant: "outline",
                      buttonClassName:
                        "border border-primary-200 text-primary-700 hover:bg-primary-50",
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                    {t("customers.advanced.filtersHidden")}
                  </div>
                )
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-slate-500">
                        {t("customers.filters.leadSource")}
                      </Label>
                      <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="border-slate-200">
                          <SelectValue placeholder={t("customers.filters.allSources")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("customers.filters.allSources")}</SelectItem>
                          {leadSources.map((source) => (
                            <SelectItem key={source.value} value={source.value}>
                              {source.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-slate-500">
                        {t("customers.filters.relationship")}
                      </Label>
                      <Select
                        value={relationshipFilter}
                        onValueChange={setRelationshipFilter}
                      >
                        <SelectTrigger className="border-slate-200">
                          <SelectValue placeholder={t("customers.filters.allRelationships")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("customers.filters.allRelationships")}</SelectItem>
                          <SelectItem value="leads">{t("customers.filters.leadsOnly")}</SelectItem>
                          <SelectItem value="clients">{t("customers.filters.clientsOnly")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Created date filters removed per QA */}
                    <div className="space-y-2 md:col-span-2 xl:col-span-3">
                      <Label className="text-xs font-semibold uppercase text-slate-500">
                        {t("customers.filters.lastContacted")}
                      </Label>
                      <Select
                        value={lastContactedFilter}
                        onValueChange={setLastContactedFilter}
                      >
                        <SelectTrigger className="border-slate-200">
                          <SelectValue placeholder={t("customers.filters.anyTime")} />
                        </SelectTrigger>
                        <SelectContent>
                          {lastContactedOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {renderFilterBadges()}
                  <div className="text-xs text-slate-500">
                    {t("customers.advanced.customerBadgeNote")}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Leads List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="shadow-lg">
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="p-12 text-center">
                <Building2 className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  {t("customers.empty.title")}
                </h3>
                <p className="text-slate-500">
                  {t("customers.empty.description")}
                </p>
              </CardContent>
            </Card>
          ) : (
            displayedLeads.map((lead) => {
              const createdAtRaw =
                lead.created_at ?? lead.updated_at ?? lead.updated_date;
              const createdAtDisplay = createdAtRaw
                ? format(new Date(createdAtRaw), "MMM d, yyyy")
                : t("customers.list.notAvailable");
              const lastContactedDisplay = lead.last_contacted
                ? format(new Date(lead.last_contacted), "MMM d, yyyy")
                : t("customers.list.notContacted");
              const nextAppointment = upcomingAppointments.get(lead.id);
              const customerType = lead.customer_type || "Individual";
              const customerTypeLabel =
                customerTypeLabels[customerType] ?? customerType;
              const relationshipLabel = lead.is_client
                ? t("customers.list.relationship.existing")
                : t("customers.list.relationship.new");
              const nextAppointmentDisplay = nextAppointment?.date
                ? format(
                  new Date(
                    `${nextAppointment.date}T${nextAppointment.time ?? "00:00"}`,
                  ),
                  "MMM d, yyyy h:mm a",
                )
                : null;

              return (
                <Card
                  key={lead.id}
                  className="group cursor-pointer border-slate-200 shadow-lg transition-all hover:shadow-xl"
                  onClick={() =>
                    navigate(createPageUrl(`CustomerDetail?id=${lead.id}`))
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-primary-600">
                            {highlightText(lead.name)}
                          </h3>

                          {/* Customer Type */}
                          <Badge className="bg-slate-100 text-slate-700">
                            {customerTypeLabel}
                          </Badge>

                          {/* Relationship Type */}
                          <Badge className={lead.is_client ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                            {relationshipLabel}
                          </Badge>

                          {/* Customer Temperature */}
                          <TemperatureBadge
                            {...calculateCustomerTemperature({
                              lastInteractionAt: lead.last_contacted,
                              activeProposals: lead.active_proposals ?? 0,
                              openServiceRequests: lead.open_service_requests ?? 0,
                            })}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="h-4 w-4" />
                            <span>{highlightText(lead.contact_number)}</span>
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail className="h-4 w-4" />
                              <span>{highlightText(lead.email)}</span>
                            </div>
                          )}
                          {lead.lead_source && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Building2 className="h-4 w-4" />
                              <span>{highlightText(lead.lead_source)}</span>
                            </div>
                          )}
                          {lead.national_id && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <FileText className="h-4 w-4" />
                              <span>{highlightText(lead.national_id)}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4">
                          <div>
                            <p className="text-xs text-slate-500">
                              {t("customers.list.lastContacted")}
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                              {lastContactedDisplay}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">
                              {t("customers.list.created")}
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                              {createdAtDisplay}
                            </p>
                          </div>
                          {nextAppointmentDisplay && (
                            <div>
                              <p className="text-xs text-slate-500">
                                {t("customers.list.nextAppointment")}
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {nextAppointmentDisplay}
                              </p>
                            </div>
                          )}
                          {lead.is_client && (
                            <>
                              <div>
                                <p className="text-xs text-slate-500">
                                  {t("customers.list.activePolicies")}
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {lead.active_policies_count || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">
                                  {t("customers.list.totalPremium")}
                                </p>
                                <p className="text-sm font-semibold text-foreground-success">
                                  {formatCurrency(lead.total_premium || 0, prefs)}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {displayedLeads.length < filteredLeads.length && (
          <div className="mt-6 flex justify-center">
            <Button
            variant="outline"
            className="px-6"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            {t("customers.list.loadMore")}
          </Button>
        </div>
      )}
      </div>

      <NewLeadDialog
        open={showNewLeadDialog}
        onClose={() => setShowNewLeadDialog(false)}
        onSubmit={(payload, action) =>
          createLeadMutation.mutate({ payload, action })
        }
        isLoading={createLeadMutation.isPending}
      />

      <AddEventDialog
        open={showScheduleDialog}
        onClose={() => {
          setShowScheduleDialog(false);
          setLeadForScheduling(null);
          setPendingLead(null);
        }}
        onSubmit={(formValues) =>
          scheduleEventMutation.mutate({
            task: {
              ...formValues,
              linked_lead_id:
                formValues.linked_lead_id ?? leadForScheduling?.id,
              linked_lead_name:
                formValues.linked_lead_name ?? leadForScheduling?.name,
            },
            leadId: leadForScheduling?.id ?? pendingLead?.id,
            navigateToDetail: true,
          })
        }
        isLoading={scheduleEventMutation.isPending}
        lead={leadForScheduling}
      />
    </div>
  );
}
