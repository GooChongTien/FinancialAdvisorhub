import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import MiraConfirmationDialog from "@/admin/components/MiraConfirmationDialog";
import type { ExecuteAction } from "./types.ts";

interface ConfirmRequest {
  action: ExecuteAction;
  resolve: (result: boolean) => void;
}

interface MiraConfirmContextValue {
  requestConfirmation: (action: ExecuteAction) => Promise<boolean>;
}

const MiraConfirmContext = createContext<MiraConfirmContextValue | null>(null);

export function MiraConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmRequest | null>(null);

  const requestConfirmation = useCallback((action: ExecuteAction) => {
    return new Promise<boolean>((resolve) => {
      setPending({ action, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (!pending) return;
    pending.resolve(true);
    setPending(null);
  }, [pending]);

  const handleCancel = useCallback(() => {
    if (!pending) return;
    pending.resolve(false);
    setPending(null);
  }, [pending]);

  return (
    <MiraConfirmContext.Provider value={{ requestConfirmation }}>
      {children}
      <MiraConfirmationDialog
        action={pending?.action ?? null}
        isOpen={Boolean(pending)}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </MiraConfirmContext.Provider>
  );
}

export function useMiraConfirm(): MiraConfirmContextValue {
  const ctx = useContext(MiraConfirmContext);
  if (!ctx) {
    throw new Error("useMiraConfirm must be used within a MiraConfirmProvider");
  }
  return ctx;
}

export default useMiraConfirm;
