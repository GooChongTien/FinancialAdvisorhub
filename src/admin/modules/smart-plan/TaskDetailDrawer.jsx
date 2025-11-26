import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/admin/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import { Button } from "@/admin/components/ui/button";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { Input } from "@/admin/components/ui/input";
import { Badge } from "@/admin/components/ui/badge";
import { Upload, Mic, MicOff, FileText, ClipboardList, CheckCircle2, Calendar, Paperclip, Radio } from "lucide-react";
import supabase from "@/admin/api/supabaseClient.js";
import { useVoiceRecording } from "@/admin/hooks/useVoiceRecording.ts";

const deriveSummary = (task) => {
  if (task?.ai_summary) return task.ai_summary;
  if (task?.notes) {
    return task.notes.length > 280 ? `${task.notes.slice(0, 280)}…` : task.notes;
  }
  return "No summary yet. Add notes or transcript, then generate a summary.";
};

export default function TaskDetailDrawer({
  open,
  onClose,
  task,
  onSave,
  onDelete,
  onEdit,
}) {
  const [activeTab, setActiveTab] = useState("notes");
  const [notes, setNotes] = useState(task?.notes || "");
  const [transcript, setTranscript] = useState(
    (task?.transcript && task.transcript.text) || task?.transcript_text || "",
  );
  const [meetingLink, setMeetingLink] = useState(task?.meeting_link || "");
  const [attachments, setAttachments] = useState([]);
  const [localSummary, setLocalSummary] = useState(task?.ai_summary || "");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // Voice recording for Notes tab
  const notesVoice = useVoiceRecording({
    continuous: true,
    interimResults: true,
    language: "en-US",
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setNotes((prev) => prev + (prev ? " " : "") + text);
      }
    },
    onError: (error) => {
      console.error("Notes voice recording error:", error);
    },
  });

  // Voice recording for Transcript tab
  const transcriptVoice = useVoiceRecording({
    continuous: true,
    interimResults: true,
    language: "en-US",
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setTranscript((prev) => prev + (prev ? " " : "") + text);
      }
    },
    onError: (error) => {
      console.error("Transcript voice recording error:", error);
    },
  });

  React.useEffect(() => {
    if (!task) return;
    setNotes(task.notes || "");
    setTranscript((task?.transcript && task.transcript.text) || task?.transcript_text || "");
    setMeetingLink(task.meeting_link || "");
    setLocalSummary(task.ai_summary || "");
    setAttachments([]);
    // Reset voice recording state when task changes
    notesVoice.resetTranscript();
    transcriptVoice.resetTranscript();
  }, [task]);

  const isAppointment = task?.type === "Appointment";
  const summaryToShow = useMemo(() => localSummary || deriveSummary(task), [localSummary, task]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setAttachments((prev) => [...prev, ...files.map((f) => f.name)]);
  };

  const handleSaveNotes = () => {
    onSave?.({ notes });
  };

  const handleSaveTranscript = () => {
    const payload = {
      transcript: transcript
        ? { text: transcript, meeting_link: meetingLink, attachments }
        : null,
      meeting_link: meetingLink || null,
    };
    onSave?.(payload);
  };

  const handleGenerateSummary = () => {
    const fallback = deriveSummary({ ...task, notes, ai_summary: localSummary });
    const summary = localSummary || fallback;
    setLocalSummary(summary);
    onSave?.({ ai_summary: summary });
  };

  const handleGenerateSummaryAI = async () => {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const { data, error } = await supabase.functions.invoke("smart-plan-intent", {
        body: {
          notes,
          transcript,
          meeting_link: meetingLink,
          lead_id: task?.linked_lead_id || null,
        },
      });
      if (error) throw error;
      const summary = data?.summary || deriveSummary({ ...task, notes });
      setLocalSummary(summary);
      onSave?.({
        ai_summary: summary,
        key_points: data?.key_points || [],
        sentiment: data?.sentiment || null,
        intent: data?.intent || null,
      });
    } catch (e) {
      setSummaryError(e?.message || "Failed to generate summary");
      const fallback = deriveSummary({ ...task, notes, ai_summary: localSummary });
      setLocalSummary(fallback);
      onSave?.({ ai_summary: fallback });
    } finally {
      setSummaryLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAppointment ? <Calendar className="w-4 h-4 text-primary-600" /> : <CheckCircle2 className="w-4 h-4 text-primary-600" />}
            {task.title}
            <Badge variant="outline" className="ml-2">{task.type}</Badge>
            {task.linked_lead_name ? <Badge variant="secondary">{task.linked_lead_name}</Badge> : null}
            {onEdit ? (
              <Button size="sm" variant="outline" className="ml-auto" onClick={onEdit}>
                Edit event
              </Button>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="summary">Summary by Mira</TabsTrigger>
            {isAppointment ? <TabsTrigger value="transcript">Transcript</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="notes" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add text notes or meeting highlights..."
                className="min-h-[140px]"
              />
              {/* Real-time interim transcript preview */}
              {notesVoice.isRecording && notesVoice.interimTranscript && (
                <div className="text-sm text-slate-500 italic bg-slate-50 border border-slate-200 rounded-lg p-2">
                  {notesVoice.interimTranscript}...
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={notesVoice.isRecording ? "destructive" : "outline"}
                onClick={() => {
                  if (notesVoice.isRecording) {
                    notesVoice.stopRecording();
                  } else {
                    notesVoice.startRecording();
                  }
                }}
                disabled={!notesVoice.isSupported}
              >
                {notesVoice.isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop recording
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Voice note
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <label className="cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload document
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    aria-label="Upload documents"
                  />
                </label>
              </Button>
              {attachments.length ? (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Paperclip className="w-3 h-3" />
                  <span>{attachments.join(", ")}</span>
                </div>
              ) : null}
              {notesVoice.isRecording && (
                <div className="flex items-center gap-2 text-xs text-red-600 font-semibold animate-pulse">
                  <Radio className="w-4 h-4" />
                  Recording... ({notesVoice.backend === "webspeech" ? "Browser STT" : "Whisper API"})
                </div>
              )}
              {notesVoice.error && (
                <div className="text-xs text-red-600">
                  {notesVoice.error}
                </div>
              )}
              {!notesVoice.isSupported && (
                <div className="text-xs text-amber-600">
                  Voice recording not supported in this browser
                </div>
              )}
            </div>

            <DialogFooter className="mt-2">
              <Button onClick={handleSaveNotes}>Save notes</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="summary" className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-semibold text-slate-900">Summary</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {summaryToShow}
              </p>
              {summaryError ? (
                <p className="text-xs text-red-600 mt-2">{summaryError}</p>
              ) : null}
            </div>
            <DialogFooter className="mt-2 flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerateSummary}>
                  Quick summarize
                </Button>
                <Button variant="outline" onClick={handleGenerateSummaryAI} disabled={summaryLoading}>
                  {summaryLoading ? "Summarizing..." : "Generate with AI"}
                </Button>
              </div>
              <Button onClick={() => onSave?.({ ai_summary: summaryToShow })} disabled={summaryLoading}>
                Save summary
              </Button>
            </DialogFooter>
          </TabsContent>

          {isAppointment ? (
            <TabsContent value="transcript" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-link">Meeting link</Label>
                <Input
                  id="meeting-link"
                  placeholder="Paste meeting link (Zoom, Teams, Google Meet, etc.)"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transcript">Transcript</Label>
                <Textarea
                  id="transcript"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste or type the transcript..."
                  className="min-h-[140px]"
                />
                {/* Real-time interim transcript preview */}
                {transcriptVoice.isRecording && transcriptVoice.interimTranscript && (
                  <div className="text-sm text-slate-500 italic bg-slate-50 border border-slate-200 rounded-lg p-2">
                    {transcriptVoice.interimTranscript}...
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={transcriptVoice.isRecording ? "destructive" : "outline"}
                  onClick={() => {
                    if (transcriptVoice.isRecording) {
                      transcriptVoice.stopRecording();
                    } else {
                      transcriptVoice.startRecording();
                    }
                  }}
                  disabled={!transcriptVoice.isSupported}
                >
                  {transcriptVoice.isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start recording
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <label className="cursor-pointer inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload recording / transcript
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      aria-label="Upload transcript"
                      accept="audio/*,.txt,.doc,.docx,.pdf"
                    />
                  </label>
                </Button>
                {attachments.length ? (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <FileText className="w-3 h-3" />
                    <span>{attachments.join(", ")}</span>
                  </div>
                ) : null}
                {transcriptVoice.isRecording && (
                  <div className="flex items-center gap-2 text-xs text-red-600 font-semibold animate-pulse">
                    <Radio className="w-4 h-4" />
                    Recording... ({transcriptVoice.backend === "webspeech" ? "Browser STT" : "Whisper API"})
                  </div>
                )}
                {transcriptVoice.error && (
                  <div className="text-xs text-red-600">
                    {transcriptVoice.error}
                  </div>
                )}
                {!transcriptVoice.isSupported && (
                  <div className="text-xs text-amber-600">
                    Voice recording not supported in this browser
                  </div>
                )}
              </div>

              <DialogFooter className="mt-2">
                <Button onClick={handleSaveTranscript}>Save transcript</Button>
              </DialogFooter>
            </TabsContent>
          ) : null}
        </Tabs>

        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={onDelete}
            className="text-red-600 border-red-200"
            disabled={Boolean(task.synthetic)}
          >
            Delete
          </Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { deriveSummary };
