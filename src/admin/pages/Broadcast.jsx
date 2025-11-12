import React, { useState, useCallback } from "react";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Badge } from "@/admin/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import {
  Radio,
  Pin,
  Calendar,
  GraduationCap,
  Megaphone,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { Input } from "@/admin/components/ui/input";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import { Button } from "@/admin/components/ui/button";
import SearchFilterBar from "@/admin/components/ui/search-filter-bar.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/admin/components/ui/popover";
import { ArrowUpDown, Filter as FilterIcon, Plus } from "lucide-react";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/admin/components/ui/dialog";
import { Textarea } from "@/admin/components/ui/textarea";
import { useToast } from "@/admin/components/ui/toast";
import useMiraPopupListener from "@/admin/hooks/useMiraPopupListener.js";
import { MIRA_POPUP_TARGETS } from "@/lib/mira/popupTargets.ts";

export default function Broadcast() {
  const categoryStorageKey = "advisorhub:broadcast-category";
  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (typeof window === "undefined") return "all";
    return window.sessionStorage.getItem(categoryStorageKey) ?? "all";
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(categoryStorageKey, selectedCategory);
  }, [selectedCategory, categoryStorageKey]);

  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ["broadcasts"],
    queryFn: () => adviseUAdminApi.entities.Broadcast.list("-published_date"),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const categories = [
    { id: "all", label: "All", icon: Radio },
    { id: "Announcement", label: "Announcements", icon: Megaphone },
    { id: "Training", label: "Training", icon: GraduationCap },
    { id: "Campaign", label: "Campaigns", icon: TrendingUp },
  ];

  const pinnedBroadcasts = broadcasts.filter((b) => b.is_pinned);
  const regularBroadcasts = broadcasts.filter((b) => !b.is_pinned);
  const { showToast } = useToast();
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({
    title: "",
    audience: "All Advisors",
    message: "",
  });

  useMiraPopupListener(MIRA_POPUP_TARGETS.BROADCAST_COMPOSER, ({ action }) => {
    const payload = action?.payload ?? {};
    setComposeForm((prev) => ({
      ...prev,
      title: typeof payload.title === "string" ? payload.title : prev.title,
      audience: typeof payload.audience === "string" ? payload.audience : prev.audience,
      message: typeof payload.message === "string" ? payload.message : prev.message,
    }));
    setComposeDialogOpen(true);
    return () => setComposeDialogOpen(false);
  });

  const resetComposeForm = useCallback(() => {
    setComposeForm({
      title: "",
      audience: "All Advisors",
      message: "",
    });
  }, []);

  const submitComposeForm = () => {
    showToast({
      type: "success",
      title: "Broadcast draft prepared",
      description: "Review the draft and publish when ready.",
    });
    setComposeDialogOpen(false);
    resetComposeForm();
  };

  // Search across title and content
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");

  const matchesSearch = (b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(b.title || "").toLowerCase().includes(q) ||
      String(b.content || "").toLowerCase().includes(q)
    );
  };

  const filteredBroadcasts = React.useMemo(() => {
    let result = selectedCategory === "all"
      ? regularBroadcasts
      : regularBroadcasts.filter((b) => b.category === selectedCategory);

    result = result.filter(matchesSearch);

    // Apply sorting
    if (sortBy === "date-desc") {
      result.sort((a, b) => new Date(b.published_date) - new Date(a.published_date));
    } else if (sortBy === "date-asc") {
      result.sort((a, b) => new Date(a.published_date) - new Date(b.published_date));
    } else if (sortBy === "title-asc") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [regularBroadcasts, selectedCategory, search, sortBy]);

  const visiblePinned = pinnedBroadcasts.filter(matchesSearch);
  const [readTick, setReadTick] = useState(0);
  React.useEffect(() => {
    const onRead = () => setReadTick((t) => t + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener('advisorhub:broadcast-read', onRead);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('advisorhub:broadcast-read', onRead);
      }
    };
  }, []);

  const getCategoryColor = (category) => {
    // 360F token-aligned badges
    const colors = {
      Announcement: "bg-blue-50 text-blue-700 border border-blue-200",
      Training: "bg-teal-50 text-teal-700 border border-teal-200",
      Campaign: "bg-orange-50 text-orange-700 border border-orange-200",
    };
    return colors[category] || "bg-slate-50 text-slate-700 border border-slate-200";
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Announcement: Megaphone,
      Training: GraduationCap,
      Campaign: TrendingUp,
    };
    return icons[category] || Radio;
  };

  const readKey = (id) => `advisorhub:broadcast-read:${id}`;
  const isRead = (id) => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem(readKey(id)) === "1";
  };
  const markRead = (id) => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(readKey(id), "1");
      window.dispatchEvent(new CustomEvent('advisorhub:broadcast-read', { detail: { id } }));
    } catch {}
  };
  const navigate = useNavigate();
  const openDetail = (b) => {
    markRead(b.id);
    navigate(createPageUrl(`BroadcastDetail?id=${b.id}`));
  };

  const markAllVisibleAsRead = () => {
    try {
      const all = [...visiblePinned, ...filteredBroadcasts];
      all.forEach((b) => window.sessionStorage.setItem(readKey(b.id), "1"));
      window.dispatchEvent(new CustomEvent('advisorhub:broadcast-read', { detail: { all: true } }));
      setReadTick((t) => t + 1);
    } catch {}
  };

  useMiraPageData(
    () => ({
      view: "broadcast_feed",
      selectedCategory,
      search,
      sortBy,
      pinnedCount: visiblePinned.length,
      visibleCount: filteredBroadcasts.length,
    }),
    [selectedCategory, search, sortBy, visiblePinned.length, filteredBroadcasts.length],
  );

  const BroadcastCard = ({ broadcast, isPinned = false }) => {
    const CategoryIcon = getCategoryIcon(broadcast.category);

    return (
      <Card
        className={`group overflow-hidden shadow-md transition-all hover:shadow-lg ${
          isPinned
            ? "border border-primary-200 bg-gradient-to-br from-primary-50 to-background-elevated"
            : "border border-border-default bg-background-elevated"
        }`}
        onMouseEnter={() => markRead(broadcast.id)}
        onClick={() => openDetail(broadcast)}
      >
        {/* Accent bar */}
        <div className={`h-0.5 w-full ${isPinned ? "bg-primary-500" : "bg-border-muted"}`} />
        <CardHeader className="border-b border-border-muted">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                {isPinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700 border border-primary-200">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                )}
                {!isRead(broadcast.id) && (
                  <span title="Unread" className="inline-block h-2 w-2 rounded-full bg-primary-500" />
                )}
                <Badge className={getCategoryColor(broadcast.category)}>
                  <CategoryIcon className="mr-1 h-3 w-3" />
                  {broadcast.category}
                </Badge>
              </div>
              <CardTitle className="text-xl text-foreground-primary group-hover:text-primary-600 transition-colors">{search ? (
                <>{/* highlight title */}{highlight(broadcast.title)}</>
              ) : (
                broadcast.title
              )}
              </CardTitle>
              <div className="mt-2 flex items-center gap-2 text-sm text-foreground-secondary">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(
                    new Date(broadcast.published_date),
                    "MMM d, yyyy h:mm a",
                  )}
                </span>
              </div>
            </div>
            <div className="hidden sm:flex items-center text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Read more
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground-secondary line-clamp-3">
            {search ? highlight(broadcast.content) : broadcast.content}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
        <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Broadcast Center"
          subtitle="Stay updated with the latest news and announcements"
          icon={Radio}
        />

        {/* Unified Search/Filter/Sort Bar */}
        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Search announcements..."
          filterButton={
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={selectedCategory !== "all" ? "default" : "outline"}
                  size="icon"
                  className={selectedCategory !== "all" ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
                  title="Filter"
                >
                  <FilterIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 mb-3">Filter by Category</h4>
                    <div className="space-y-2">
                      {categories.map((category) => {
                        const Icon = category.icon;
                        const count =
                          category.id === "all"
                            ? broadcasts.length
                            : broadcasts.filter((b) => b.category === category.id).length;

                        return (
                          <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => setSelectedCategory(category.id)}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {category.label} ({count})
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          }
          sortButton={
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={sortBy !== "date-desc" ? "default" : "outline"}
                  size="icon"
                  className={sortBy !== "date-desc" ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
                  title="Sort"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-slate-900 mb-3">Sort by</h4>
                  <div className="space-y-2">
                    <Button
                      variant={sortBy === "date-desc" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSortBy("date-desc")}
                    >
                      Newest First
                    </Button>
                    <Button
                      variant={sortBy === "date-asc" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSortBy("date-asc")}
                    >
                      Oldest First
                    </Button>
                    <Button
                      variant={sortBy === "title-asc" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSortBy("title-asc")}
                    >
                      Title (A-Z)
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          }
          rightActions={
            <Button
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={() => setComposeDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Compose
            </Button>
          }
        />

        {/* Content */}
        {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="shadow-lg">
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pinned Broadcasts */}
              {visiblePinned.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-slate-900">
                      Pinned Announcements
                    </h2>
                  </div>
                  {visiblePinned.map((broadcast) => (
                    <BroadcastCard
                      key={broadcast.id}
                      broadcast={broadcast}
                      isPinned
                    />
                  ))}
                </div>
              )}

              {/* Regular Broadcasts */}
              {filteredBroadcasts.length > 0 && (
                <div className="space-y-4">
                  {visiblePinned.length > 0 && (
                    <h2 className="mt-8 text-lg font-semibold text-slate-900">
                      Recent Updates
                    </h2>
                  )}
                  {filteredBroadcasts.map((broadcast) => (
                    <BroadcastCard key={broadcast.id} broadcast={broadcast} />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {filteredBroadcasts.length === 0 &&
                visiblePinned.length === 0 && (
                  <Card className="shadow-lg">
                    <CardContent className="p-12 text-center">
                      <Radio className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                      <h3 className="mb-2 text-lg font-semibold text-slate-900">
                        No broadcasts yet
                      </h3>
                      <p className="text-slate-500">
                        Check back later for updates
                      </p>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}

        {/* Detail page handled by BroadcastDetail route */}
        </div>
      </div>

      <Dialog
        open={composeDialogOpen}
        onOpenChange={(open) => {
          setComposeDialogOpen(open);
          if (!open) resetComposeForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Broadcast</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="broadcast-title">
                Title
              </label>
              <Input
                id="broadcast-title"
                value={composeForm.title}
                onChange={(e) => setComposeForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter announcement title"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="broadcast-audience">
                Audience
              </label>
              <Input
                id="broadcast-audience"
                value={composeForm.audience}
                onChange={(e) => setComposeForm((prev) => ({ ...prev, audience: e.target.value }))}
                placeholder="All Advisors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="broadcast-message">
                Message
              </label>
              <Textarea
                id="broadcast-message"
                value={composeForm.message}
                onChange={(e) => setComposeForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Write your announcement..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setComposeDialogOpen(false); resetComposeForm(); }}>
              Cancel
            </Button>
            <Button className="bg-primary-600 text-white hover:bg-primary-700" onClick={submitComposeForm}>
              Save Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
