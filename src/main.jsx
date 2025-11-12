import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import { ToastProvider } from "@/admin/components/ui/toast";
import "./index.css";
import { PreferencesProvider } from "@/admin/state/PreferencesContext.jsx";
import { LeadDirectoryProvider } from "@/admin/state/LeadDirectoryProvider.jsx";
import { MiraInsightsProvider } from "@/admin/state/providers/MiraInsightsProvider.jsx";
const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {" "}
    <QueryClientProvider client={queryClient}>
      {" "}
      <ToastProvider>
        {" "}
        <BrowserRouter>
          {" "}
          <PreferencesProvider>
            <LeadDirectoryProvider>
              <MiraInsightsProvider>
                <App />{" "}
              </MiraInsightsProvider>
            </LeadDirectoryProvider>
          </PreferencesProvider>
        </BrowserRouter>{" "}
      </ToastProvider>{" "}
    </QueryClientProvider>{" "}
  </React.StrictMode>,
);
