import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import { Input } from "@/admin/components/ui/input";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/admin/components/ui/popover";
import SearchFilterBar from "@/admin/components/ui/search-filter-bar.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { Textarea } from "@/admin/components/ui/textarea";
import { useToast } from "@/admin/components/ui/toast";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import useMiraPopupListener from "@/admin/hooks/useMiraPopupListener.js";
import { createPageUrl } from "@/admin/utils";
import { MIRA_POPUP_TARGETS } from "@/lib/mira/popupTargets.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowUpDown,
  Calendar,
  Filter as FilterIcon,
  GraduationCap,
  Megaphone,
  Newspaper,
  Pin,
  Plus,
  Radio,
  Sparkles,
  TrendingUp,
  PinOff,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const READ_EVENT = "advisorhub:broadcast-read";
const READ_STORAGE_PREFIX = "advisorhub:news-read";
const LEGACY_READ_PREFIX = "advisorhub:broadcast-read";

const categories = [
  { id: "all", label: "All", icon: Radio },
  { id: "Announcement", label: "Announcements", icon: Megaphone },
  { id: "Training", label: "Training", icon: GraduationCap },
  { id: "Campaign", label: "Campaigns", icon: TrendingUp },
];

export default function News() {
  const categoryStorageKey = "advisorhub:news-category";
  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (typeof window === "undefined") return "all";
    return window.sessionStorage.getItem(categoryStorageKey) ?? "all";
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(categoryStorageKey, selectedCategory);
  }, [selectedCategory, categoryStorageKey]);

  const queryClient = useQueryClient();
  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: () => adviseUAdminApi.entities.Broadcast.list("-published_date"),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const pinnedBroadcasts = broadcasts.filter((b) => b.pinned || b.is_pinned);
  const regularBroadcasts = broadcasts.filter((b) => !(b.pinned || b.is_pinned));
  const { showToast } = useToast();
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({
    title: "",
    audience: "All Advisors",
    category: "Announcement",
    message: "",
  });
  const composeMutation = useMutation({
    mutationFn: async (draft) => adviseUAdminApi.entities.Broadcast.create(draft),
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Draft saved",
        description: "Your news draft is ready for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["news"] }).catch(() => {});
      setComposeDialogOpen(false);
      resetComposeForm();
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Unable to save news item",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  useMiraPopupListener(MIRA_POPUP_TARGETS.BROADCAST_COMPOSER, ({ action }) => {
    const payload = action?.payload ?? {};
    setComposeForm((prev) => ({
      ...prev,
      title: typeof payload.title === "string" ? payload.title : prev.title,
      audience: typeof payload.audience === "string" ? payload.audience : prev.audience,
      message: typeof payload.message === "string" ? payload.message : prev.message,
      category: typeof payload.category === "string" ? payload.category : prev.category,
    }));
    setComposeDialogOpen(true);
    return () => setComposeDialogOpen(false);
  });

  const resetComposeForm = useCallback(() => {
    setComposeForm({
      title: "",
      audience: "All Advisors",
      category: "Announcement",
      message: "",
    });
  }, []);

  const submitComposeForm = () => {
    const draft = {
      title: composeForm.title.trim() || "Untitled news",
      audience: composeForm.audience || "All Advisors",
      category: composeForm.category || "Announcement",
      content: composeForm.message.trim(),
      status: "draft",
    };
    composeMutation.mutate(draft);
  };
  const isSavingDraft = composeMutation.isPending;

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");

  const matchesSearch = useCallback(
    (b) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        String(b.title || "").toLowerCase().includes(q) ||
        String(b.content || "").toLowerCase().includes(q)
      );
    },
    [search],
  );

  const filteredBroadcasts = useMemo(() => {
    let result =
      selectedCategory === "all"
        ? regularBroadcasts
        : regularBroadcasts.filter((b) => b.category === selectedCategory);

    result = result.filter(matchesSearch);

    if (sortBy === "date-desc") {
      result.sort(
        (a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime(),
      );
    } else if (sortBy === "date-asc") {
      result.sort(
        (a, b) => new Date(a.published_date).getTime() - new Date(b.published_date).getTime(),
      );
    } else if (sortBy === "title-asc") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [regularBroadcasts, selectedCategory, matchesSearch, sortBy]);

  const visiblePinned = useMemo(
    () => pinnedBroadcasts.filter(matchesSearch),
    [pinnedBroadcasts, matchesSearch],
  );
  const [readTick, setReadTick] = useState(0);
  React.useEffect(() => {
    const onRead = () => setReadTick((t) => t + 1);
    if (typeof window !== "undefined") {
      window.addEventListener(READ_EVENT, onRead);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(READ_EVENT, onRead);
      }
    };
  }, []);

  const getCategoryColor = (category) => {
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
    return icons[category] || Newspaper;
  };

  const readKey = (id) => `${READ_STORAGE_PREFIX}:${id}`;
  const legacyReadKey = (id) => `${LEGACY_READ_PREFIX}:${id}`;
  const isRead = (id) => {
    if (typeof window === "undefined") return true;
    const store = window.sessionStorage;
    return store.getItem(readKey(id)) === "1" || store.getItem(legacyReadKey(id)) === "1";
  };
  const markRead = (id) => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(readKey(id), "1");
      window.sessionStorage.setItem(legacyReadKey(id), "1");
      window.dispatchEvent(new CustomEvent(READ_EVENT, { detail: { id } }));
      window.dispatchEvent(new CustomEvent("advisorhub:news-read", { detail: { id } }));
    } catch {}
  };
  const navigate = useNavigate();
  const openDetail = (b) => {
    markRead(b.id);
    navigate(createPageUrl(`NewsDetail?id=${b.id}`));
  };

  const markAllVisibleAsRead = () => {
    try {
      const all = [...visiblePinned, ...filteredBroadcasts];
      all.forEach((b) => {
        window.sessionStorage.setItem(readKey(b.id), "1");
        window.sessionStorage.setItem(legacyReadKey(b.id), "1");
      });
      window.dispatchEvent(new CustomEvent(READ_EVENT, { detail: { all: true } }));
      setReadTick((t) => t + 1);
    } catch {}
  };

  const pinMutation = useMutation({
    mutationFn: ({ id, nextPinned }) =>
      adviseUAdminApi.entities.Broadcast.update(id, { pinned: nextPinned, is_pinned: nextPinned }),
    onSuccess: (_, variables) => {
      showToast({
        type: "success",
        title: variables.nextPinned ? "Pinned" : "Unpinned",
        description: variables.nextPinned
          ? "News item pinned to the top."
          : "News item moved to recent updates.",
      });
      queryClient.invalidateQueries({ queryKey: ["news"] }).catch(() => {});
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Unable to update pin state",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  useMiraPageData(
    () => ({
      view: "news_feed",
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
              <CardTitle className="text-xl text-foreground-primary group-hover:text-primary-600 transition-colors">
                {broadcast.title}
              </CardTitle>
              <div className="mt-2 flex items-center gap-2 text-sm text-foreground-secondary">
                <Calendar className="h-4 w-4" />
                <span>
                  {broadcast.published_date
                    ? format(new Date(broadcast.published_date), "MMM d, yyyy h:mm a")
                    : "Draft"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  pinMutation.mutate({ id: broadcast.id, nextPinned: !broadcast.pinned });
                }}
                disabled={pinMutation.isPending}
                title={broadcast.pinned ? "Unpin" : "Pin to top"}
              >
                {broadcast.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
              <span className="hidden sm:inline-flex items-center text-primary-600 font-medium">
                Read more
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground-secondary line-clamp-3">
            {broadcast.content}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="sticky top-0 z-20 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-200 space-y-6">
          <PageHeader
            title="Newsroom"
            subtitle="Stay updated with the latest news, trainings, and campaigns"
            icon={Newspaper}
            className="mb-0"
            actions={
              <Button variant="ghost" size="sm" onClick={markAllVisibleAsRead}>
                Mark visible as read
              </Button>
            }
          />

          <SearchFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            placeholder="Search news..."
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
        </div>

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
            {visiblePinned.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Pinned News</h2>
                </div>
                {visiblePinned.map((broadcast) => (
                  <BroadcastCard key={broadcast.id} broadcast={broadcast} isPinned />
                ))}
              </div>
            )}

            {filteredBroadcasts.length > 0 && (
              <div className="space-y-4">
                {visiblePinned.length > 0 && (
                  <h2 className="mt-8 text-lg font-semibold text-slate-900">Recent Updates</h2>
                )}
                {filteredBroadcasts.map((broadcast) => (
                  <BroadcastCard key={broadcast.id} broadcast={broadcast} />
                ))}
              </div>
            )}

            {filteredBroadcasts.length === 0 && visiblePinned.length === 0 && (
              <Card className="shadow-lg">
                <CardContent className="p-12 text-center">
                  <Newspaper className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">No news yet</h3>
                  <p className="text-slate-500">Check back later for updates</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Dialog
          open={composeDialogOpen}
          onOpenChange={(open) => {
            setComposeDialogOpen(open);
            if (!open) resetComposeForm();
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create News</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="news-title">
                  Title
                </label>
                <Input
                  id="news-title"
                  value={composeForm.title}
                  onChange={(e) => setComposeForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter news title"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="news-audience">
                  Audience
                </label>
                <Input
                  id="news-audience"
                  value={composeForm.audience}
                  onChange={(e) => setComposeForm((prev) => ({ ...prev, audience: e.target.value }))}
                  placeholder="All Advisors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Category</label>
                <Select
                  value={composeForm.category}
                  onValueChange={(value) => setComposeForm((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Announcement">Announcement</SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Campaign">Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="news-message">
                  Message
                </label>
                <Textarea
                  id="news-message"
                  value={composeForm.message}
                  onChange={(e) => setComposeForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Write your news update..."
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setComposeDialogOpen(false);
                  resetComposeForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary-600 text-white hover:bg-primary-700"
                onClick={submitComposeForm}
                disabled={isSavingDraft}
              >
                {isSavingDraft ? "Saving..." : "Save Draft"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
