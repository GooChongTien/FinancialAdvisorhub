import React, { useState } from "react";
import { ChevronDown, ChevronUp, Activity, BarChart2, Database, Clock } from "lucide-react";
import { Badge } from "@/admin/components/ui/badge.jsx";
import { cn } from "@/lib/utils";

/**
 * Intent Debug Panel
 *
 * Development tool for inspecting intent classification and routing decisions.
 * Displays classification metadata, candidate agents, cache stats, and execution logs.
 *
 * Enabled via ?debug=true query parameter.
 */
export function IntentDebugPanel({
  classification,
  cacheStats,
  executionLogs = [],
  isVisible = false
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isVisible) return null;

  const getConfidenceBadgeColor = (confidence) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-300";
    if (confidence >= 0.5) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3
    });
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden rounded-lg border-2 border-purple-500 bg-slate-900 shadow-2xl"
      role="region"
      aria-label="Intent Classification Debug Panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-purple-900/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-300" />
          <span className="text-sm font-semibold text-purple-100">Intent Debug</span>
          <Badge className="bg-purple-700 text-purple-100 text-xs border-0">DEV</Badge>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded p-1 text-purple-300 hover:bg-purple-800/50 hover:text-purple-100"
          aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">
          {/* Classification Section */}
          {classification && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="h-3.5 w-3.5 text-purple-400" />
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                  Classification
                </h3>
              </div>

              <div className="rounded-lg bg-slate-800/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Topic</span>
                  <Badge className="bg-blue-900/50 text-blue-200 border-blue-700 text-xs">
                    {classification.topic || "unknown"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Subtopic</span>
                  <Badge className="bg-indigo-900/50 text-indigo-200 border-indigo-700 text-xs">
                    {classification.subtopic || "general"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Intent</span>
                  <Badge className="bg-purple-900/50 text-purple-200 border-purple-700 text-xs">
                    {classification.intent || "unknown"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Confidence</span>
                  <Badge
                    className={cn(
                      "border text-xs font-semibold",
                      getConfidenceBadgeColor(classification.confidence || 0)
                    )}
                  >
                    {((classification.confidence || 0) * 100).toFixed(1)}%
                  </Badge>
                </div>

                {classification.confidenceTier && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Tier</span>
                    <Badge className="bg-slate-700 text-slate-200 border-slate-600 text-xs">
                      {classification.confidenceTier}
                    </Badge>
                  </div>
                )}

                {typeof classification.shouldSwitchTopic !== "undefined" && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Topic Switch</span>
                    <Badge
                      className={cn(
                        "text-xs border",
                        classification.shouldSwitchTopic
                          ? "bg-orange-900/50 text-orange-200 border-orange-700"
                          : "bg-green-900/50 text-green-200 border-green-700"
                      )}
                    >
                      {classification.shouldSwitchTopic ? "Yes" : "No"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Candidate Agents Section */}
          {classification?.candidateAgents && classification.candidateAgents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-3.5 w-3.5 text-purple-400" />
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                  Candidate Agents
                </h3>
              </div>

              <div className="space-y-2">
                {classification.candidateAgents.map((candidate, index) => (
                  <div
                    key={`${candidate.agentId}-${index}`}
                    className="rounded-lg bg-slate-800/80 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        #{index + 1} {candidate.agentId}
                      </span>
                      <Badge
                        className={cn(
                          "border text-xs",
                          getConfidenceBadgeColor(candidate.score || 0)
                        )}
                      >
                        {((candidate.score || 0) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    {candidate.reason && (
                      <p className="text-xs text-slate-400 italic">
                        {candidate.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cache Stats Section */}
          {cacheStats && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-3.5 w-3.5 text-purple-400" />
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                  Cache Stats
                </h3>
              </div>

              <div className="rounded-lg bg-slate-800/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Size</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {cacheStats.size || 0} / {cacheStats.maxSize || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">TTL</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {Math.round((cacheStats.ttlMs || 0) / 1000)}s
                  </span>
                </div>

                {typeof cacheStats.hitRate !== "undefined" && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Hit Rate</span>
                    <Badge
                      className={cn(
                        "border text-xs",
                        cacheStats.hitRate >= 0.5
                          ? "bg-green-900/50 text-green-200 border-green-700"
                          : "bg-yellow-900/50 text-yellow-200 border-yellow-700"
                      )}
                    >
                      {(cacheStats.hitRate * 100).toFixed(1)}%
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Execution Logs Section */}
          {executionLogs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-purple-400" />
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                  Execution Logs
                </h3>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {executionLogs.map((log, index) => (
                  <div
                    key={`${log.timestamp}-${index}`}
                    className="rounded-lg bg-slate-800/80 p-2 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-400">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <Badge
                        className={cn(
                          "text-xs border",
                          log.status === "success"
                            ? "bg-green-900/50 text-green-200 border-green-700"
                            : log.status === "error"
                            ? "bg-red-900/50 text-red-200 border-red-700"
                            : "bg-blue-900/50 text-blue-200 border-blue-700"
                        )}
                      >
                        {log.status || "pending"}
                      </Badge>
                    </div>
                    <p className="text-slate-300 font-medium">
                      {log.action || log.message || "Unknown action"}
                    </p>
                    {log.duration && (
                      <p className="text-slate-500 text-xs">
                        Duration: {log.duration}ms
                      </p>
                    )}
                    {log.error && (
                      <p className="text-red-400 text-xs italic">
                        Error: {log.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!classification && !cacheStats && executionLogs.length === 0 && (
            <div className="py-8 text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs text-slate-500">
                No debug data available yet
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Send a message to see classification details
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default IntentDebugPanel;
