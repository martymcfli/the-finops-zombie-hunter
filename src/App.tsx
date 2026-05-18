import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  MessageSquare,
  Server,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import mockData from './mockData.json';

type InstanceData = {
  instanceId: string;
  instanceType: string;
  ownerName: string;
  ownerEmail: string;
  cpuUtilizationAvg: number;
  networkInBytes: number;
  daysRunning: number;
  monthlyCost: number;
};

// ---------------------------------------------------------------------------
// Slack Message Builder
// ---------------------------------------------------------------------------
function buildSlackMessage(instance: InstanceData): string {
  const firstName = instance.ownerName.split(' ')[0];
  return (
    `Hey @${firstName} 👋 — this is an automated alert from *FinOps Zombie Hunter*.\n\n` +
    `Your instance *${instance.instanceId}* (\`${instance.instanceType}\`) has been flagged as ` +
    `*idle / zombie* based on near-zero network utilisation over the past 30 days ` +
    `(${instance.networkInBytes.toLocaleString()} bytes in).\n\n` +
    `📊 *Impact Summary*\n` +
    `• Monthly cost burning: *$${instance.monthlyCost.toFixed(2)}*\n` +
    `• Idle power draw: *~120 W* of unnecessary grid load\n` +
    `• Days running without activity: *${instance.daysRunning} days*\n\n` +
    `If this instance is no longer needed, please click *Approve Decommission* below to initiate ` +
    `automated teardown. If it should remain active, click *Keep Alive* and provide a justification ` +
    `in the thread.\n\n` +
    `_This request will auto-escalate to your department head in 48 hours if no action is taken._`
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse p-1">
      {/* Fake channel bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 rounded bg-slate-700" />
        <div className="h-3 w-32 rounded bg-slate-700" />
      </div>
      {/* Fake message header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-700 shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex gap-3 items-center">
            <div className="h-3 w-36 rounded bg-slate-700" />
            <div className="h-3 w-16 rounded bg-slate-700/50" />
          </div>
          <div className="h-3 w-full rounded bg-slate-700" />
          <div className="h-3 w-5/6 rounded bg-slate-700" />
          <div className="h-3 w-4/6 rounded bg-slate-700" />
        </div>
      </div>
      {/* Fake impact block */}
      <div className="ml-13 flex flex-col gap-2 border-l-2 border-slate-700 pl-4">
        <div className="h-3 w-40 rounded bg-slate-700" />
        <div className="h-3 w-56 rounded bg-slate-700/70" />
        <div className="h-3 w-48 rounded bg-slate-700/70" />
        <div className="h-3 w-52 rounded bg-slate-700/70" />
      </div>
      {/* Fake body lines */}
      <div className="ml-13 flex flex-col gap-2">
        <div className="h-3 w-full rounded bg-slate-700/60" />
        <div className="h-3 w-11/12 rounded bg-slate-700/60" />
        <div className="h-3 w-3/4 rounded bg-slate-700/60" />
      </div>
      {/* Fake buttons */}
      <div className="flex gap-3 mt-2">
        <div className="h-9 w-40 rounded-lg bg-slate-700" />
        <div className="h-9 w-28 rounded-lg bg-slate-700/50" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slack Message Card
// ---------------------------------------------------------------------------
function SlackMessageCard({ instance, message }: { instance: InstanceData; message: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render the message with basic markdown-like formatting
  const renderLine = (line: string, idx: number) => {
    // Bold (*text*)
    const parts = line.split(/(\*[^*]+\*|`[^`]+`)/g);
    return (
      <span key={idx}>
        {parts.map((part, i) => {
          if (part.startsWith('*') && part.endsWith('*')) {
            return <strong key={i} className="text-slate-100 font-semibold">{part.slice(1, -1)}</strong>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="bg-slate-700 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
          }
          return part;
        })}
      </span>
    );
  };

  const lines = message.split('\n');

  return (
    <div className="flex flex-col gap-4">
      {/* Channel header */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="text-slate-600">#</span>
        <span>finops-alerts</span>
        <span className="ml-auto text-slate-600 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          Slack Preview
        </span>
      </div>

      {/* Message card */}
      <div className="bg-slate-800/80 border border-white/10 rounded-xl overflow-hidden">
        {/* Left accent bar (Slack-style) */}
        <div className="flex">
          <div className="w-1 bg-indigo-500 shrink-0" />
          <div className="flex flex-col gap-1 p-4 flex-1 min-w-0">
            {/* Bot header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shrink-0 shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">FinOps Zombie Hunter</span>
                  <span className="text-[10px] bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-medium">APP</span>
                </div>
                <span className="text-xs text-slate-500">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Message body */}
            <div className="text-sm text-slate-300 leading-relaxed space-y-2">
              {lines.map((line, idx) => {
                if (line === '') return <div key={idx} className="h-1" />;

                // Bullet list items
                if (line.startsWith('• ')) {
                  return (
                    <div key={idx} className="flex items-start gap-2 pl-2">
                      <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                      <span>{renderLine(line.slice(2), idx)}</span>
                    </div>
                  );
                }

                // Section headers (emoji lines)
                if (line.match(/^📊|^👋/)) {
                  return (
                    <p key={idx} className="font-medium text-slate-200">
                      {renderLine(line, idx)}
                    </p>
                  );
                }

                // Italic lines (_text_)
                if (line.startsWith('_') && line.endsWith('_')) {
                  return (
                    <p key={idx} className="text-slate-500 text-xs italic mt-1">
                      {line.slice(1, -1)}
                    </p>
                  );
                }

                return <p key={idx}>{renderLine(line, idx)}</p>;
              })}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
              <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-red-900/40">
                <Trash2 className="w-4 h-4" />
                Approve Decommission
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm font-medium rounded-lg transition-colors border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Keep Alive
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-slate-800/50 text-sm font-medium transition-all group"
      >
        {copied ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">Copied to clipboard!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
            Copy message text
          </>
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const [data, setData] = useState<InstanceData[]>(mockData);

  // --- Panel state ---
  const [selectedZombie, setSelectedZombie] = useState<InstanceData | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);   // controls render
  const [isPanelOpen, setIsPanelOpen] = useState(false);         // controls CSS transform
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);

  const handleZombieClick = (instance: InstanceData) => {
    if (instance.networkInBytes >= 50000) return;

    // Reset & open
    setSelectedZombie(instance);
    setGeneratedMessage(null);
    setIsGenerating(true);
    setIsPanelVisible(true);

    // Trigger CSS transition on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsPanelOpen(true));
    });

    // Simulate 2-second AI API call
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedMessage(buildSlackMessage(instance));
    }, 2000);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => {
      setIsPanelVisible(false);
      setSelectedZombie(null);
      setGeneratedMessage(null);
    }, 350); // match transition duration
  };

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const loadAppClusterA = () => {
    setData(mockData.filter((i) => i.instanceType.startsWith('t') || i.instanceType.startsWith('c')));
  };

  const loadDBTier2 = () => {
    setData(mockData.filter((i) => i.instanceType.startsWith('m') || i.instanceType.startsWith('r')));
  };

  const clearData = () => {
    setData([]);
  };

  // --- DYNAMIC MATH LOGIC (unchanged) ---
  const dynamicMetrics = useMemo(() => {
    const zombies = data.filter((instance) => instance.networkInBytes < 50000);
    const totalCostWaste = zombies.reduce((acc, curr) => acc + curr.monthlyCost, 0);
    const totalPowerWatts = zombies.length * 120;
    const totalPowerKW = totalPowerWatts / 1000;
    const coolingLoadTons = (totalPowerKW * 1.3) / 3.517;

    return [
      {
        title: 'Total Waste / Mo',
        value: `$${totalCostWaste.toFixed(2)}`,
        change: `${zombies.length} instances`,
        trend: totalCostWaste > 0 ? 'up' : 'neutral',
        icon: <AlertTriangle className="text-red-500 w-6 h-6" />,
      },
      {
        title: 'Power Waste (Grid)',
        value: `${totalPowerKW.toFixed(2)} kW`,
        change: 'Idle Draw',
        trend: totalPowerKW > 0 ? 'down' : 'neutral',
        icon: <Zap className="text-yellow-400 w-6 h-6" />,
      },
      {
        title: 'HVAC Cooling Load',
        value: `${coolingLoadTons.toFixed(2)} Tons`,
        change: 'Facility Strain',
        trend: coolingLoadTons > 0 ? 'up' : 'neutral',
        icon: <Activity className="text-blue-400 w-6 h-6" />,
      },
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30">

      {/* ── Watermark mascot ── */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <img
          src="/mascot.jpeg"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="w-[90vw] max-w-5xl opacity-[0.045] select-none"
          style={{ filter: 'saturate(0.6) brightness(1.4)' }}
        />
      </div>

      {/* Top Navbar */}
      <header className="h-16 border-b border-white/10 bg-slate-900/50 flex items-center px-6 shrink-0 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 shadow-lg shadow-black/40 shrink-0">
            <img
              src="/mascot.jpeg"
              alt="FinOps Zombie Hunter mascot"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            The FinOps Zombie Hunter
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-4 text-sm font-medium text-slate-400">
          <span>Enterprise Dashboard</span>
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
            <span className="text-xs text-white">AD</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-slate-900/20 p-4 flex flex-col gap-2 shrink-0">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Data Sources
          </div>
          <button
            onClick={loadAppClusterA}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-white transition-colors group"
          >
            <Server className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span className="text-sm font-medium">Load App-Cluster-A</span>
          </button>
          <button
            onClick={loadDBTier2}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-white transition-colors group"
          >
            <Database className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span className="text-sm font-medium">Load DB-Tier-2</span>
          </button>
          <div className="mt-auto pt-4 border-t border-white/5">
            <button
              onClick={clearData}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors group"
            >
              <Trash2 className="w-4 h-4 group-hover:text-red-400 transition-colors" />
              <span className="text-sm font-medium">Clear Data</span>
            </button>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-auto p-8 flex flex-col gap-8">
          {/* Top Row Metric Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dynamicMetrics.map((metric, i) => (
              <div
                key={i}
                className="bg-slate-900/40 border border-white/10 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">{metric.title}</p>
                    <h3 className="text-3xl font-semibold text-white tracking-tight">{metric.value}</h3>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded-lg border border-white/5 shadow-inner">
                    {metric.icon}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 relative z-10">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-md ${
                      metric.trend === 'up' && metric.title.includes('Waste')
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : metric.trend === 'down' || metric.title.includes('Grid')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                  >
                    {metric.change}
                  </span>
                </div>
              </div>
            ))}
          </section>

          {/* Data Table Area */}
          <section className="bg-slate-900/40 border border-white/10 rounded-xl overflow-hidden flex flex-col min-h-0 relative">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  Stranded Resources Deep Dive
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Review potentially orphaned 'zombie' servers based on extremely low network utilization.{' '}
                  <span className="text-indigo-400">Click a zombie row</span> to generate an AI decommission request.
                </p>
              </div>
              <div className="text-sm font-medium text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full border border-white/5">
                {data.length} Instances
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-medium first:pl-6 last:pr-6">Instance ID</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Owner</th>
                    <th className="px-6 py-4 font-medium text-right">CPU Avg (%)</th>
                    <th className="px-6 py-4 font-medium text-right">Network (Bytes)</th>
                    <th className="px-6 py-4 font-medium text-right">Days Running</th>
                    <th className="px-6 py-4 font-medium text-right">Monthly Cost</th>
                    <th className="px-6 py-4 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.length > 0 ? (
                    data.map((instance) => {
                      const isZombie = instance.networkInBytes < 50000;
                      const isSelected = selectedZombie?.instanceId === instance.instanceId && isPanelVisible;
                      return (
                        <tr
                          key={instance.instanceId}
                          onClick={() => handleZombieClick(instance)}
                          className={`transition-colors ${
                            isZombie
                              ? 'cursor-pointer hover:bg-red-900/20'
                              : 'cursor-default'
                          } ${
                            isSelected
                              ? 'bg-indigo-900/20 ring-1 ring-inset ring-indigo-500/30'
                              : isZombie
                              ? 'bg-red-950/10'
                              : ''
                          }`}
                        >
                          <td className="px-6 py-4 font-mono text-slate-300">
                            <div className="flex items-center gap-2">
                              {isZombie ? (
                                <div
                                  className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"
                                  title="Potential Zombie — click to generate decommission request"
                                />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                              )}
                              {instance.instanceId}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-300 border border-white/5">
                              {instance.instanceType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-slate-200">{instance.ownerName}</span>
                              <span className="text-xs text-slate-500">{instance.ownerEmail}</span>
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-right font-medium ${instance.cpuUtilizationAvg < 5 ? 'text-red-400' : 'text-slate-300'}`}>
                            {instance.cpuUtilizationAvg.toFixed(1)}%
                          </td>
                          <td className={`px-6 py-4 text-right font-mono ${isZombie ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                            {instance.networkInBytes.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-300">{instance.daysRunning}</td>
                          <td className="px-6 py-4 text-right font-medium text-emerald-400">
                            ${instance.monthlyCost.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isZombie ? (
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                }`}
                              >
                                <MessageSquare className="w-3 h-3" />
                                {isSelected ? 'Open' : 'Contact'}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        <Database className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        No instance data currently loaded. Use the sidebar to load clusters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* AI Communication Panel — slide-out from right                       */}
      {/* ------------------------------------------------------------------ */}
      {isPanelVisible && (
        <>
          {/* Backdrop */}
          <div
            onClick={closePanel}
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-350 ${
              isPanelOpen ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Panel */}
          <aside
            className={`fixed right-0 top-0 h-full w-full max-w-[520px] bg-slate-900 border-l border-white/10 z-40 flex flex-col shadow-2xl shadow-black/60 transition-transform duration-350 ease-in-out ${
              isPanelOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Panel Header */}
            <div className="h-16 border-b border-white/10 px-5 flex items-center justify-between shrink-0 bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600/20 p-1.5 rounded-lg border border-indigo-500/30">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">AI Communication Agent</p>
                  {selectedZombie && (
                    <p className="text-xs text-slate-500 font-mono">{selectedZombie.instanceId}</p>
                  )}
                </div>
              </div>
              <button
                onClick={closePanel}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

              {/* Instance summary strip */}
              {selectedZombie && (
                <div className="bg-slate-800/60 border border-white/5 rounded-xl p-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 uppercase tracking-wider font-semibold">Owner</span>
                    <span className="text-slate-200 font-medium">{selectedZombie.ownerName}</span>
                    <span className="text-slate-500">{selectedZombie.ownerEmail}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 uppercase tracking-wider font-semibold">Type</span>
                    <span className="text-slate-200 font-mono">{selectedZombie.instanceType}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 uppercase tracking-wider font-semibold">Monthly Cost</span>
                    <span className="text-emerald-400 font-semibold">${selectedZombie.monthlyCost.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 uppercase tracking-wider font-semibold">Days Idle</span>
                    <span className="text-red-400 font-semibold">{selectedZombie.daysRunning}d</span>
                  </div>
                </div>
              )}

              {/* Status indicator */}
              <div className="flex items-center gap-2 text-xs">
                {isGenerating ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                    </span>
                    <span className="text-indigo-400 font-medium">Generating AI Decommission Request...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Message ready — review before sending</span>
                  </>
                )}
              </div>

              {/* Content area */}
              {isGenerating ? (
                <LoadingSkeleton />
              ) : generatedMessage && selectedZombie ? (
                <SlackMessageCard instance={selectedZombie} message={generatedMessage} />
              ) : null}
            </div>

            {/* Panel Footer */}
            <div className="border-t border-white/5 px-5 py-4 bg-slate-900/60 shrink-0">
              <p className="text-xs text-slate-600 text-center">
                This is a simulated preview. No message has been sent. Pressing "Approve Decommission" would trigger the automated teardown workflow.
              </p>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
