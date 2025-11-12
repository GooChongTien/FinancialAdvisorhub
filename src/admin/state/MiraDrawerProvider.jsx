import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const MiraDrawerContext = createContext(null);
const STORAGE_KEY = "advisorhub:mira-drawer";

function loadState() {
  try {
    if (typeof window === "undefined") return { open: false, width: 360 };
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { open: false, width: 360 };
    const parsed = JSON.parse(raw);
    return {
      open: Boolean(parsed.open),
      width: Math.max(280, Math.min(640, Number(parsed.width) || 360)),
    };
  } catch {
    return { open: false, width: 360 };
  }
}

function saveState(state) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function MiraDrawerProvider({ children }) {
  const [{ open, width }, setState] = useState(loadState);

  useEffect(() => {
    saveState({ open, width });
  }, [open, width]);

  const openFull = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const openDrawer = useCallback(() => setState((s) => ({ ...s, open: true })), []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const setWidth = useCallback((w) => setState((s) => ({ ...s, width: Math.max(280, Math.min(640, Number(w) || 360)) })), []);

  const value = useMemo(
    () => ({ open, width, openFull, openDrawer, close, setWidth }),
    [open, width, openFull, openDrawer, close, setWidth]
  );

  return <MiraDrawerContext.Provider value={value}>{children}</MiraDrawerContext.Provider>;
}

export function useMiraDrawer() {
  const ctx = useContext(MiraDrawerContext);
  if (!ctx) throw new Error("useMiraDrawer must be used within MiraDrawerProvider");
  return ctx;
}

