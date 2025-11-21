import ChatPanelOverlay from "@/admin/components/mira/ChatPanelOverlay.jsx";
import AdminPortalLayout from "@/admin/layout/AdminPortalLayout.jsx";
import AdvisorPortalLayout from "@/admin/layout/AdvisorPortalLayout.jsx";
import AllChats from "@/admin/pages/AllChats.jsx";
import Analytics from "@/admin/pages/Analytics.jsx";
import Broadcast from "@/admin/pages/Broadcast.jsx";
import BroadcastDetail from "@/admin/pages/BroadcastDetail.jsx";
import ChatMira from "@/admin/pages/ChatMira.jsx";
import Customer from "@/admin/pages/Customer.jsx";
import CustomerDetail from "@/admin/pages/CustomerDetail.jsx";
import Home from "@/admin/pages/Home.jsx";
import Login from "@/admin/pages/Login.jsx";
import MiraOps from "@/admin/pages/MiraOps.jsx";
import NewBusiness from "@/admin/pages/NewBusiness.jsx";
import PolicyDetail from "@/admin/pages/PolicyDetail.jsx";
import Product from "@/admin/pages/Product.jsx";
import ProfileSettings from "@/admin/pages/ProfileSettings.jsx";
import ProposalDetail from "@/admin/pages/ProposalDetail.jsx";
import QuoteSummary from "@/admin/pages/QuoteSummary.jsx";
import Register from "@/admin/pages/Register.jsx";
import ToDo from "@/admin/pages/ToDo.jsx";
import { AgentChatProvider } from "@/admin/state/providers/AgentChatProvider.jsx";
import { MiraContextProvider } from "@/admin/state/providers/MiraContextProvider.jsx";
import { MiraConfirmProvider } from "@/lib/mira/useMiraConfirm";
import { useGlobalKeyboardShortcuts } from "@/admin/hooks/useGlobalKeyboardShortcuts";
import MiraQuickstart from "@/pages/MiraQuickstart.jsx";
import { Navigate, Route, Routes } from "react-router-dom";

import WorkflowEditor from "@/admin/pages/admin/WorkflowEditor.jsx";
import WorkflowList from "@/admin/pages/admin/WorkflowList.jsx";

// Placeholder components for Admin Portal (will be implemented in next steps)
import ToolRegistry from "@/admin/pages/admin/ToolRegistry.jsx";

import AdvisorManagement from "@/admin/pages/admin/AdvisorManagement.jsx";
import IntentManager from "@/admin/pages/admin/IntentManager.jsx";

import ExecutionLogs from "@/admin/pages/admin/ExecutionLogs.jsx";

export default function App() {
  return (
    <MiraConfirmProvider>
      <MiraContextProvider>
        <AgentChatProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/quickstart" element={<MiraQuickstart />} />

            {/* Admin Portal Routes */}
            <Route path="/admin" element={<AdminPortalLayout />}>
              <Route index element={<Navigate to="/admin/workflows" replace />} />
              <Route path="workflows" element={<WorkflowList />} />
              <Route path="workflows/:id" element={<WorkflowEditor />} />
              <Route path="tools" element={<ToolRegistry />} />
              <Route path="intents" element={<IntentManager />} />
              <Route path="executions" element={<ExecutionLogs />} />
              <Route path="advisors" element={<AdvisorManagement />} />
            </Route>

            {/* Advisor Portal Routes */}
            <Route path="/advisor" element={<AdvisorPortalLayout />}>
              <Route index element={<Navigate to="/advisor/home" replace />} />
              <Route path="home" element={<Home />} />
              <Route path="customers" element={<Customer />} />
              <Route path="customers/detail" element={<CustomerDetail />} />
              <Route path="new-business" element={<NewBusiness />} />
              <Route path="product" element={<Product />} />
              <Route path="quote-summary" element={<QuoteSummary />} />
              <Route path="proposals/detail" element={<ProposalDetail />} />
              <Route path="policies/detail" element={<PolicyDetail />} />
              <Route path="profile-settings" element={<ProfileSettings />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="broadcast" element={<Broadcast />} />
              <Route path="broadcast/detail" element={<BroadcastDetail />} />
              <Route path="todo" element={<ToDo />} />
              <Route path="chat" element={<ChatMira />} />
              <Route path="chats" element={<AllChats />} />
              <Route path="mira/ops" element={<MiraOps />} />
            </Route>

            {/* Legacy Redirects (handle old /admin/* routes) */}
            <Route path="/admin/home" element={<Navigate to="/advisor/home" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Global chat panel overlay (only visible in Advisor Portal via internal logic) */}
          <ChatPanelOverlay />
        </AgentChatProvider>
      </MiraContextProvider>
    </MiraConfirmProvider>
  );
}
