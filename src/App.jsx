import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AdminLayout from "@/admin/layout/AdminLayout.jsx";
import Home from "@/admin/pages/Home.jsx";
import Customer from "@/admin/pages/Customer.jsx";
import CustomerDetail from "@/admin/pages/CustomerDetail.jsx";
import NewBusiness from "@/admin/pages/NewBusiness.jsx";
import Product from "@/admin/pages/Product.jsx";
import QuoteSummary from "@/admin/pages/QuoteSummary.jsx";
import ProposalDetail from "@/admin/pages/ProposalDetail.jsx";
import PolicyDetail from "@/admin/pages/PolicyDetail.jsx";
import ProfileSettings from "@/admin/pages/ProfileSettings.jsx";
import Analytics from "@/admin/pages/Analytics.jsx";
import Broadcast from "@/admin/pages/Broadcast.jsx";
import BroadcastDetail from "@/admin/pages/BroadcastDetail.jsx";
import ToDo from "@/admin/pages/ToDo.jsx";
import ChatMira from "@/admin/pages/ChatMira.jsx";
import AllChats from "@/admin/pages/AllChats.jsx";
import ChatPanelOverlay from "@/admin/components/mira/ChatPanelOverlay.jsx";
import { pageRoutes } from "@/admin/utils";
import Register from "@/admin/pages/Register.jsx";
import Login from "@/admin/pages/Login.jsx";
import MiraQuickstart from "@/pages/MiraQuickstart.jsx";
import MiraOps from "@/admin/pages/MiraOps.jsx";
import { MiraContextProvider } from "@/admin/state/providers/MiraContextProvider.jsx";
import { MiraConfirmProvider } from "@/lib/mira/useMiraConfirm";
import { useGlobalKeyboardShortcuts } from "@/admin/hooks/useGlobalKeyboardShortcuts";
import { AgentChatProvider } from "@/admin/state/providers/AgentChatProvider.jsx";

function LayoutContainer() {
  // Enable global keyboard shortcuts
  useGlobalKeyboardShortcuts();
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

export default function App() {
  return (
    <MiraConfirmProvider>
      <MiraContextProvider>
        <AgentChatProvider>
          <Routes>
          {/* Public routes (no side menu) */}
          <Route path={pageRoutes.Login} element={<Login />} />
          <Route path={pageRoutes.Register} element={<Register />} />
          <Route
            path={pageRoutes.MiraQuickstart}
            element={<MiraQuickstart />}
          />

          {/* Protected routes (with side menu) */}
          <Route element={<LayoutContainer />}>
            <Route path={pageRoutes.Home} element={<Home />} />
            <Route path={pageRoutes.Customer} element={<Customer />} />
            <Route path={pageRoutes.CustomerDetail} element={<CustomerDetail />} />
            <Route path={pageRoutes.NewBusiness} element={<NewBusiness />} />
            <Route path={pageRoutes.Product} element={<Product />} />
            <Route path={pageRoutes.QuoteSummary} element={<QuoteSummary />} />
            <Route path={pageRoutes.ProposalDetail} element={<ProposalDetail />} />
            <Route path={pageRoutes.PolicyDetail} element={<PolicyDetail />} />
            <Route
              path={pageRoutes.ProfileSettings}
              element={<ProfileSettings />}
            />
            <Route path={pageRoutes.Analytics} element={<Analytics />} />
            <Route path={pageRoutes.Broadcast} element={<Broadcast />} />
            <Route path={pageRoutes.BroadcastDetail} element={<BroadcastDetail />} />
            <Route path={pageRoutes.ToDo} element={<ToDo />} />
            <Route path={pageRoutes.ChatMira} element={<ChatMira />} />
            <Route path={pageRoutes.ChatHistory} element={<AllChats />} />
            <Route path={pageRoutes.MiraOps} element={<MiraOps />} />
          </Route>
          <Route path="*" element={<Navigate to={pageRoutes.Home} replace />} />
          </Routes>

          {/* Global chat panel overlay */}
          <ChatPanelOverlay />
        </AgentChatProvider>
      </MiraContextProvider>
    </MiraConfirmProvider>
  );
}
