import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import supabase from "@/admin/api/supabaseClient.js";
import { createPageUrl } from "@/admin/utils";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { Input } from "@/admin/components/ui/input";
import { Textarea } from "@/admin/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import { Label } from "@/admin/components/ui/label";
import { Separator } from "@/admin/components/ui/separator";
import { ClipboardList, ArrowLeft, Calendar, CheckCircle2, User, Upload, Mic, MicOff, FileText } from "lucide-react";
import { useToast } from "@/admin/components/ui/toast";

export default function SmartPlanDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
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
  const [recordingNotes, setRecordingNotes] = useState(false);
  const [recordingTranscript, setRecordingTranscript] = useState(false);

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
    onError: (error) => showToast({ type: "error", title: "Failed to save", description: error?.message || "Try again." }),
  });

  const createProposalMutation = useMutation({
    mutationFn: async (leadId) => {
      const lead = task?.linked_lead_name ? { name: task.linked_lead_name } : null;
      const proposalNumber = `PRO-${Date.now()}`;
      return adviseUAdminApi.entities.Proposal.create({
        proposal_number: proposalNumber,
        lead_id: leadId,
        proposer_name: lead?.name || "Unknown",
        stage: "Fact Finding",
        status: "In Progress",
        completion_percentage: 0,
        last_updated: new Date().toISOString(),
      });
    },
    onSuccess: (proposal) => {
      queryClient.invalidateQueries(["proposals"]);
      showToast({ type: "success", title: "Draft proposal created", description: "Opening proposal detail." });
      navigate(createPageUrl(`ProposalDetail?id=${proposal.id}`));
    },
    onError: (error) => showToast({ type: "error", title: "Proposal creation failed", description: error?.message || "Try again." }),
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
    const existing = proposals.find((p) => p.lead_id === task.linked_lead_id && p.status === "In Progress");
    if (existing) {
      showToast({ type: "info", title: "Existing proposal found", description: "Opening current draft." });
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
      setSummaryError(e?.message || "Failed to generate summary");
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
        <p className="text-slate-600">No task id provided.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Loading task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Task not found.</p>
        <Button variant="link" onClick={() => navigate(createPageUrl("SmartPlan"))}>Back to Smart Plan</Button>
      </div>
    );
  }

  const Icon = task.type === "Appointment" ? Calendar : CheckCircle2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => navigate(createPageUrl("SmartPlan"))}>
          <ArrowLeft className="w-4 h-4" />
          Back to Smart Plan
        </Button>

        <PageHeader
          title={task.title || "Task detail"}
          subtitle="Manage notes, transcripts, and AI summary"
          icon={Icon}
          actions={
            task.linked_lead_id ? (
              <Button variant="outline" onClick={() => navigate(createPageUrl(`CustomerDetail?id=${task.linked_lead_id}`))}>
                <User className="w-4 h-4 mr-2" />
                View customer
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
                <TabsTrigger value="notes">Notes</TabsTrigger>
                {task.type === "Appointment" ? <TabsTrigger value="transcript">Transcript</TabsTrigger> : null}
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="space-y-3 mt-4">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[160px]" />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRecordingNotes((v) => !v)}
                  >
                    {recordingNotes ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                    {recordingNotes ? "Stop recording" : "Voice note"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <label className="cursor-pointer inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload document
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
                  {recordingNotes ? <span className="text-xs text-amber-600 font-semibold">Recording (simulated)</span> : null}
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveNotes}>Save notes</Button>
                </div>
              </TabsContent>

              {task.type === "Appointment" ? (
                <TabsContent value="transcript" className="space-y-3 mt-4">
                  <div>
                    <Label htmlFor="meeting-link">Meeting link</Label>
                    <Input id="meeting-link" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="Paste meeting link" />
                  </div>
                  <div>
                    <Label htmlFor="transcript">Transcript</Label>
                    <Textarea id="transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)} className="min-h-[160px]" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRecordingTranscript((v) => !v)}
                    >
                      {recordingTranscript ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                      {recordingTranscript ? "Stop recording" : "Start recording"}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <label className="cursor-pointer inline-flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload recording / transcript
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
                    {recordingTranscript ? <span className="text-xs text-amber-600 font-semibold">Recording (simulated)</span> : null}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveTranscript}>Save transcript</Button>
                  </div>
                </TabsContent>
              ) : null}

              <TabsContent value="summary" className="space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary-600" />
                  <span className="font-semibold text-slate-900">Summary by Mira</span>
                </div>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="min-h-[140px]"
                  placeholder="Generate or edit a concise summary..."
                />
                {summaryError ? <p className="text-sm text-red-600">{summaryError}</p> : null}
                <div className="flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleGenerateSummary} disabled={summaryLoading}>
                      {summaryLoading ? "Summarizing..." : "Generate with AI"}
                    </Button>
                    <Button variant="outline" onClick={() => setSummary(notes || transcript || summary)}>
                      Quick summarize
                    </Button>
                  </div>
                  <Button onClick={handleSaveSummary} disabled={summaryLoading}>Save summary</Button>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              {task.created_at ? <span>Created: {new Date(task.created_at).toLocaleString()}</span> : null}
              {task.updated_at ? <span>Updated: {new Date(task.updated_at).toLocaleString()}</span> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
