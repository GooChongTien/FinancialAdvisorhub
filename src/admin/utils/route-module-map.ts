import type { MiraModule } from "@/lib/mira/types.ts";
import { pageRoutes } from "./index.js";

type PageName =
  | "Home"
  | "Customer"
  | "CustomerDetail"
  | "NewBusiness"
  | "ProposalDetail"
  | "QuoteSummary"
  | "Product"
  | "PolicyDetail"
  | "Analytics"
  | "SmartPlan"
  | "ToDo"
  | "Broadcast"
  | "BroadcastDetail"
  | "News"
  | "NewsDetail"
  | "MiraOps";

const PAGE_NAME_TO_MODULE: Record<PageName, MiraModule> = {
  Home: "visualizer",
  Customer: "customer",
  CustomerDetail: "customer",
  NewBusiness: "new_business",
  ProposalDetail: "new_business",
  QuoteSummary: "new_business",
  Product: "product",
  PolicyDetail: "product",
  Analytics: "analytics",
  MiraOps: "analytics",
  SmartPlan: "todo",
  ToDo: "todo",
  Broadcast: "news",
  BroadcastDetail: "news",
  News: "news",
  NewsDetail: "news",
};

export const DEFAULT_MIRA_MODULE: MiraModule = "customer";

interface ModuleRouteEntry {
  module: MiraModule;
  path: string;
}

function buildRouteEntries(): ModuleRouteEntry[] {
  const entries: ModuleRouteEntry[] = [];
  (Object.keys(PAGE_NAME_TO_MODULE) as PageName[]).forEach((pageName) => {
    const path = pageRoutes[pageName];
    if (!path) return;
    entries.push({
      module: PAGE_NAME_TO_MODULE[pageName],
      path: normalizeRoutePath(path),
    });
  });
  return entries;
}

const ROUTE_ENTRIES = buildRouteEntries();

export function normalizeRoutePath(pathname?: string | null): string {
  if (!pathname) return "/";
  const [withoutQuery] = pathname.split(/[?#]/, 1);
  const trimmed = (withoutQuery ?? pathname).trim();
  if (!trimmed) return "/";
  const withForwardSlashes = trimmed.replace(/\\/g, "/");
  if (withForwardSlashes === "/") return "/";
  const collapsed = withForwardSlashes.replace(/\/{2,}/g, "/");
  const withoutTrailing = collapsed.endsWith("/") ? collapsed.replace(/\/+$/, "") : collapsed;
  return withoutTrailing.toLowerCase() || "/";
}

function matchesRoute(candidate: string, target: string): boolean {
  if (candidate === target) return true;
  if (candidate === "/") return target === "/";
  return target.startsWith(`${candidate}/`);
}

/**
 * Derive the best-effort Mira module for a given pathname.
 * Falls back to `DEFAULT_MIRA_MODULE` when no explicit mapping exists.
 */
export function deriveModuleFromPath(pathname?: string | null): MiraModule {
  const normalized = normalizeRoutePath(pathname);
  for (const entry of ROUTE_ENTRIES) {
    if (matchesRoute(entry.path, normalized)) {
      return entry.module;
    }
  }
  return DEFAULT_MIRA_MODULE;
}

/**
 * Returns the module for a known route descriptor (e.g., "CustomerDetail").
 * Falls back to the default module when the descriptor is unknown.
 */
export function deriveModuleFromPageName(pageName?: string | null): MiraModule {
  if (!pageName) return DEFAULT_MIRA_MODULE;
  const module = PAGE_NAME_TO_MODULE[pageName as PageName];
  return module ?? DEFAULT_MIRA_MODULE;
}

/**
 * Surface a shallow copy of the mapping for downstream tooling/testing.
 */
export function exportRouteModuleEntries(): ModuleRouteEntry[] {
  return [...ROUTE_ENTRIES];
}
