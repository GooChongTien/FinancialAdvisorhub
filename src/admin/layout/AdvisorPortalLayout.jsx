import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { supabase } from "@/admin/api/supabaseClient";
import InlineChatPanel from "@/admin/components/mira/InlineChatPanel.jsx";
import MiraActionTestPanel from "@/admin/components/MiraActionTestPanel.jsx";
import adviseULogo from "@/admin/components/ui/advise_u_logo.png";
import adviseUShield from "@/admin/components/ui/adviseU.png";
import { Avatar, AvatarFallback } from "@/admin/components/ui/avatar";
import { Button } from "@/admin/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import { MiraDrawerProvider, useMiraDrawer } from "@/admin/state/MiraDrawerProvider.jsx";
import { MiraChatProvider, useMiraChat } from "@/admin/state/providers/MiraChatProvider.jsx";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Briefcase,
  Calculator,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  LineChart,
  Loader2,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Radio,
  Settings,
  Sparkles,
  Users
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const navigationItems = [
  { title: "Home", url: "/advisor/home", icon: Home },
  { title: "Customer", url: "/advisor/customer", icon: Users },
  { title: "New Business", url: "/advisor/new-business", icon: Briefcase },
  { title: "Visualizer", url: "/advisor/visualizer", icon: LineChart },
  { title: "Products", url: "/advisor/product", icon: Calculator },
  { title: "Analytics", url: "/advisor/analytics", icon: BarChart3 },
  { title: "To Do", url: "/advisor/todo", icon: CheckSquare, showOverdue: true },
  { title: "Broadcast", url: "/advisor/broadcast", icon: Radio, showUnread: true },
  // NOTE: Mira Ops page is accessible via direct URL (/advisor/ops) but hidden from sidebar
  // See MIRA_CONSOLIDATED_IMPLEMENTATION_PLAN.md - Future Sprint: Move to Admin Portal
  // { title: "Mira Ops", url: "/advisor/ops", icon: Activity },
];

export default function AdvisorPortalLayout() {
  return (
    <MiraChatProvider>
      <MiraDrawerProvider>
        <LayoutWithChatProvider />
      </MiraDrawerProvider>
    </MiraChatProvider>
  );
}

function LayoutWithChatProvider() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return (
      window.localStorage.getItem("advisorhub:sidebar-collapsed") === "true"
    );
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      "advisorhub:sidebar-collapsed",
      String(sidebarCollapsed),
    );
  }, [sidebarCollapsed]);

  // Apply sidebar-collapsed class to body for CSS calculations
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (sidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [sidebarCollapsed]);

  // Listen for auto-collapse event from chat panel
  useEffect(() => {
    const handleAutoCollapse = () => {
      setSidebarCollapsed(true);
    };
    window.addEventListener("mira:auto-collapse-sidebar", handleAutoCollapse);
    return () => window.removeEventListener("mira:auto-collapse-sidebar", handleAutoCollapse);
  }, []);



  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => adviseUAdminApi.auth.me(),
    staleTime: Infinity,
  });

  // Unread broadcasts (per-session) indicator
  const { data: broadcasts = [] } = useQuery({
    queryKey: ["nav-broadcasts"],
    queryFn: () =>
      adviseUAdminApi.entities.Broadcast.list("-published_date", 50),
    staleTime: 60_000,
  });
  const [broadcastReadTick, setBroadcastReadTick] = useState(0);
  useEffect(() => {
    const onRead = () => setBroadcastReadTick((t) => t + 1);
    if (typeof window !== "undefined") {
      window.addEventListener("advisorhub:broadcast-read", onRead);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("advisorhub:broadcast-read", onRead);
      }
    };
  }, []);

  const unreadCount = useMemo(() => {
    try {
      if (typeof window === "undefined") return 0;
      return (broadcasts || []).reduce((acc, b) => {
        const key = `advisorhub:broadcast-read:${b.id}`;
        const read = window.sessionStorage.getItem(key) === "1";
        return acc + (read ? 0 : 1);
      }, 0);
    } catch {
      return 0;
    }
  }, [broadcasts, broadcastReadTick]);

  const { data: todoItems = [] } = useQuery({
    queryKey: ["nav-todo-overdue"],
    queryFn: () =>
      adviseUAdminApi.entities.Task.list?.("-date", 100) ??
      adviseUAdminApi.entities.Task.filter?.({ status: "overdue" }) ??
      [],
    staleTime: 60_000,
  });

  const overdueCount = useMemo(() => {
    if (!todoItems || !Array.isArray(todoItems)) return 0;
    return todoItems.filter((task) => {
      const dateValue = task?.due_date ?? task?.date; // support both schemas
      if (!dateValue) return false;
      const due = new Date(dateValue);
      if (isNaN(due.getTime())) return false;
      const now = new Date();
      const isPastDue = due < now;
      // If a status field exists, treat completed/done/closed as not overdue; otherwise assume open
      const status = typeof task?.status === 'string' ? task.status.toLowerCase() : '';
      const isOpen = status ? !["completed", "done", "closed"].includes(status) : true;
      return isPastDue && isOpen;
    }).length;
  }, [todoItems]);

  const {
    recentThreads,
    activeThreadId,
    setActiveThread,
    isLoadingRecent: isLoadingChats,
    recentError: chatsError,
  } = useMiraChat();

  const { open, width, openDrawer, close: closeDrawer, setWidth } = useMiraDrawer();

  // Auto-close drawer when on full chat page
  useEffect(() => {
    if (location.pathname === "/advisor/chat" && open) {
      closeDrawer();
    }
  }, [location.pathname, open, closeDrawer]);
  // Keyboard shortcuts: Esc closes drawer; Ctrl+/ toggles
  React.useEffect(() => {
    function onKey(e) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey;
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        closeDrawer();
      } else if (e.key === '/' && ctrlOrMeta) {
        e.preventDefault();
        if (open) closeDrawer(); else openDrawer();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, openDrawer, closeDrawer]);

  const handleNewChat = React.useCallback(() => {
    setActiveThread(null);
    // Always open full-screen chat page first (as requested)
    // Pass current route so chat page can shrink back to drawer and return
    const from = encodeURIComponent(location.pathname + location.search);
    navigate(`/advisor/chat?from=${from}`);
  }, [location.pathname, location.search, navigate, setActiveThread]);

  // Auth gate: redirect unauthenticated users to Login; if authenticated and on Login/Register, go Home
  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getUser();
        const authed = !!data?.user?.id;
        const path = location.pathname;
        const loginPath = "/login";
        const registerPath = "/register";
        const onAuthPage = path === loginPath || path === registerPath;

        if (mounted) {
          setAuthLoading(false);
        }

        if (!authed && !onAuthPage) {
          navigate(loginPath, { replace: true });
        }
        if (authed && onAuthPage) {
          navigate("/advisor/home", { replace: true });
        }
      } catch (_) {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }
    checkAuth();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      if (!mounted) return;
      checkAuth();
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    try {
      await adviseUAdminApi.auth.logout();
    } catch (_) { }
    try {
      queryClient.clear();
    } catch (_) { }
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("analyticsPrefs");
      }
    } catch (_) { }
    navigate("/login", { replace: true });
    // Force a hard refresh to clear any in-memory state
    if (typeof window !== "undefined") {
      setTimeout(() => window.location.reload(), 50);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background-tertiary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-500" />
          <p className="mt-4 text-sm text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background-tertiary">
        {/* Sidebar - S360fMenu Style */}
        <aside
          className={cn(
            "fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-menu-background text-menu-text transition-all duration-300",
            sidebarCollapsed ? "w-[74px]" : "w-64",
          )}
        >
          {/* Logo Section */}
          <div className="relative flex flex-col items-center px-2 py-6">
            <img
              src={sidebarCollapsed ? adviseUShield : adviseULogo}
              alt="AdviseU Logo"
              className={`transition-all duration-300 ${sidebarCollapsed ? "h-10 w-10 object-contain" : "h-10 w-auto"
                }`}
            />
            <div
              className={cn(
                "mt-5 border-t border-menu-divider transition-all duration-300",
                sidebarCollapsed ? "w-10" : "w-full",
              )}
            />

            {/* Toggle Button - Aligned with divider */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute flex items-center justify-center rounded-lg border border-menu-divider bg-menu-background p-1.5 text-menu-text transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              style={{
                top: "calc(40px + 20px + 2.5px)", // logo height (40px) + margin-top (20px) + half border height
                left: sidebarCollapsed
                  ? "calc(100% - 18px)"
                  : "calc(100% - 12px)",
                width: "36px",
                height: "36px",
                zIndex: 10,
              }}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-6 w-6" />
              ) : (
                <ChevronLeft className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Navigation - S360fMenu Style */}
          <nav className="flex flex-1 flex-col gap-4 px-2 overflow-hidden">
            <div className="flex flex-col gap-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    title={item.title}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative flex items-center rounded-lg text-menu-text transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
                      sidebarCollapsed
                        ? "h-10 w-10 justify-center p-2"
                        : "gap-3 px-2 py-2",
                      isActive ? "bg-menu-active" : "hover:bg-white/10",
                    )}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded bg-white/80"
                      />
                    )}
                    <div className="relative">
                      <item.icon className="h-6 w-6 flex-shrink-0" />
                      {item.showUnread && unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-300/80 px-1 text-[10px] font-semibold text-neutral-900">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                      {item.showOverdue && overdueCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-300/80 px-1 text-[10px] font-semibold text-neutral-900">
                          {overdueCount > 9 ? "9+" : overdueCount}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="flex items-center gap-2 text-label-l-semibold capitalize">
                        {item.title}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div
              className={cn(
                "mt-4",
                sidebarCollapsed
                  ? "flex justify-center"
                  : "flex flex-col flex-1 overflow-hidden",
              )}
            >
              <Button
                onClick={handleNewChat}
                variant="outline"
                className={cn(
                  "items-center justify-center gap-2 rounded-lg border-white/20 bg-white/5 text-label-l-semibold text-white shadow-sm transition hover:bg-white/10",
                  (sidebarCollapsed || location.pathname === "/advisor/home" || location.pathname === "/advisor/chat") ? "hidden" : "flex w-full",
                )}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-sky-400 text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                {!sidebarCollapsed && (
                  <span className="text-sm font-semibold">Ask Mira</span>
                )}
              </Button>
              {sidebarCollapsed && (
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-sky-400 text-white shadow-sm transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
                  title="Ask Mira"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              )}

              <ChatSidebar
                sidebarCollapsed={sidebarCollapsed}
                threads={recentThreads}
                activeThreadId={activeThreadId}
                isLoading={isLoadingChats}
                error={chatsError}
                onSelectThread={(threadId) => {
                  setActiveThread(threadId);
                  navigate("/advisor/chat");
                }}
                onViewAll={() => navigate("/advisor/chat-history")}
              />
            </div>
          </nav>

          {/* User Profile Section - Bottom */}
          <div className="mt-auto border-t border-menu-divider px-2 py-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center rounded-lg text-menu-text transition-all duration-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
                    sidebarCollapsed
                      ? "h-10 w-10 justify-center p-2"
                      : "w-full gap-3 px-2 py-2",
                  )}
                  title={user?.full_name || "User menu"}
                >
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-white/20 text-xs font-semibold text-white">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-label-l-semibold capitalize text-white">
                        {user?.full_name || "User"}
                      </p>
                      <p className="text-label-s capitalize text-white/70">
                        {user?.role || "Agent"}
                      </p>
                    </div>
                  )}
                  {!sidebarCollapsed && (
                    <ChevronDown className="h-4 w-4 text-white/70" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={sidebarCollapsed ? "end" : "start"}
                side="right"
                className="w-56"
              >
                <div className="px-2 py-2">
                  <p className="text-sm font-medium text-foreground-primary">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-foreground-secondary">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/advisor/profile")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Content with optional left drawer push */}
        <main
          className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[74px]" : "ml-64"}`}
          style={open ? { marginLeft: `calc(${sidebarCollapsed ? "74px" : "256px"} + ${width}px)` } : undefined}
        >
          <Outlet />
        </main>

        {/* Left Drawer (placeholder content for now; chat stream wiring next) */}
        {open && (
          <div
            className="fixed top-0 bottom-0 left-[var(--sidebar-left,0px)] z-40 flex flex-col border-r border-slate-200 bg-white shadow-xl"
            style={{
              left: sidebarCollapsed ? 74 : 256,
              width,
            }}
            role="dialog"
            aria-label="Mira chat drawer"
          >
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-pink-400 via-purple-400 to-sky-400 text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-semibold text-slate-800">Mira</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate("/advisor/chat")}
                  title="Open full screen"
                >
                  Full screen
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={closeDrawer}
                  aria-label="Close Mira drawer"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <InlineChatPanel />
            </div>
            <div className="h-2 cursor-col-resize bg-slate-100" onMouseDown={(e) => {
              // simple drag-to-resize
              const startX = e.clientX;
              const startWidth = width;
              const onMove = (ev) => setWidth(startWidth + (ev.clientX - startX));
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }} />
          </div>
        )}
      </div>
      <MiraActionTestPanel />
    </>
  );
}

function ChatSidebar({
  sidebarCollapsed,
  threads = [],
  activeThreadId,
  isLoading,
  error,
  onSelectThread,
  onViewAll,
}) {
  const hasThreads = Array.isArray(threads) && threads.length > 0;

  if (sidebarCollapsed) {
    return (
      <div className="mt-4 flex flex-col items-center gap-2">
        {isLoading && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {threads.slice(0, 6).map((thread) => {
          const isActive = activeThreadId === thread.id;
          return (
            <button
              key={thread.id}
              type="button"
              onClick={() => onSelectThread(thread.id)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
                isActive && "bg-white/20 text-white",
              )}
              title={thread.title || "Mira chat"}
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
        Chats
      </span>
      <div className="mt-3 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-lg bg-white/10"
              />
            ))}
          </div>
        )}
        {!isLoading && error && (
          <div className="rounded-lg bg-white/10 px-3 py-4 text-xs text-white/70">
            Could not load recent chats.{" "}
            <button
              type="button"
              onClick={onViewAll}
              className="underline transition hover:text-white"
            >
              View all
            </button>
          </div>
        )}
        {!isLoading && !error && !hasThreads && (
          <div className="rounded-lg bg-white/5 px-3 py-4 text-xs text-white/70">
            Start a conversation with Mira to see it here.
          </div>
        )}
        {!isLoading &&
          !error &&
          hasThreads &&
          threads.map((thread) => {
            const isActive = activeThreadId === thread.id;
            const subtitle =
              thread.lastMessagePreview ||
              (thread.lastMessageRole === "assistant"
                ? "Assistant replied"
                : "You sent a message");
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectThread(thread.id)}
                className={cn(
                  "mb-1 flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left text-white/80 transition last:mb-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
                  isActive ? "bg-white/15" : "hover:bg-white/10",
                )}
              >
                <MessageCircle
                  className={cn(
                    "mt-0.5 h-5 w-5 flex-shrink-0",
                    isActive ? "text-primary-100" : "text-white/70",
                  )}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-white">
                      {thread.title || "Untitled chat"}
                    </span>
                    <span className="flex-shrink-0 text-xs text-white/50">
                      {formatRelativeTime(thread.updatedAt)}
                    </span>
                  </div>
                  <span className="truncate text-xs text-white/60">
                    {subtitle}
                  </span>
                </div>
              </button>
            );
          })}
      </div>
      <div className="mt-3 border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={onViewAll}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
        >
          <MoreHorizontal className="h-4 w-4" />
          All Chats
        </button>
      </div>
    </div>
  );
}
