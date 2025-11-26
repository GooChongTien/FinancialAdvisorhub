import { Button } from "@/admin/components/ui/button.jsx";
import { Input } from "@/admin/components/ui/input.jsx";
import { PageHeader } from "@/admin/components/ui/page-header.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin/components/ui/select.jsx";
import { useMiraChat } from "@/admin/state/providers/MiraChatProvider.jsx";
import { createPageUrl } from "@/admin/utils";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageCircle, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const SORT_OPTIONS = [
  { value: "recent", labelKey: "chat.sort.recent" },
  { value: "oldest", labelKey: "chat.sort.oldest" },
  { value: "alpha", labelKey: "chat.sort.alpha" },
];

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

export default function AllChats() {
  const navigate = useNavigate();
  const { setActiveThread, searchThreads } = useMiraChat();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("recent");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const query = useQuery({
    queryKey: ["mira-chat", "search", { search: debouncedSearch, sort: sortOrder }],
    queryFn: () => searchThreads({ search: debouncedSearch, sort: sortOrder }),
    keepPreviousData: true,
  });

  const threads = query.data ?? [];

  const handleOpenThread = useCallback(
    (threadId) => {
      setActiveThread(threadId);
      navigate(createPageUrl("ChatMira"));
    },
    [navigate, setActiveThread],
  );

  const handleNewChat = useCallback(() => {
    setActiveThread(null);
    navigate(createPageUrl("ChatMira"));
  }, [navigate, setActiveThread]);

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader
        title={t("chat.allChats.title")}
        description={t("chat.allChats.description")}
      />
      <div className="flex flex-1 flex-col gap-4 px-6 pb-6">
        <div className="flex flex-col gap-3 rounded-lg bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("chat.allChats.searchPlaceholder")}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder={t("chat.allChats.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full justify-end sm:w-auto">
            <Button onClick={handleNewChat} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t("chat.allChats.newChat")}
            </Button>
          </div>
        </div>

        <div className="flex-1 rounded-lg bg-white shadow-sm">
          <div className="divide-y divide-gray-100">
            {query.isLoading && (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">{t("chat.allChats.loading")}</span>
              </div>
            )}
            {!query.isLoading && query.isError && (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-gray-500">
                <MessageCircle className="h-6 w-6" />
                <p className="text-sm text-center">
                  {t("chat.allChats.error")}
                </p>
                <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                  {t("chat.allChats.retry")}
                </Button>
              </div>
            )}
            {!query.isLoading && !query.isError && threads.length === 0 && (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-500">
                <MessageCircle className="h-6 w-6" />
                <p className="text-sm">{t("chat.allChats.empty")}</p>
              </div>
            )}
            {!query.isLoading &&
              !query.isError &&
              threads.length > 0 &&
              threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => handleOpenThread(thread.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-200"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="truncate text-base font-semibold text-gray-900">
                        {thread.title || t("chat.allChats.untitledConversation")}
                      </h3>
                      <span className="flex-shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400">
                        {formatRelativeTime(thread.updatedAt)}
                      </span>
                    </div>
                    <p className={cn("truncate text-sm text-gray-600", !thread.lastMessagePreview && "italic text-gray-400")}>
                      {thread.lastMessagePreview || t("chat.allChats.noMessages")}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary-500">{t("chat.allChats.open")}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
