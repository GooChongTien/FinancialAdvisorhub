import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  DEFAULT_MIRA_MODULE,
  deriveModuleFromPath,
  normalizeRoutePath,
} from "@/admin/utils/route-module-map.ts";
import { behavioralTracker } from "@/lib/mira/behavioral-tracker.ts";
import { prepareBehavioralContextForAPI } from "@/lib/mira/behavioral-sanitization.ts";

const MiraContextContext = createContext(null);

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function MiraContextProvider({ children }) {
  const location = useLocation();
  const [module, setModuleState] = useState(() => deriveModuleFromPath(location.pathname));
  const [page, setPageState] = useState(() => normalizeRoutePath(location.pathname));
  const [pageData, setPageDataState] = useState({});
  const [behavioralContext, setBehavioralContext] = useState(null);
  const locationKeyRef = useRef("");
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const normalizedPath = normalizeRoutePath(location.pathname);
    const nextKey = `${normalizedPath}|${location.search ?? ""}`;
    setPageState(normalizedPath);
    setModuleState(deriveModuleFromPath(normalizedPath));
    if (locationKeyRef.current !== nextKey) {
      locationKeyRef.current = nextKey;
      setPageDataState({});
    }

    // Track navigation in behavioral tracker
    const prevPath = prevPathRef.current;
    if (prevPath !== normalizedPath) {
      const trigger = location.state?.fromMira ? "mira" : "direct";
      behavioralTracker.recordNavigation(normalizedPath, trigger);
      prevPathRef.current = normalizedPath;
    }

    // Update module in tracker
    const currentModule = deriveModuleFromPath(normalizedPath);
    behavioralTracker.updateModule(currentModule);
  }, [location.pathname, location.search, location.state]);

  // Subscribe to behavioral context updates
  useEffect(() => {
    const unsubscribe = behavioralTracker.subscribe("mira-context-provider", (context) => {
      setBehavioralContext(context);
    });

    // Get initial context
    setBehavioralContext(behavioralTracker.getBehavioralContext());

    return unsubscribe;
  }, []);

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
    const baseContext = {
      module: module ?? DEFAULT_MIRA_MODULE,
      page,
      pageData,
    };

    // Include behavioral context if available and enabled
    if (behavioralContext) {
      const { context, metadata } = prepareBehavioralContextForAPI(behavioralContext);
      return {
        ...baseContext,
        behavioral_context: context,
        behavioral_metadata: metadata,
      };
    }

    return baseContext;
  }, [module, page, pageData, behavioralContext]);

  const getBehavioralContext = useCallback(() => {
    return behavioralContext;
  }, [behavioralContext]);

  const updatePrivacySettings = useCallback((settings) => {
    behavioralTracker.updatePrivacySettings(settings);
  }, []);

  const getPrivacySettings = useCallback(() => {
    return behavioralTracker.getPrivacySettings();
  }, []);

  const clearBehavioralData = useCallback(() => {
    behavioralTracker.clearData();
  }, []);

  const exportBehavioralData = useCallback(() => {
    return behavioralTracker.exportData();
  }, []);

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
      // Behavioral tracking methods
      behavioralContext,
      getBehavioralContext,
      updatePrivacySettings,
      getPrivacySettings,
      clearBehavioralData,
      exportBehavioralData,
    };
  }, [
    module,
    page,
    pageData,
    setModule,
    setPage,
    setPageData,
    resetPageData,
    getContext,
    behavioralContext,
    getBehavioralContext,
    updatePrivacySettings,
    getPrivacySettings,
    clearBehavioralData,
    exportBehavioralData,
  ]);

  return <MiraContextContext.Provider value={value}>{children}</MiraContextContext.Provider>;
}

export function useMiraContext() {
  const ctx = useContext(MiraContextContext);
  if (!ctx) {
    throw new Error("useMiraContext must be used within a MiraContextProvider");
  }
  return ctx;
}
