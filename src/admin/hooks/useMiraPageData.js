import { useEffect } from "react";
import { useMiraContext } from "@/admin/state/providers/MiraContextProvider.jsx";

/**
 * Synchronize Mira page context data with the global provider.
 * Pass a factory that returns a serializable object; dependencies control when it recalculates.
 *
 * @param {() => Record<string, any>} factory - produces the latest page data snapshot
 * @param {any[]} deps - React effect dependencies
 */
export function useMiraPageData(factory, deps = []) {
  const { setPageData } = useMiraContext();

  useEffect(() => {
    if (typeof factory !== "function") return;
    const payload = factory();
    if (payload && typeof payload === "object") {
      setPageData(() => payload);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPageData, ...deps]);
}

export default useMiraPageData;
