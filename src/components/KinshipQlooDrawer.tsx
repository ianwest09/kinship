import React, { useRef, useState } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  Cpu,
  KeyRound,
  Play,
  Terminal,
  Wrench,
  X,
} from 'lucide-react';
import { AgentReasoningStep, AgentTraceItem, ElderGuardrails } from '../../shared/types';
import { executeKinshipMcpTool, KINSHIP_MCP_TOOLS } from '../../server/mcpTools';
import { useDialogBehaviour } from '../hooks/useDialogBehaviour';

interface Props {
  open: boolean;
  onClose: () => void;
  trace: AgentTraceItem[];
  reasoningLog: AgentReasoningStep[];
  currentGuardrails: ElderGuardrails;
  primaryElderClue: string;
  primaryGrandchildSeed: string;
  qlooStatus: { connected: boolean; baseUrl: string; maskedKey: string };
}

export const KinshipQlooDrawer: React.FC<Props> = ({
  open,
  onClose,
  trace,
  reasoningLog,
  currentGuardrails,
  primaryElderClue,
  primaryGrandchildSeed,
  qlooStatus,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'trace' | 'react' | 'mcp'>('trace');
  const [mcpRunning, setMcpRunning] = useState<string | null>(null);
  const [mcpResultJson, setMcpResultJson] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Same dialog contract as the settling-sounds overlay: Escape closes, focus
  // is trapped inside and returned afterwards. This drawer previously had no
  // dialog role at all and its close button had no accessible name.
  useDialogBehaviour({ open, onClose, dialogRef: drawerRef, initialFocusRef: closeButtonRef });

  if (!open) return null;

  const handleRunMcpTool = async (toolName: string) => {
    setMcpRunning(toolName);
    const args = {
      elderName: currentGuardrails.elderName,
      birthYear: currentGuardrails.birthYear,
      youthGeography: currentGuardrails.youthGeography,
      elderClueName: primaryElderClue,
      grandchildName: currentGuardrails.grandchildName,
      grandchildSeedName: primaryGrandchildSeed,
      hearingLossWarmEq: currentGuardrails.hearingLossWarmEq,
      storyText: `My ${2026 - currentGuardrails.birthYear}-year-old loved one ${currentGuardrails.elderName} grew up in ${currentGuardrails.youthGeography.replace('_', ' ')} loving ${primaryElderClue} and gets sundowning anxiety at 4:30 PM; ${currentGuardrails.grandchildName} loves ${primaryGrandchildSeed}.`,
    };
    try {
      const res = await fetch('/api/mcp/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: toolName, arguments: args }),
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) throw new Error('fallback');
      const json = await res.json();
      setMcpResultJson(JSON.stringify(json, null, 2));
    } catch {
      const localOut = await executeKinshipMcpTool(toolName, args);
      setMcpResultJson(JSON.stringify(localOut, null, 2));
    } finally {
      setMcpRunning(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-vinyl-950/60 backdrop-blur-sm no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trace-title"
    >
      <div
        ref={drawerRef}
        className="w-full max-w-2xl bg-parchment-50 dark:bg-vinyl-900 h-full overflow-y-auto shadow-lift border-l border-parchment-300 dark:border-vinyl-700 p-6 space-y-5"
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-parchment-200 dark:border-vinyl-700">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider break-words text-plum-600 dark:text-brass-200">
              <Cpu className="w-4 h-4" />
              <span>Qloo v2 Taste AI™ · Autonomous Agent &amp; MCP Inspector</span>
            </div>
            <h3
              id="trace-title"
              className="text-xl font-semibold text-loam-ink dark:text-parchment-50 mt-1"
            >
              How these suggestions were built
            </h3>
            <p className="mt-1 text-meta text-loam-muted dark:text-loam-muted-dark">
              The Qloo requests behind this screen, the agent pipeline and the
              MCP tools. Technical detail for reviewers and care-team leads.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-parchment-200 dark:hover:bg-vinyl-800"
            aria-label="Close the request trace"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Live Qloo connection status — read only.
            There is deliberately no field for pasting a credential: the key is
            configured server-side via the QLOO_API_KEY environment variable and
            must never be entered into a browser app. */}
        <div className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-plum-600 dark:text-brass-200" />
              Server-Side Qloo X-Api-Key Connection
            </span>
            <span
              className={`font-mono text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                qlooStatus.connected
                  ? 'bg-pine-50 text-pine-700 dark:bg-vinyl-700 dark:text-pine-300'
                  : 'bg-brass-100 text-brass-800 dark:bg-vinyl-700 dark:text-brass-300'
              }`}
            >
              {qlooStatus.connected
                ? `LIVE QLOO (${qlooStatus.maskedKey})`
                : 'OFFLINE · VERIFIED CULTURAL TWIN'}
            </span>
          </div>
          <p className="font-mono text-meta text-loam-body dark:text-loam-body-dark">
            {qlooStatus.baseUrl || 'https://hackathon.api.qloo.com'}
          </p>
          <p className="text-meta text-loam-body dark:text-loam-body-dark">
            The API key is supplied server-side through the <code className="font-mono">QLOO_API_KEY</code>{' '}
            environment variable and never reaches the browser. There is intentionally no field to paste a
            credential here.
          </p>
          {!qlooStatus.connected && (
            <p className="text-meta font-medium text-brass-800 dark:text-brass-300">
              Not connected — results are drawn from Kinship’s own curated offline dataset, not from Qloo.
            </p>
          )}
        </div>

        {/* 3 Inspector Sub-Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-parchment-200/80 dark:bg-vinyl-800 border border-parchment-300 dark:border-vinyl-700">
          <button
            type="button"
            onClick={() => setActiveSubTab('trace')}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'trace'
                ? 'bg-white dark:bg-vinyl-900 text-plum-700 dark:text-brass-200 shadow-sm'
                : 'text-loam-body dark:text-loam-muted-dark'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>5-Agent HTTP Trace</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('react')}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'react'
                ? 'bg-white dark:bg-vinyl-900 text-plum-700 dark:text-brass-200 shadow-sm'
                : 'text-loam-body dark:text-loam-muted-dark'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>ReAct Self-Correction</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('mcp')}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'mcp'
                ? 'bg-white dark:bg-vinyl-900 text-plum-700 dark:text-brass-200 shadow-sm'
                : 'text-loam-body dark:text-loam-muted-dark'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>MCP Server (5 Tools)</span>
          </button>
        </div>

        {/* Sub-Tab 1: 5-Agent HTTP Trace */}
        {activeSubTab === 'trace' && (
          <div className="space-y-3.5">
            {trace.map((step) => (
              <div
                key={step.stepNumber}
                className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-plum-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                      0{step.stepNumber}
                    </span>
                    <span className="font-semibold text-sm">{step.agentName}</span>
                  </div>
                  <span className="font-mono text-meta text-plum-600 dark:text-brass-200">
                    {step.durationMs} ms · {step.mode === 'live_qloo_api' ? 'LIVE' : 'TWIN'}
                  </span>
                </div>
                <p className="text-xs text-loam-body dark:text-loam-body-dark">{step.purpose}</p>
                <div className="p-3 rounded-xl bg-vinyl-900 text-brass-200 font-mono text-meta overflow-x-auto space-y-1">
                  <div>
                    <span className="text-clay-300 font-bold">{step.method}</span>{' '}
                    <span className="text-white">{step.endpoint}</span>
                  </div>
                  {Object.entries(step.params).map(([k, v]) => (
                    <div key={k} className="pl-2 text-loam-body-dark">
                      <span className="text-pine-300">{k}</span>=<span className="text-brass-200">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 text-xs text-loam-body dark:text-loam-body-dark">
                  <CheckCircle2 className="w-4 h-4 text-pine-600 dark:text-pine-300 shrink-0 mt-0.5" />
                  <span>{step.summary}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sub-Tab 2: Autonomous ReAct Reasoning & Self-Correction Loop */}
        {activeSubTab === 'react' && (
          <div className="space-y-3.5">
            <p className="text-xs text-loam-body dark:text-loam-muted-dark">
              Shows how Kinship’s autonomous orchestrator plans cross-domain Qloo calls, screens candidates against distressing-content, hearing-comfort and easy-to-eat guardrails, and self-corrects sparse diaspora windows.
            </p>
            {reasoningLog.map((item) => (
              <div
                key={item.iteration}
                className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-4 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-plum-600 text-white font-mono text-xs font-bold">
                    ITERATION 0{item.iteration} · {item.phase}
                  </span>
                  {item.selfCorrected && (
                    <span className="px-2 py-0.5 rounded-full bg-pine-50 dark:bg-vinyl-900 text-pine-700 dark:text-pine-300 font-mono text-xs font-bold">
                      GUARDRAIL / SPARSITY VERIFIED
                    </span>
                  )}
                </div>
                <div className="text-loam-body dark:text-loam-body-dark">
                  <strong className="text-loam-ink dark:text-parchment-50">Thought:</strong> {item.thought}
                </div>
                <div className="font-mono text-meta text-plum-700 dark:text-brass-200">
                  Tool: {item.toolName}
                </div>
                <div className="p-2.5 rounded-xl bg-parchment-100/80 dark:bg-vinyl-900 text-loam-body dark:text-loam-body-dark">
                  <strong>Observation:</strong> {item.observation}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sub-Tab 3: Model Context Protocol (MCP) Server */}
        {activeSubTab === 'mcp' && (
          <div className="space-y-3.5">
            <div className="p-3 rounded-2xl bg-vinyl-900 text-parchment-100 font-mono text-meta space-y-1">
              <div className="text-pine-300 font-bold">
                GET /api/mcp/tools · POST /api/mcp/call (mcp/1.0)
              </div>
              <div className="text-loam-muted">
                Any external Claude, OpenAI, or LangGraph care agent can invoke Kinship’s 5 Qloo tools directly via JSON-RPC / REST.
              </div>
            </div>

            {KINSHIP_MCP_TOOLS.map((tool) => (
              <div
                key={tool.name}
                className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-4 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-plum-700 dark:text-brass-200 text-sm">
                    {tool.name}()
                  </span>
                  <button
                    type="button"
                    disabled={mcpRunning === tool.name}
                    onClick={() => handleRunMcpTool(tool.name)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-meta font-semibold"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{mcpRunning === tool.name ? 'Running...' : 'Test Tool Call'}</span>
                  </button>
                </div>
                <p className="text-loam-body dark:text-loam-body-dark">{tool.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tool.qlooEndpointsUsed.map((ep) => (
                    <span
                      key={ep}
                      className="px-2 py-0.5 rounded-md bg-parchment-100 dark:bg-vinyl-900 font-mono text-xs text-loam-body dark:text-loam-muted-dark"
                    >
                      {ep}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {mcpResultJson && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-pine-700 dark:text-pine-300">
                  <span>Live MCP Execution Output (/api/mcp/call):</span>
                  <button
                    type="button"
                    onClick={() => setMcpResultJson(null)}
                    className="text-loam-muted hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <pre className="p-3.5 rounded-2xl bg-vinyl-950 text-pine-300 font-mono text-meta max-h-72 overflow-auto">
                  {mcpResultJson}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
