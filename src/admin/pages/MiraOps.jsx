import { fetchAdvisorInsights, fetchMiraEvents } from "@/admin/api/miraOpsApi.js";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import {
  buildAlertState,
  computeTopFailingActions,
  DEFAULT_MIN_ALERT_EVENTS,
} from "@/admin/lib/miraOpsMetrics.js";
import { createPageUrl } from "@/admin/utils";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const MODULE_OPTIONS = [
  { labelKey: "chat.miraOps.modules.all", value: "all" },
  { labelKey: "chat.miraOps.modules.customer", value: "customer" },
  { labelKey: "chat.miraOps.modules.newBusiness", value: "new_business" },
  { labelKey: "chat.miraOps.modules.product", value: "product" },
  { labelKey: "chat.miraOps.modules.analytics", value: "analytics" },
  { labelKey: "chat.miraOps.modules.smartPlan", value: "todo" },
  { labelKey: "chat.miraOps.modules.news", value: "news" },
  { labelKey: "chat.miraOps.modules.visualizer", value: "visualizer" },
];

const STATUS_OPTIONS = [
  { labelKey: "chat.miraOps.status.all", value: "all" },
  { labelKey: "chat.miraOps.status.success", value: "success" },
  { labelKey: "chat.miraOps.status.failure", value: "failure" },
];

const RANGE_OPTIONS = [
  { labelKey: "chat.miraOps.ranges.24h", value: "24h", hours: 24 },
  { labelKey: "chat.miraOps.ranges.7d", value: "7d", hours: 24 * 7 },
  { labelKey: "chat.miraOps.ranges.30d", value: "30d", hours: 24 * 30 },
  { labelKey: "chat.miraOps.ranges.all", value: "all" },
];

const ENTITY_ROUTE_BUILDERS = {
  proposal: (id) => createPageUrl(`ProposalDetail?id=${id}`),
  customer: (id) => createPageUrl(`CustomerDetail?id=${id}`),
  lead: (id) => createPageUrl(`CustomerDetail?id=${id}`),
  policy: (id) => createPageUrl(`PolicyDetail?id=${id}`),
  task: (id) => `${createPageUrl("SmartPlan")}?taskId=${id}`,
};

const PAGE_SIZE = 25;
const ALERT_THRESHOLD = 0.05;
const ALERT_WINDOW_MINUTES = 10;
const MIN_ALERT_EVENTS = DEFAULT_MIN_ALERT_EVENTS;
const INSIGHT_PRIORITY_STYLES = {
  critical: "bg-rose-100 text-rose-700 border border-rose-200",
  important: "bg-amber-100 text-amber-700 border border-amber-200",
  info: "bg-slate-100 text-slate-600 border border-slate-200",
};

function computeRangeStart(rangeValue) {
  if (rangeValue === "all") return null;
  const option = RANGE_OPTIONS.find((opt) => opt.value === rangeValue);
  if (!option?.hours) return null;
  const start = new Date(Date.now() - option.hours * 60 * 60 * 1000);
  return start.toISOString();
}

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function OutcomeBadge({ success }) {
  const { t } = useTranslation();
  if (success) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        {t("chat.miraOps.badges.success")}
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
      <AlertTriangle className="mr-1 h-3.5 w-3.5" />
      {t("chat.miraOps.badges.failed")}
    </Badge>
  );
}

function AdvisorInsightsList({ insights = [] }) {
  const { t } = useTranslation();
  if (!insights.length) {
    return (
      <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-500">
        {t("chat.miraOps.insights.empty")}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {insights.map((insight) => {
        const priorityStyle = INSIGHT_PRIORITY_STYLES[insight.priority] ?? INSIGHT_PRIORITY_STYLES.info;
        return (
          <div key={insight.id} className="rounded-lg border border-slate-200 bg-white/70 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${priorityStyle}`}>
                {insight.priority === "critical"
                  ? t("chat.miraOps.badges.critical")
                  : insight.priority === "important"
                    ? t("chat.miraOps.badges.important")
                    : t("chat.miraOps.badges.info")}
              </span>
              {insight.updated_at ? <span>{formatTimestamp(insight.updated_at)}</span> : null}
            </div>
            <div className="mt-2">
              <p className="text-sm font-semibold text-slate-900">{insight.title}</p>
              {insight.summary ? (
                <p className="text-xs text-slate-600">{insight.summary}</p>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium uppercase tracking-wide">
                {insight.module}
              </span>
              {insight.tag && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium uppercase tracking-wide">
                  {insight.tag}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon, accent }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function buildEntityLink(entityType, entityId) {
  if (!entityType || !entityId) return null;
  const builder = ENTITY_ROUTE_BUILDERS[entityType];
  if (!builder) return null;
  return {
    label: entityType.charAt(0).toUpperCase() + entityType.slice(1),
    url: builder(entityId),
  };
}

function AlertCallout({ state }) {
  const { t } = useTranslation();
  if (!state) return null;
  const percent = (state.rate * 100).toFixed(1);
  if (state.active) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="flex flex-col gap-1 py-4 text-sm text-rose-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            {t("chat.miraOps.alerts.failureRateExceeded", { percent, minutes: ALERT_WINDOW_MINUTES })}
          </div>
          <p>
            {t("chat.miraOps.alerts.pagerDuty", { total: state.total })}
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-emerald-200 bg-emerald-50">
      <CardContent className="flex items-center gap-2 py-3 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        {t("chat.miraOps.alerts.failureRateNormal", { percent, minutes: ALERT_WINDOW_MINUTES })}
      </CardContent>
    </Card>
  );
}

function TopFailingActionsList({ actions }) {
  const { t } = useTranslation();
  if (!actions.length) {
    return (
      <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">
        {t("chat.miraOps.failingActions.empty")}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">{t("chat.miraOps.failingActions.headers.action")}</th>
            <th className="px-3 py-2">{t("chat.miraOps.failingActions.headers.failures")}</th>
            <th className="px-3 py-2">{t("chat.miraOps.failingActions.headers.lastFailure")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {actions.map((item) => (
            <tr key={item.action}>
              <td className="px-3 py-2 font-medium text-slate-900">{item.action}</td>
              <td className="px-3 py-2">{item.failures}</td>
              <td className="px-3 py-2 text-xs text-slate-500">
                {formatTimestamp(item.lastFailureAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventsTable({ events = [], loading, navigate, onViewAdvisorInsights }) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 p-6 text-sm text-slate-500">
        {t("chat.miraOps.events.loading")}
      </div>
    );
  }
  if (!events.length) {
    return (
      <div className="rounded-lg border border-slate-200 p-6 text-sm text-slate-500">
        {t("chat.miraOps.events.empty")}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">{t("chat.miraOps.events.headers.timestamp")}</th>
            <th className="px-3 py-2">{t("chat.miraOps.events.headers.modulePage")}</th>
            <th className="px-3 py-2">{t("chat.miraOps.events.headers.action")}</th>
            <th className="px-3 py-2">{t("chat.miraOps.events.headers.outcome")}</th>
            <th className="px-3 py-2">{t("chat.miraOps.events.headers.confirm")}</th>
            <th className="px-3 py-2">{t("chat.miraOps.events.headers.entity")}</th>
            <th className="px-3 py-2">{t("chat.miraOps.events.headers.correlation")}</th>
            <th className="px-3 py-2">{t("chat.miraOps.events.headers.details")}</th>
            <th className="px-3 py-2">{t("chat.miraOps.events.headers.advisor")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {events.map((event) => {
            const actionSummary =
              event.actions?.[0]?.action_type || event.skill_name || event.metadata?.action_type || "action";
            const entityType = event.entity_type || event.metadata?.entity_type;
            const entityId = event.entity_id || event.metadata?.entity_id;
            const entityLink = buildEntityLink(entityType, entityId);
            const fieldKeys = Array.isArray(event.page_data_keys)
              ? event.page_data_keys
              : event.metadata?.page_data_keys || [];

            return (
              <tr key={event.id} className="align-top">
                <td className="px-3 py-3 text-xs text-slate-500">
                  {formatTimestamp(event.created_at)}
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium text-slate-900">
                    {event.journey_type || event.metadata?.module || "—"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {event.page || event.metadata?.page || "—"}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium">{actionSummary}</div>
                  <div className="text-xs text-slate-500">
                    {event.target || event.metadata?.target || "—"}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <OutcomeBadge success={event.success} />
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">
                  {event.confirm_required ? t("chat.miraOps.events.cells.required") : t("chat.miraOps.events.cells.auto")}
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">
                  {entityLink ? (
                    <Button
                      variant="link"
                      className="px-0 text-primary-600"
                      onClick={() => navigate(entityLink.url)}
                    >
                      {t("chat.miraOps.events.cells.viewLabel", { label: entityLink.label })}
                    </Button>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-slate-500">
                  {event.correlation_id || event.metadata?.correlation_id || "—"}
                </td>
                <td className="px-3 py-3 text-xs text-slate-500">
                  {event.error_message || event.metadata?.error_message || fieldKeys.join(", ") || "—"}
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">
                  {event.advisor_id ? (
                    <div className="flex flex-col gap-1">
                      <span className="break-all text-[11px] text-slate-500">{event.advisor_id}</span>
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 text-primary-600"
                        onClick={() => onViewAdvisorInsights?.(event.advisor_id)}
                      >
                        {t("chat.miraOps.insights.viewInsights")}
                      </Button>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function MiraOps() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("24h");
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const [insightAdvisorInput, setInsightAdvisorInput] = useState("");
  const [insightAdvisorTarget, setInsightAdvisorTarget] = useState("");

  const tableParams = useMemo(() => {
    const base = {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      search: deferredSearch || undefined,
      start: computeRangeStart(rangeFilter) ?? undefined,
      module: moduleFilter === "all" ? undefined : moduleFilter,
    };
    if (statusFilter === "success") {
      base.status = "success";
    } else if (statusFilter === "failure") {
      base.status = "failure";
    }
    return base;
  }, [moduleFilter, statusFilter, rangeFilter, page, deferredSearch]);

  const handleAdvisorInsightsLookup = useCallback((advisorId) => {
    if (!advisorId) return;
    const trimmed = advisorId.trim();
    if (!trimmed) return;
    setInsightAdvisorInput(trimmed);
    setInsightAdvisorTarget(trimmed);
  }, []);

  const clearAdvisorInsights = useCallback(() => {
    setInsightAdvisorInput("");
    setInsightAdvisorTarget("");
  }, []);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["mira-events", tableParams],
    queryFn: () => fetchMiraEvents(tableParams),
    keepPreviousData: true,
  });

  const sevenDayParams = useMemo(
    () => ({
      limit: 200,
      offset: 0,
      start: computeRangeStart("7d") ?? undefined,
    }),
    [],
  );

  const metricsQuery = useQuery({
    queryKey: ["mira-events-metrics", "7d"],
    queryFn: () => fetchMiraEvents(sevenDayParams),
    staleTime: 60_000,
  });

  const alertParams = useMemo(
    () => ({
      limit: 200,
      offset: 0,
      start: new Date(Date.now() - ALERT_WINDOW_MINUTES * 60 * 1000).toISOString(),
    }),
    [],
  );

  const alertQuery = useQuery({
    queryKey: ["mira-events-alert", ALERT_WINDOW_MINUTES],
    queryFn: () => fetchMiraEvents(alertParams),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const {
    data: advisorInsightsData,
    isFetching: advisorInsightsFetching,
    error: advisorInsightsError,
  } = useQuery({
    queryKey: ["ops-insights", insightAdvisorTarget],
    queryFn: () => fetchAdvisorInsights(insightAdvisorTarget),
    enabled: Boolean(insightAdvisorTarget),
    staleTime: 60_000,
  });

  useMiraPageData(
    () => ({
      view: "mira_ops",
      moduleFilter,
      statusFilter,
      rangeFilter,
      page,
      searchTerm: deferredSearch,
    }),
    [moduleFilter, statusFilter, rangeFilter, page, deferredSearch],
  );

  const events = data?.events ?? [];
  const pagination = data?.pagination ?? { total: 0, hasMore: false };
  const summary = data?.summary ?? { success: 0, failure: 0 };
  const advisorInsights = insightAdvisorTarget ? advisorInsightsData ?? [] : [];

  const metricsSummary = metricsQuery.data?.summary ?? { success: 0, failure: 0 };
  const metricsEvents = metricsQuery.data?.events ?? [];
  const sevenDayTotal = metricsSummary.success + metricsSummary.failure;
  const sevenDaySuccessRate =
    sevenDayTotal > 0 ? `${((metricsSummary.success / sevenDayTotal) * 100).toFixed(1)}%` : "—";
  const topFailingActions = useMemo(() => computeTopFailingActions(metricsEvents), [metricsEvents]);

  const alertState = buildAlertState(alertQuery.data?.events ?? []);

  const handleRefresh = () => {
    refetch();
    metricsQuery.refetch();
    alertQuery.refetch();
  };

  const totalPages =
    pagination.total && PAGE_SIZE > 0
      ? Math.ceil(pagination.total / PAGE_SIZE)
      : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t("chat.miraOps.title")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("chat.miraOps.subtitle")}
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {t("chat.miraOps.refresh")}
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title={t("chat.miraOps.summary.totalEvents")}
          value={pagination.total ?? events.length}
          subtitle={rangeFilter === "all" ? t("chat.miraOps.summary.allTime") : t("chat.miraOps.summary.filteredWindow")}
          icon={Activity}
          accent="bg-sky-100 text-sky-700"
        />
        <SummaryCard
          title={t("chat.miraOps.summary.successful")}
          value={summary.success}
          subtitle={t("chat.miraOps.summary.autoActionsCompleted")}
          icon={CheckCircle2}
          accent="bg-emerald-100 text-emerald-700"
        />
        <SummaryCard
          title={t("chat.miraOps.summary.failures")}
          value={summary.failure}
          subtitle={t("chat.miraOps.summary.requiresFollowUp")}
          icon={AlertTriangle}
          accent="bg-rose-100 text-rose-700"
        />
        <SummaryCard
          title={t("chat.miraOps.summary.sevenDaySuccessRate")}
          value={sevenDaySuccessRate}
          subtitle={t("chat.miraOps.summary.computedFromTelemetry")}
          icon={TrendingUp}
          accent="bg-indigo-100 text-indigo-700"
        />
      </section>

      <AlertCallout state={alertState} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-800">
            {t("chat.miraOps.filters.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-medium uppercase text-slate-500">
              {t("chat.miraOps.filters.module")}
            </span>
            <Select
              value={moduleFilter}
              onValueChange={(value) => {
                setPage(0);
                setModuleFilter(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("chat.miraOps.modules.all")} />
              </SelectTrigger>
              <SelectContent>
                {MODULE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-medium uppercase text-slate-500">
              {t("chat.miraOps.filters.outcome")}
            </span>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setPage(0);
                setStatusFilter(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("chat.miraOps.status.all")} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-medium uppercase text-slate-500">
              {t("chat.miraOps.filters.timeRange")}
            </span>
            <Select
              value={rangeFilter}
              onValueChange={(value) => {
                setPage(0);
                setRangeFilter(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("chat.miraOps.ranges.24h")} />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-medium uppercase text-slate-500">
              {t("chat.miraOps.filters.search")}
            </span>
            <Input
              placeholder={t("chat.miraOps.filters.searchPlaceholder")}
              value={searchTerm}
              onChange={(event) => {
                setPage(0);
                setSearchTerm(event.target.value);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error.message || t("chat.miraOps.events.error")}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EventsTable
            events={events}
            loading={isLoading && !events.length}
            navigate={navigate}
            onViewAdvisorInsights={handleAdvisorInsightsLookup}
          />
        </div>
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-800">{t("chat.miraOps.insights.previewTitle")}</CardTitle>
              <p className="text-xs text-slate-500">
                {t("chat.miraOps.insights.previewDesc")}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2">
                <Input
                  placeholder={t("chat.miraOps.insights.placeholder")}
                  value={insightAdvisorInput}
                  onChange={(event) => setInsightAdvisorInput(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => handleAdvisorInsightsLookup(insightAdvisorInput)}
                    disabled={!insightAdvisorInput.trim()}
                  >
                    {t("chat.miraOps.insights.load")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearAdvisorInsights}
                    disabled={!insightAdvisorTarget}
                  >
                    {t("chat.miraOps.insights.clear")}
                  </Button>
                </div>
              </div>
              {advisorInsightsError ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {advisorInsightsError.message || t("chat.miraOps.insights.error")}
                </div>
              ) : null}
              {!insightAdvisorTarget ? (
                <p className="text-xs text-slate-500">
                  {t("chat.miraOps.insights.selectAdvisor")}
                </p>
              ) : advisorInsightsFetching ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("chat.miraOps.insights.loading")}
                </div>
              ) : (
                <AdvisorInsightsList insights={advisorInsights} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                {t("chat.miraOps.failingActions.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopFailingActionsList actions={topFailingActions} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-600 md:flex-row">
        <div>
          {t("chat.miraOps.pagination.showing")}{" "}
          <span className="font-medium text-slate-900">
            {events.length ? page * PAGE_SIZE + 1 : 0}-
            {page * PAGE_SIZE + events.length}
          </span>{" "}
          {t("chat.miraOps.pagination.of")}{" "}
          <span className="font-medium text-slate-900">
            {pagination.total ?? events.length}
          </span>{" "}
          {t("chat.miraOps.pagination.events")}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || isFetching}
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
          >
            {t("chat.miraOps.pagination.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasMore || isFetching}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {t("chat.miraOps.pagination.next")}
          </Button>
          {totalPages && (
            <span className="text-xs text-slate-500">
              {t("chat.miraOps.pagination.pageInfo", { current: page + 1, total: totalPages })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
