import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import { Badge } from "@/admin/components/ui/badge";
import { Card, CardContent } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Calendar, Megaphone, GraduationCap, TrendingUp, Radio, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";

const getCategoryIcon = (category) => {
  const icons = {
    Announcement: Megaphone,
    Training: GraduationCap,
    Campaign: TrendingUp,
  };
  return icons[category] || Radio;
};

const getCategoryColor = (category) => {
  const colors = {
    Announcement: "bg-blue-100 text-blue-700 border-blue-200",
    Training: "bg-teal-100 text-teal-700 border-teal-200",
    Campaign: "bg-orange-100 text-orange-700 border-orange-200",
  };
  return colors[category] || "bg-slate-100 text-slate-700 border-slate-200";
};

export default function BroadcastDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const navigate = useNavigate();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["broadcast", id],
    queryFn: async () => adviseUAdminApi.entities.Broadcast.filter({ id }),
    enabled: !!id,
  });
  const b = rows?.[0];

  useMiraPageData(
    () => ({
      view: "broadcast_detail",
      broadcastId: id,
      category: b?.category ?? null,
    }),
    [id, b?.category],
  );

  useEffect(() => {
    if (!b) return;
    try {
      const key = `advisorhub:broadcast-read:${b.id}`;
      window.sessionStorage.setItem(key, "1");
      window.dispatchEvent(new CustomEvent('advisorhub:broadcast-read', { detail: { id: b.id } }));
    } catch {}
  }, [b]);

  const Icon = getCategoryIcon(b?.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("Broadcast"))}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Broadcasts
        </Button>

        <PageHeader
          title={b?.title || (isLoading ? "Loading..." : "Announcement")}
          subtitle={b ? format(new Date(b.published_date), "MMM d, yyyy h:mm a") : ""}
          icon={Icon || Radio}
        />

        {b && (
          <Card className="shadow-lg border-slate-200">
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(b.published_date), "MMM d, yyyy h:mm a")}</span>
                <span>•</span>
                <Badge className={getCategoryColor(b.category)}>{b.category}</Badge>
              </div>
              <div className="prose max-w-none whitespace-pre-wrap leading-relaxed text-slate-800">
                {b.content}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

