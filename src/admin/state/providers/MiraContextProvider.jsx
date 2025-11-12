import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  DEFAULT_MIRA_MODULE,
  deriveModuleFromPath,
  normalizeRoutePath,
} from "@/admin/utils/route-module-map.ts";

const MiraContextContext = createContext(null);

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function MiraContextProvider({ children }) {
  const location = useLocation();
  const [module, setModuleState] = useState(() => deriveModuleFromPath(location.pathname));
  const [page, setPageState] = useState(() => normalizeRoutePath(location.pathname));
  const [pageData, setPageDataState] = useState({});
  const locationKeyRef = useRef("");

  useEffect(() => {
    const normalizedPath = normalizeRoutePath(location.pathname);
    const nextKey = `${normalizedPath}|${location.search ?? ""}`;
    setPageState(normalizedPath);
    setModuleState(deriveModuleFromPath(normalizedPath));
    if (locationKeyRef.current !== nextKey) {
      locationKeyRef.current = nextKey;
      setPageDataState({});
    }
  }, [location.pathname, location.search]);

  const setModule = useCallback((nextModule) => {
    setModuleState((prev) => {
      if (!nextModule) return prev ?? DEFAULT_MIRA_MODULE;
      return nextModule;
    });
  }, []);

  const setPage = useCallback((nextPage) => {
    setPageState((prev) => {
      if (typeof nextPage === "function") {
        const computed = nextPage(prev);
        return normalizeRoutePath(computed);
      }
      return normalizeRoutePath(nextPage);
    });
  }, []);

  const setPageData = useCallback((updater) => {
    setPageDataState((prev) => {
      if (typeof updater === "function") {
        const next = updater(prev);
        return isPlainObject(next) ? next : prev;
      }
      if (!isPlainObject(updater)) {
        return prev;
      }
      return { ...prev, ...updater };
    });
  }, []);

  const resetPageData = useCallback(() => {
    setPageDataState({});
  }, []);

  const getContext = useCallback(() => {
    return {
      module: module ?? DEFAULT_MIRA_MODULE,
      page,
      pageData,
    };
  }, [module, page, pageData]);

  const value = useMemo(() => {
    return {
      module: module ?? DEFAULT_MIRA_MODULE,
      page,
      pageData,
      setModule,
      setPage,
      setPageData,
      resetPageData,
      getContext,
    };
  }, [module, page, pageData, setModule, setPage, setPageData, resetPageData, getContext]);

  return <MiraContextContext.Provider value={value}>{children}</MiraContextContext.Provider>;
}

export function useMiraContext() {
  const ctx = useContext(MiraContextContext);
  if (!ctx) {
    throw new Error("useMiraContext must be used within a MiraContextProvider");
  }
  return ctx;
}
