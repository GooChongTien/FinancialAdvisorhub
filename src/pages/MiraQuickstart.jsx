import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createAialRouter,
  createAialEvent,
  shouldEnableAial,
  Intent,
} from "@/lib/aial";
import { pageRoutes, createPageUrl } from "@/admin/utils";
import {
  registerLeadEnrichmentExecutor,
  extractLeadNameFromPrompt,
  detectLeadIntentFromPrompt,
  buildLeadIntent,
} from "@/lib/aial/intent/leadEnrichment.js";
import {
  registerMeetingPrepExecutor,
  detectMeetingIntentFromPrompt,
  buildMeetingIntent,
} from "@/lib/aial/intent/meetingPrep.js";
import {
  registerComplianceAlertExecutor,
  detectComplianceIntentFromPrompt,
  buildComplianceIntent,
} from "@/lib/aial/intent/complianceAlert.js";
import { useToast } from "@/admin/components/ui/toast";
import { useLeadDirectory } from "@/admin/state/LeadDirectoryProvider.jsx";
import {
  MIRA_PERSONA_OPTIONS,
  getPersonaSuggestions,
} from "@/lib/mira/personas.js";

const DEFAULT_PROMPT = "Summarize the biggest risks in my current lead pipeline.";

function resolvePromptIntent(prompt) {
  if (detectComplianceIntentFromPrompt(prompt)) {
    return {
      name: "compliance.alert",
      fallback: () => buildComplianceIntent(prompt),
    };
  }
  if (detectMeetingIntentFromPrompt(prompt)) {
    return {
      name: "meeting.prep",
      fallback: () => buildMeetingIntent(prompt),
    };
  }
  if (detectLeadIntentFromPrompt(prompt)) {
    return {
      name: "lead.enrichment",
      fallback: () => buildLeadIntent(prompt),
    };
  }
  return {
    name: "advisor.action.summary",
    fallback: null,
  };
}

export default function MiraQuickstart() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [response, setResponse] = useState(null);
  const [intentResult, setIntentResult] = useState(null);
  const [error, setError] = useState(null);
  const [eventPayload, setEventPayload] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [persona, setPersona] = useState(MIRA_PERSONA_OPTIONS[0].id);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { leads: leadDirectory } = useLeadDirectory();
  const commandSuggestions = useMemo(
    () => getPersonaSuggestions(persona),
    [persona],
  );
  const renderedResponse = streamedResponse || response?.content || "";

  const isEnabled = shouldEnableAial(true);
  const router = useMemo(
    () =>
      createAialRouter({
        includeMockAdapter: true,
      }),
    [],
  );
  const adapterIds = router.getAdapters().map((adapter) => adapter.id);
  const adapterLabel = adapterIds.length > 0 ? adapterIds.join(", ") : "None";

  useEffect(() => {
    const cleanups = [
      registerLeadEnrichmentExecutor(),
      registerMeetingPrepExecutor(),
      registerComplianceAlertExecutor(),
    ];
    return () => {
      cleanups.forEach((dispose) => dispose?.());
    };
  }, []);

  useEffect(() => {
    if (!response?.content) {
      setStreamedResponse("");
      setIsStreaming(false);
      return;
    }
    const tokens = response.content.split(/(\s+)/);
    let index = 0;
    setStreamedResponse("");
    setIsStreaming(true);
    const interval = setInterval(() => {
      index += 1;
      setStreamedResponse(tokens.slice(0, index).join(""));
      if (index >= tokens.length) {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 35);
    return () => {
      clearInterval(interval);
      setIsStreaming(false);
    };
  }, [response?.content]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isEnabled || isRunning) return;

    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Enter a prompt before running the adapter.");
      return;
    }

    setIsRunning(true);
    setError(null);

    const leadName = extractLeadNameFromPrompt(trimmed);
    const resolved = resolvePromptIntent(trimmed);
    const intentName = resolved.name;
    const aialEvent = createAialEvent({
      intent: intentName,
      payload: { prompt: trimmed, leadName },
    });
    setEventPayload(aialEvent);

    try {
      setExecutionResult(null);
      const result = await router.execute(aialEvent);
      setResponse(result);
      let interpreted = Intent.interpretIntent(result, aialEvent.intent);
      if (!interpreted && resolved.fallback) {
        interpreted = resolved.fallback(leadName);
      }
      setIntentResult(interpreted);
      if (interpreted) {
        const execution = await Intent.executeIntent(interpreted, {
          navigate,
          createPageUrl,
          event: aialEvent,
          leadDirectory,
        });
        setExecutionResult(execution);

        if (execution?.status === "completed") {
          const outcome = execution.result ?? {};
          if (outcome.status === "navigated") {
            showToast({
              type: "success",
              title: "Opening proposal detail",
              description: `${outcome.lead?.name ?? "Lead"} is in "${outcome.proposal?.stage ?? "Unknown"}" stage (confidence ${Math.round((outcome.matchConfidence ?? 0) * 100)}%).`,
            });
          } else if (outcome.status === "prepared") {
            showToast({
              type: "success",
              title: "Meeting prep ready",
              description: outcome.nextMeeting
                ? `${outcome.nextMeeting.title ?? "Upcoming meeting"} on ${outcome.nextMeeting.date ?? "soon"}${outcome.nextMeeting.time ? ` at ${outcome.nextMeeting.time}` : ""}.`
                : "Meeting summary prepared.",
            });
          } else if (outcome.status === "alert") {
            showToast({
              type: "warning",
              title: "Compliance alerts detected",
              description: outcome.alerts?.length
                ? `${outcome.alerts.length} records need review.`
                : "Review compliance dashboard for details.",
            });
          } else if (outcome.status === "clear") {
            showToast({
              type: "success",
              title: "Compliance clean",
              description: "No pending compliance alerts found.",
            });
          } else if (outcome.status === "not_found") {
            showToast({
              type: "warning",
              title: "No results found",
              description: outcome.message ?? "Unable to locate relevant records.",
            });
          } else if (outcome.status === "skipped") {
            showToast({
              type: "warning",
              title: "Need more details",
              description: outcome.message ?? "Try mentioning the lead or meeting specifically.",
            });
          }
        } else if (execution?.status === "error") {
          showToast({
            type: "error",
            title: "Intent execution failed",
            description: execution.error ?? "Unexpected error running action.",
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setResponse(null);
      setIntentResult(null);
      setExecutionResult(null);
    } finally {
      setIsRunning(false);
    }
  }

    async function handleSubmit(event) {
    event.preventDefault();
    await runCommand(prompt);
  }function handleReset() {
    setPrompt(DEFAULT_PROMPT);
    setResponse(null);
    setError(null);
    setEventPayload(null);
    setIntentResult(null);
    setExecutionResult(null);
    setStreamedResponse("");
    setIsStreaming(false);
    setPersona(MIRA_PERSONA_OPTIONS[0].id);
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-3">
          <Link
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
            to={pageRoutes.Home}
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back to AdvisorHub</span>
          </Link>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Adaptive AI Assistant
            </p>
            <h1 className="mt-1 text-3xl font-semibold">
              Mira Quickstart Sandbox
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              Run prompts against the AI Integration Abstraction Layer (AIAL)
              using the Supabase agent proxy (server-side OpenAI) with a mock
              fallback for local development. This page validates wiring before
              production integrations.
            </p>
          </div>
        </header>

        {!isEnabled ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
            <p className="font-medium text-neutral-800">
              Mira AIAL feature flag is disabled.
            </p>
            <p className="mt-2">
              Set <code className="rounded bg-neutral-100 px-1 py-0.5">VITE_MIRA_AIAL_ENABLED=true</code>{" "}
              in your <code className="rounded bg-neutral-100 px-1 py-0.5">.env.local</code> file to enable the sandbox.
            </p>
          </div>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-neutral-800"
                  htmlFor="mira-prompt"
                >
                  Prompt
                </label>
                <textarea
                  id="mira-prompt"
                  name="prompt"
                  rows={4}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="w-full rounded border border-neutral-300 bg-neutral-0 p-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Summarize the biggest risks in my current lead pipeline."
                  disabled={isRunning}
                />
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 disabled:bg-neutral-100"
                    value={persona}
                    onChange={(event) => setPersona(event.target.value)}
                    disabled={isRunning || isStreaming}
                  >
                    {MIRA_PERSONA_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {commandSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => runCommand(suggestion)}
                      disabled={isRunning || isStreaming}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={isRunning || isStreaming}
                    className="rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                  >
                    {isRunning || isStreaming ? (isStreaming ? "Streamingâ€¦" : "Runningâ€¦") : "Run through AIAL"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isRunning || isStreaming}
                  >
                    Reset
                  </button>
                  <p className="text-xs text-neutral-500">
                    Adapter in use: <strong>{adapterLabel}</strong>
                  </p>
                </div>
              </div>

              {error && (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
            </form>

            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-neutral-900">
                Response
              </h2>
              <article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                {response ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Adapter
                      </p>
                      <p className="text-sm text-neutral-800">
                        {response.adapterId} - {response.model}
                      </p>
                    </div>
                    <div className="space-y-2 rounded border border-neutral-100 bg-neutral-50 p-4">
                      {isStreaming && (
                        <p className="text-xs font-medium text-primary-600">
                          Streaming responseâ€¦
                        </p>
                      )}
                      <pre className="whitespace-pre-wrap text-sm text-neutral-800">
                        {renderedResponse}
                      </pre>
                    </div>
                    {Array.isArray(response.suggestions) &&
                      response.suggestions.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-neutral-500">
                            Suggested follow-ups
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                            {response.suggestions.map((item, index) => (
                              <li key={`${item}-${index}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
                      <span>Latency: {response.latencyMs ?? "N/A"} ms</span>
                      <span>Tokens used: {response.tokensUsed ?? "N/A"}</span>
                    </div>
                    {Array.isArray(response.intentCandidates) &&
                      response.intentCandidates.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-neutral-500">
                            Intent candidates
                          </p>
                          <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                            {response.intentCandidates.map((candidate) => (
                              <li key={candidate.id}>
                                <span className="font-medium">
                                  {candidate.id}
                                </span>{" "}
                                <span className="text-neutral-500">
                                  (confidence {(candidate.score * 100).toFixed(1)}%)
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    Run a prompt to see normalized output from the abstraction
                    layer.
                  </p>
                )}
              </article>
            </section>

            {executionResult && (
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-neutral-900">
                  Execution Result
                </h2>
              <article className="space-y-3 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm text-sm text-neutral-700">
                <p className="text-neutral-800">
                  Status:{" "}
                  <strong>
                    {executionResult.result?.status ??
                      executionResult.status ??
                      "unknown"}
                  </strong>
                </p>

                {/* Lead enrichment details */}
                {executionResult.result?.lead && (
                  <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-3 text-sm text-primary-800">
                    <p className="font-semibold">
                      {executionResult.result.lead.name}
                    </p>
                    <p className="text-xs text-primary-700">
                      Stage: {executionResult.result.proposal?.stage ?? "Unknown"}{" "}
                      {typeof executionResult.result.matchConfidence === "number"
                        ? `(confidence ${Math.round(
                            executionResult.result.matchConfidence * 100,
                          )}%)`
                        : ""}
                    </p>
                  </div>
                )}

                {/* Meeting prep summary */}
                {executionResult.result?.status === "prepared" &&
                  executionResult.result?.nextMeeting && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-800">
                      <p className="font-semibold">
                        {executionResult.result.nextMeeting.title ?? "Upcoming meeting"}
                      </p>
                      <p className="text-xs">
                        {executionResult.result.nextMeeting.date ?? "Soon"}
                        {executionResult.result.nextMeeting.time
                          ? ` at ${executionResult.result.nextMeeting.time}`
                          : ""}
                      </p>
                      {executionResult.result.nextMeeting.linkedLeadName && (
                        <p className="text-xs text-emerald-700">
                          With {executionResult.result.nextMeeting.linkedLeadName}
                        </p>
                      )}
                      {executionResult.result.recommendations?.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-emerald-700">
                          {executionResult.result.recommendations.map((rec) => (
                            <li key={rec.id}>{rec.description ?? rec.title}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}

                {/* Compliance alerts */}
                {executionResult.result?.status === "alert" &&
                  executionResult.result?.alerts?.length && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-800">
                      <p className="font-semibold">
                        {executionResult.result.alerts.length} compliance items
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-amber-700">
                        {executionResult.result.alerts.map((alert) => (
                          <li key={alert.id}>
                            {alert.name} â€” {alert.status ?? "Pending"}{" "}
                            {typeof alert.confidence === "number"
                              ? `(confidence ${Math.round(alert.confidence * 100)}%)`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {executionResult.result?.navigationUrl && (
                  <p className="text-neutral-500">
                    Navigated to: {executionResult.result.navigationUrl}
                  </p>
                )}
                {executionResult.result?.message && (
                  <p className="text-neutral-500">
                    {executionResult.result.message}
                  </p>
                )}
              </article>
            </section>
          )}

            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-neutral-900">
                Intent Interpretation
              </h2>
              <article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm text-sm text-neutral-700">
                {intentResult ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Predicted Intent
                      </p>
                      <p className="text-neutral-900">
                        <strong>{intentResult.name}</strong>{" "}
                        <span className="text-neutral-500">
                          ({(intentResult.confidence * 100).toFixed(1)}% confidence)
                        </span>
                      </p>
                      {intentResult.schema?.description && (
                        <p className="mt-1 text-neutral-600">
                          {intentResult.schema.description}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Context Fields
                      </p>
                      <pre className="mt-2 whitespace-pre-wrap rounded border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-700">
                        {JSON.stringify(intentResult.context ?? {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-500">
                    No matching intent detected yet. Run another prompt or adjust provider output.
                  </p>
                )}
              </article>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-neutral-900">
                Diagnostics
              </h2>
              <article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm text-sm text-neutral-700">
                {eventPayload ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Event metadata
                      </p>
                      <dl className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                        <div>
                          <dt className="text-neutral-500">Event ID</dt>
                          <dd className="font-mono text-neutral-800">
                            {eventPayload.id}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Request ID</dt>
                          <dd className="font-mono text-neutral-800">
                            {eventPayload.metadata.requestId}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Source</dt>
                          <dd>{eventPayload.metadata.source}</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Timestamp</dt>
                          <dd>
                            {new Date(
                              eventPayload.metadata.timestamp,
                            ).toLocaleString()}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Payload
                      </p>
                      <pre className="mt-2 whitespace-pre-wrap rounded border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-700">
                        {JSON.stringify(eventPayload.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-500">
                    Diagnostics appear after you run the first prompt.
                  </p>
                )}
              </article>
            </section>
          </>
        )}
      </section>
    </main>
  );
}


