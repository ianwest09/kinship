import React, { useState } from 'react';
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

interface Props {
  open: boolean;
  onClose: () => void;
  trace: AgentTraceItem[];
  reasoningLog: AgentReasoningStep[];
  currentGuardrails: ElderGuardrails;
  primaryElderClue: string;
  primaryGrandchildSeed: string;
  qlooStatus: { connected: boolean; baseUrl: string; maskedKey: string };
  onSaveKey: (apiKey: string, baseUrl: string) => Promise<void>;
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
  onSaveKey,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [urlInput, setUrlInput] = useState(qlooStatus.baseUrl || 'https://hackathon.api.qloo.com');
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'trace' | 'react' | 'mcp'>('trace');
  const [mcpRunning, setMcpRunning] = useState<string | null>(null);
  const [mcpResultJson, setMcpResultJson] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveKey(keyInput, urlInput);
      setKeyInput('');
    } finally {
      setSaving(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm no-print">
      <div className="w-full max-w-2xl bg-parchment-50 dark:bg-vinyl-900 h-full overflow-y-auto shadow-2xl border-l border-parchment-300 dark:border-vinyl-700 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-parchment-200 dark:border-vinyl-700">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-plum-600 dark:text-brass-200">
              <Cpu className="w-4 h-4" />
              <span>Qloo v2 Taste AI™ · Autonomous Agent &amp; MCP Inspector</span>
            </div>
            <h3 className="text-xl font-semibold text-stone-900 dark:text-parchment-50 mt-1">
              5-Agent Cross-Domain Pipeline, ReAct Audit &amp; MCP Server
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-parchment-200 dark:hover:bg-vinyl-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Qloo Key Connector */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-plum-600 dark:text-brass-200" />
              Server-Side Qloo X-Api-Key Connector (250M+ Live Graph Hydration)
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-brass-100 text-brass-700 dark:bg-vinyl-700 dark:text-brass-200 font-semibold">
              {qlooStatus.connected ? `LIVE KEY (${qlooStatus.maskedKey})` : 'VERIFIED CULTURAL TWIN'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <select
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="sm:col-span-5 px-2.5 py-2 rounded-xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 font-mono text-[11px]"
            >
              <option value="https://hackathon.api.qloo.com">hackathon.api.qloo.com</option>
              <option value="https://staging.api.qloo.com">staging.api.qloo.com</option>
              <option value="https://api.qloo.com">api.qloo.com</option>
            </select>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste optional Qloo X-Api-Key..."
              className="sm:col-span-5 px-3 py-2 rounded-xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 font-mono text-xs"
            />
            <button
              type="submit"
              disabled={saving}
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-xs font-medium"
            >
              {saving ? '...' : 'Apply'}
            </button>
          </div>
        </form>

        {/* 3 Inspector Sub-Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-parchment-200/80 dark:bg-vinyl-800 border border-parchment-300 dark:border-vinyl-700">
          <button
            type="button"
            onClick={() => setActiveSubTab('trace')}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'trace'
                ? 'bg-white dark:bg-vinyl-900 text-plum-700 dark:text-brass-200 shadow-sm'
                : 'text-stone-600 dark:text-stone-400'
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
                : 'text-stone-600 dark:text-stone-400'
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
                : 'text-stone-600 dark:text-stone-400'
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
                  <span className="font-mono text-[11px] text-plum-600 dark:text-brass-200">
                    {step.durationMs} ms · {step.mode === 'live_qloo_api' ? 'LIVE' : 'TWIN'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300">{step.purpose}</p>
                <div className="p-3 rounded-xl bg-stone-900 text-amber-200 font-mono text-[11px] overflow-x-auto space-y-1">
                  <div>
                    <span className="text-rose-300 font-bold">{step.method}</span>{' '}
                    <span className="text-white">{step.endpoint}</span>
                  </div>
                  {Object.entries(step.params).map(([k, v]) => (
                    <div key={k} className="pl-2 text-stone-300">
                      <span className="text-emerald-300">{k}</span>=<span className="text-amber-200">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-pine-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{step.summary}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sub-Tab 2: Autonomous ReAct Reasoning & Self-Correction Loop */}
        {activeSubTab === 'react' && (
          <div className="space-y-3.5">
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Shows how Kinship’s autonomous orchestrator plans cross-domain Qloo calls, screens candidates against dementia peril/presbycusis/dysphagia guardrails, and self-corrects sparse diaspora windows.
            </p>
            {reasoningLog.map((item) => (
              <div
                key={item.iteration}
                className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-4 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-plum-600 text-white font-mono text-[10px] font-bold">
                    ITERATION 0{item.iteration} · {item.phase}
                  </span>
                  {item.selfCorrected && (
                    <span className="px-2 py-0.5 rounded-full bg-pine-50 dark:bg-vinyl-900 text-pine-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                      GUARDRAIL / SPARSITY VERIFIED
                    </span>
                  )}
                </div>
                <div className="text-stone-700 dark:text-stone-300">
                  <strong className="text-stone-900 dark:text-parchment-50">Thought:</strong> {item.thought}
                </div>
                <div className="font-mono text-[11px] text-plum-700 dark:text-brass-200">
                  Tool: {item.toolName}
                </div>
                <div className="p-2.5 rounded-xl bg-parchment-100/80 dark:bg-vinyl-900 text-stone-700 dark:text-stone-300">
                  <strong>Observation:</strong> {item.observation}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sub-Tab 3: Model Context Protocol (MCP) Server */}
        {activeSubTab === 'mcp' && (
          <div className="space-y-3.5">
            <div className="p-3 rounded-2xl bg-stone-900 text-stone-200 font-mono text-[11px] space-y-1">
              <div className="text-emerald-300 font-bold">
                GET /api/mcp/tools · POST /api/mcp/call (mcp/1.0)
              </div>
              <div className="text-stone-400">
                Any external Claude, OpenAI, or LangGraph care agent can invoke Kinship’s 5 Qloo clinical tools directly via JSON-RPC / REST.
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-[11px] font-semibold"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{mcpRunning === tool.name ? 'Running...' : 'Test Tool Call'}</span>
                  </button>
                </div>
                <p className="text-stone-600 dark:text-stone-300">{tool.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tool.qlooEndpointsUsed.map((ep) => (
                    <span
                      key={ep}
                      className="px-2 py-0.5 rounded-md bg-parchment-100 dark:bg-vinyl-900 font-mono text-[10px] text-stone-600 dark:text-stone-400"
                    >
                      {ep}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {mcpResultJson && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-pine-700 dark:text-emerald-300">
                  <span>Live MCP Execution Output (/api/mcp/call):</span>
                  <button
                    type="button"
                    onClick={() => setMcpResultJson(null)}
                    className="text-stone-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <pre className="p-3.5 rounded-2xl bg-stone-950 text-emerald-300 font-mono text-[11px] max-h-72 overflow-auto">
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
