import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import supabase from "@/admin/api/supabaseClient.js";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import { Separator } from "@/admin/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import { Textarea } from "@/admin/components/ui/textarea";
import { useToast } from "@/admin/components/ui/toast";
import { createPageUrl } from "@/admin/utils";
import { useVoiceRecording } from "@/admin/hooks/useVoiceRecording.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, CheckCircle2, ClipboardList, FileText, Mic, MicOff, Upload, User } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

export default function SmartPlanDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const taskId = useMemo(() => new URLSearchParams(location.search).get("id"), [location.search]);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task-detail", taskId],
    enabled: Boolean(taskId),
    queryFn: async () => {
      const rows = await adviseUAdminApi.entities.Task.filter({ id: taskId });
      return rows?.[0] ?? null;
    },
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => adviseUAdminApi.entities.Proposal.list("-updated_date"),
  });

  const [notes, setNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [noteAttachments, setNoteAttachments] = useState([]);
  const [transcriptAttachments, setTranscriptAttachments] = useState([]);

  // Real voice recording hooks for notes
  const notesVoiceRecording = useVoiceRecording({
    continuous: false,
    interimResults: true,
    language: "en-US",
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setNotes((prev) => prev + (prev ? " " : "") + text);
      }
    },
    onError: (error) => {
      showToast({ type: "error", title: "Voice recording error", description: error.message });
    },
  });

  // Real voice recording hooks for transcript
  const transcriptVoiceRecording = useVoiceRecording({
    continuous: false,
    interimResults: true,
    language: "en-US",
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setTranscript((prev) => prev + (prev ? " " : "") + text);
      }
    },
    onError: (error) => {
      showToast({ type: "error", title: "Voice recording error", description: error.message });
    },
  });

  React.useEffect(() => {
    if (!task) return;
    setNotes(task.notes || "");
    const baseTranscript = (task.transcript && typeof task.transcript === "object") ? task.transcript : {};
    setTranscript(baseTranscript.text || task.transcript_text || "");
    setMeetingLink(baseTranscript.meeting_link || task.meeting_link || "");
    setSummary(task.ai_summary || "");
    setNoteAttachments(Array.isArray(baseTranscript.note_attachments) ? baseTranscript.note_attachments : []);
    setTranscriptAttachments(Array.isArray(baseTranscript.attachments) ? baseTranscript.attachments : []);
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => adviseUAdminApi.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(["task-detail", taskId]),
    onError: (error) => showToast({ type: "error", title: t("smartPlan.detail.toasts.saveFailed"), description: error?.message || t("smartPlan.detail.toasts.tryAgain") }),
  });

  const createProposalMutation = useMutation({
    mutationFn: async (leadId) => {
      const lead = task?.linked_lead_name ? { name: task.linked_lead_name } : null;
      const proposalNumber = `PRO-${Date.now()}`;
      return adviseUAdminApi.entities.Proposal.create({
        proposal_number: proposalNumber,
        lead_id: leadId,
        proposer_name: lead?.name || t("smartPlan.detail.defaults.unknown"),
        stage: t("smartPlan.detail.defaults.factFinding"),
        status: t("smartPlan.detail.defaults.inProgress"),
        completion_percentage: 0,
        last_updated: new Date().toISOString(),
      });
    },
    onSuccess: (proposal) => {
      queryClient.invalidateQueries(["proposals"]);
      showToast({ type: "success", title: t("smartPlan.detail.toasts.proposalCreated"), description: t("smartPlan.detail.toasts.openingProposal") });
      navigate(createPageUrl(`ProposalDetail?id=${proposal.id}`));
    },
    onError: (error) => showToast({ type: "error", title: t("smartPlan.detail.toasts.proposalFailed"), description: error?.message || t("smartPlan.detail.toasts.tryAgain") }),
  });

  const detectIntent = (text) => {
    if (!text) return "none";
    const norm = text.toLowerCase();
    if (/proposal|quote|application|upgrade|policy/.test(norm)) return "proposal";
    if (/follow up|call|meeting|schedule|remind/.test(norm)) return "task";
    return "none";
  };

  const maybeCreateProposal = (text) => {
    if (!task?.linked_lead_id) return;
    const intent = detectIntent(text);
    if (intent !== "proposal") return;
    const existing = proposals.find((p) => p.lead_id === task.linked_lead_id && p.status === t("smartPlan.detail.defaults.inProgress"));
    if (existing) {
      showToast({ type: "info", title: t("smartPlan.detail.toasts.existingProposal"), description: t("smartPlan.detail.toasts.openingDraft") });
      navigate(createPageUrl(`ProposalDetail?id=${existing.id}`));
      return;
    }
    createProposalMutation.mutate(task.linked_lead_id);
  };

  const handleSaveNotes = () => {
    if (!task) return;
    const mergedTranscript = {
      ...(task.transcript || {}),
      text: transcript || (task.transcript && task.transcript.text) || "",
      meeting_link: meetingLink || null,
      attachments: transcriptAttachments,
      note_attachments: noteAttachments,
    };
    updateTaskMutation.mutate({ id: task.id, data: { notes, transcript: mergedTranscript } });
    maybeCreateProposal(notes);
  };

  const handleSaveTranscript = () => {
    if (!task) return;
    const mergedTranscript = {
      ...(task.transcript || {}),
      text: transcript || "",
      meeting_link: meetingLink || null,
      attachments: transcriptAttachments,
      note_attachments: noteAttachments,
    };
    updateTaskMutation.mutate({ id: task.id, data: { transcript: mergedTranscript, meeting_link: meetingLink || null } });
    maybeCreateProposal(`${notes} ${transcript}`);
  };

  const handleSaveSummary = () => {
    if (!task) return;
    updateTaskMutation.mutate({ id: task.id, data: { ai_summary: summary } });
    maybeCreateProposal(`${notes} ${transcript} ${summary}`);
  };

  const handleGenerateSummary = async () => {
    if (!task) return;
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const { data, error } = await supabase.functions.invoke("smart-plan-intent", {
        body: {
          notes,
          transcript,
          meeting_link: meetingLink,
          lead_id: task.linked_lead_id || null,
          note_attachments: noteAttachments,
          transcript_attachments: transcriptAttachments,
        },
      });
      if (error) throw error;
      const nextSummary = data?.summary || summary || notes;
      setSummary(nextSummary);
      updateTaskMutation.mutate({
        id: task.id,
        data: {
          ai_summary: nextSummary,
          key_points: data?.key_points || [],
          sentiment: data?.sentiment || null,
        },
      });
      maybeCreateProposal(`${notes} ${transcript} ${nextSummary}`);
    } catch (e) {
      setSummaryError(e?.message || t("smartPlan.detail.summary.error"));
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleNoteUpload = (files) => {
    if (!files?.length) return;
    setNoteAttachments((prev) => [...prev, ...Array.from(files).map((f) => f.name)]);
  };

  const handleTranscriptUpload = (files) => {
    if (!files?.length) return;
    setTranscriptAttachments((prev) => [...prev, ...Array.from(files).map((f) => f.name)]);
  };

  if (!taskId) {
    return (
      <div className="p-6">
        <p className="text-slate-600">{t("smartPlan.detail.noId")}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-slate-600">{t("smartPlan.detail.loading")}</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <p className="text-slate-600">{t("smartPlan.detail.notFound")}</p>
        <Button variant="link" onClick={() => navigate(createPageUrl("SmartPlan"))}>{t("smartPlan.detail.backToSmartPlan")}</Button>
      </div>
    );
  }

  const Icon = task.type === "Appointment" ? Calendar : CheckCircle2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => navigate(createPageUrl("SmartPlan"))}>
          <ArrowLeft className="w-4 h-4" />
          {t("smartPlan.detail.backToSmartPlan")}
        </Button>

        <PageHeader
          title={task.title || t("smartPlan.detail.title")}
          subtitle={t("smartPlan.detail.subtitle")}
          icon={Icon}
          actions={
            task.linked_lead_id ? (
              <Button variant="outline" onClick={() => navigate(createPageUrl(`CustomerDetail?id=${task.linked_lead_id}`))}>
                <User className="w-4 h-4 mr-2" />
                {t("smartPlan.detail.viewCustomer")}
              </Button>
            ) : null
          }
        />

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary-600" />
              {task.title}
              <Badge variant="outline">{task.type}</Badge>
              {task.date ? <Badge variant="secondary">{task.date} {task.time || ""}</Badge> : null}
              {task.linked_lead_name ? <Badge variant="secondary">{task.linked_lead_name}</Badge> : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="notes">
              <TabsList>
                <TabsTrigger value="notes">{t("smartPlan.detail.tabs.notes")}</TabsTrigger>
                {task.type === "Appointment" ? <TabsTrigger value="transcript">{t("smartPlan.detail.tabs.transcript")}</TabsTrigger> : null}
                <TabsTrigger value="summary">{t("smartPlan.detail.tabs.summary")}</TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="space-y-3 mt-4">
                <Label htmlFor="notes">{t("smartPlan.detail.notes.label")}</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[160px]" />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (notesVoiceRecording.isRecording) {
                        notesVoiceRecording.stopRecording();
                      } else {
                        notesVoiceRecording.startRecording();
                      }
                    }}
                    disabled={!notesVoiceRecording.isSupported}
                  >
                    {notesVoiceRecording.isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                    {notesVoiceRecording.isRecording ? t("smartPlan.detail.notes.stopRecording") : t("smartPlan.detail.notes.voiceNote")}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <label className="cursor-pointer inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {t("smartPlan.detail.notes.upload")}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleNoteUpload(e.target.files)}
                        aria-label="Upload documents"
                      />
                    </label>
                  </Button>
                  {noteAttachments.length ? (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <FileText className="w-3 h-3" />
                      <span>{noteAttachments.join(", ")}</span>
                    </div>
                  ) : null}
                  {notesVoiceRecording.isRecording ? (
                    <span className="text-xs text-red-600 font-semibold animate-pulse">
                      ● Recording...
                    </span>
                  ) : null}
                  {notesVoiceRecording.interimTranscript ? (
                    <span className="text-xs text-slate-500 italic">
                      {notesVoiceRecording.interimTranscript}...
                    </span>
                  ) : null}
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveNotes}>{t("smartPlan.detail.notes.save")}</Button>
                </div>
              </TabsContent>

              {task.type === "Appointment" ? (
                <TabsContent value="transcript" className="space-y-3 mt-4">
                  <div>
                    <Label htmlFor="meeting-link">{t("smartPlan.detail.transcript.meetingLink")}</Label>
                    <Input id="meeting-link" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder={t("smartPlan.detail.transcript.meetingLinkPlaceholder")} />
                  </div>
                  <div>
                    <Label htmlFor="transcript">{t("smartPlan.detail.transcript.label")}</Label>
                    <Textarea id="transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)} className="min-h-[160px]" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (transcriptVoiceRecording.isRecording) {
                          transcriptVoiceRecording.stopRecording();
                        } else {
                          transcriptVoiceRecording.startRecording();
                        }
                      }}
                      disabled={!transcriptVoiceRecording.isSupported}
                    >
                      {transcriptVoiceRecording.isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                      {transcriptVoiceRecording.isRecording ? t("smartPlan.detail.transcript.stopRecording") : t("smartPlan.detail.transcript.startRecording")}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <label className="cursor-pointer inline-flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        {t("smartPlan.detail.transcript.upload")}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleTranscriptUpload(e.target.files)}
                          aria-label="Upload transcript"
                        />
                      </label>
                    </Button>
                    {transcriptAttachments.length ? (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <FileText className="w-3 h-3" />
                        <span>{transcriptAttachments.join(", ")}</span>
                      </div>
                    ) : null}
                    {transcriptVoiceRecording.isRecording ? (
                      <span className="text-xs text-red-600 font-semibold animate-pulse">
                        ● Recording...
                      </span>
                    ) : null}
                    {transcriptVoiceRecording.interimTranscript ? (
                      <span className="text-xs text-slate-500 italic">
                        {transcriptVoiceRecording.interimTranscript}...
                      </span>
                    ) : null}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveTranscript}>{t("smartPlan.detail.transcript.save")}</Button>
                  </div>
                </TabsContent>
              ) : null}

              <TabsContent value="summary" className="space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary-600" />
                  <span className="font-semibold text-slate-900">{t("smartPlan.detail.summary.header")}</span>
                </div>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="min-h-[140px]"
                  placeholder={t("smartPlan.detail.summary.placeholder")}
                />
                {summaryError ? <p className="text-sm text-red-600">{summaryError}</p> : null}
                <div className="flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleGenerateSummary} disabled={summaryLoading}>
                      {summaryLoading ? t("smartPlan.detail.summary.summarizing") : t("smartPlan.detail.summary.generate")}
                    </Button>
                    <Button variant="outline" onClick={() => setSummary(notes || transcript || summary)}>
                      {t("smartPlan.detail.summary.quickSummarize")}
                    </Button>
                  </div>
                  <Button onClick={handleSaveSummary} disabled={summaryLoading}>{t("smartPlan.detail.summary.save")}</Button>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              {task.created_at ? <span>{t("smartPlan.detail.created", { date: new Date(task.created_at).toLocaleString() })}</span> : null}
              {task.updated_at ? <span>{t("smartPlan.detail.updated", { date: new Date(task.updated_at).toLocaleString() })}</span> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
