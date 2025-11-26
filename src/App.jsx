import ChatPanelOverlay from "@/admin/components/mira/ChatPanelOverlay.jsx";
import { SplitViewWrapper } from "@/admin/components/mira/SplitViewWrapper.jsx";
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
import ScenarioVisualizer from "@/admin/pages/ScenarioVisualizer.jsx";
import ServiceRequestDetail from "@/admin/pages/ServiceRequestDetail.jsx";
import ServiceRequests from "@/admin/pages/ServiceRequests.jsx";
import SmartPlan from "@/admin/pages/SmartPlan.jsx";
import SmartPlanDetail from "@/admin/pages/SmartPlanDetail.jsx";
import { AgentChatProvider } from "@/admin/state/providers/AgentChatProvider.jsx";
import { MiraContextProvider } from "@/admin/state/providers/MiraContextProvider.jsx";
import { MiraConfirmProvider } from "@/lib/mira/useMiraConfirm";
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

            {/* Advisor Portal Routes - Wrapped with SplitViewWrapper for Cmd+K shortcut */}
            <Route path="/advisor" element={
              <SplitViewWrapper>
                <AdvisorPortalLayout />
              </SplitViewWrapper>
            }>
              <Route index element={<Navigate to="/advisor/home" replace />} />
              <Route path="home" element={<Home />} />
              <Route path="customers" element={<Customer />} />
              <Route path="customers/detail" element={<CustomerDetail />} />
              <Route path="new-business" element={<NewBusiness />} />
              <Route path="product" element={<Product />} />
              <Route path="service-requests" element={<ServiceRequests />} />
              <Route path="service-requests/detail" element={<ServiceRequestDetail />} />
              <Route path="quote-summary" element={<QuoteSummary />} />
              <Route path="proposals/detail" element={<ProposalDetail />} />
              <Route path="policies/detail" element={<PolicyDetail />} />
              <Route path="profile-settings" element={<ProfileSettings />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="news" element={<Broadcast />} />
              <Route path="news/detail" element={<BroadcastDetail />} />
              {/* Legacy aliases */}
              <Route path="broadcast" element={<Navigate to="/advisor/news" replace />} />
              <Route path="broadcast/detail" element={<Navigate to="/advisor/news/detail" replace />} />
              <Route path="smart-plan" element={<SmartPlan />} />
              <Route path="smart-plan/detail" element={<SmartPlanDetail />} />
              <Route path="visualizers" element={<ScenarioVisualizer />} />
              <Route path="todo" element={<Navigate to="/advisor/smart-plan" replace />} />
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
