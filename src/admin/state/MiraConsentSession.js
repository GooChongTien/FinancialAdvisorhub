export function readSessionConsent() {
  try {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem("advisorhub:mira-consent:auto") === "1";
  } catch {
    return false;
  }
}

export function writeSessionConsent(enabled) {
  try {
    if (typeof window === "undefined") return;
    if (enabled) window.sessionStorage.setItem("advisorhub:mira-consent:auto", "1");
    else window.sessionStorage.removeItem("advisorhub:mira-consent:auto");
  } catch {}
}
