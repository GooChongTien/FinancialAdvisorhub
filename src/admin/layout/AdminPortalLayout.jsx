import { supabase } from "@/admin/api/supabaseClient";
import {
    Activity,
    Bot,
    LayoutDashboard,
    LogOut,
    MessageSquare,
    Users,
    Wrench
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export default function AdminPortalLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    const menuItems = [
        { label: "Workflows", path: "/admin/workflows", icon: <Bot className="w-4 h-4" /> },
        { label: "Tools", path: "/admin/tools", icon: <Wrench className="w-4 h-4" /> },
        { label: "Intents", path: "/admin/intents", icon: <MessageSquare className="w-4 h-4" /> },
        { label: "Executions", path: "/admin/executions", icon: <Activity className="w-4 h-4" /> },
        { label: "Advisors", path: "/admin/advisors", icon: <Users className="w-4 h-4" /> },
    ];

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-4 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Mira Admin</h1>
                            <p className="text-xs text-slate-400">Agent Builder</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {menuItems.find(i => location.pathname.startsWith(i.path))?.label || "Dashboard"}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500">
                            Admin Portal
                        </div>
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                            AD
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
