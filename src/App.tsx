import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  Download,
  Filter,
  MessageSquare,
  Server,
  Skull,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
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
// Count-up animation hook
// ---------------------------------------------------------------------------
function useCountUp(target: number, duration = 900): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setCurrent(from + (target - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    setCurrent(0);
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return current;
}

// ---------------------------------------------------------------------------
// Animated metric value component
// ---------------------------------------------------------------------------
function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const animated = useCountUp(value);
  return <>{prefix}{animated.toFixed(decimals)}{suffix}</>;
}

// ---------------------------------------------------------------------------
// Slack message builder
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
// Loading skeleton
// ---------------------------------------------------------------------------
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse p-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 rounded bg-slate-700" />
        <div className="h-3 w-32 rounded bg-slate-700" />
      </div>
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
      <div className="flex flex-col gap-2 border-l-2 border-slate-700 pl-4">
        <div className="h-3 w-40 rounded bg-slate-700" />
        <div className="h-3 w-56 rounded bg-slate-700/70" />
        <div className="h-3 w-48 rounded bg-slate-700/70" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-full rounded bg-slate-700/60" />
        <div className="h-3 w-11/12 rounded bg-slate-700/60" />
        <div className="h-3 w-3/4 rounded bg-slate-700/60" />
      </div>
      <div className="flex gap-3 mt-2">
        <div className="h-9 w-40 rounded-lg bg-slate-700" />
        <div className="h-9 w-28 rounded-lg bg-slate-700/50" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slack message card
// ---------------------------------------------------------------------------
function SlackMessageCard({
  instance,
  message,
  isStreaming,
  onDecommission,
}: {
  instance: InstanceData;
  message: string;
  isStreaming: boolean;
  onDecommission: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderLine = (line: string, idx: number) => {
    const parts = line.split(/(\*[^*]+\*|`[^`]+`)/g);
    return (
      <span key={idx}>
        {parts.map((part, i) => {
          if (part.startsWith('*') && part.endsWith('*'))
            return <strong key={i} className="text-slate-100 font-semibold">{part.slice(1, -1)}</strong>;
          if (part.startsWith('`') && part.endsWith('`'))
            return <code key={i} className="bg-slate-700 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
          return part;
        })}
      </span>
    );
  };

  const lines = message.split('\n');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="text-slate-600">#</span>
        <span>finops-alerts</span>
        <span className="ml-auto text-slate-600 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          Slack Preview
        </span>
      </div>

      <div className="bg-slate-800/80 border border-white/10 rounded-xl overflow-hidden">
        <div className="flex">
          <div className="w-1 bg-indigo-500 shrink-0" />
          <div className="flex flex-col gap-1 p-4 flex-1 min-w-0">
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

            <div className="text-sm text-slate-300 leading-relaxed space-y-2">
              {lines.map((line, idx) => {
                if (line === '') return <div key={idx} className="h-1" />;
                if (line.startsWith('• ')) {
                  return (
                    <div key={idx} className="flex items-start gap-2 pl-2">
                      <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                      <span>{renderLine(line.slice(2), idx)}</span>
                    </div>
                  );
                }
                if (line.match(/^📊|^👋/)) {
                  return <p key={idx} className="font-medium text-slate-200">{renderLine(line, idx)}</p>;
                }
                if (line.startsWith('_') && line.endsWith('_')) {
                  return <p key={idx} className="text-slate-500 text-xs italic mt-1">{line.slice(1, -1)}</p>;
                }
                return (
                  <p key={idx}>
                    {renderLine(line, idx)}
                    {/* blinking cursor after the very last character while streaming */}
                    {isStreaming && idx === lines.length - 1 && (
                      <span className="cursor-blink text-indigo-400" />
                    )}
                  </p>
                );
              })}
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
              <button
                onClick={onDecommission}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-red-900/40"
              >
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

      <button
        onClick={handleCopy}
        disabled={isStreaming}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-slate-800/50 text-sm font-medium transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
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
// Decommission success screen
// ---------------------------------------------------------------------------
function DecommissionSuccess({ instance }: { instance: InstanceData }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <Skull className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold text-white">Zombie Eliminated</h3>
        <p className="text-sm text-slate-400 max-w-xs">
          <span className="font-mono text-slate-300">{instance.instanceId}</span> has been
          scheduled for teardown.
        </p>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-6 py-4 flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Monthly savings recovered</span>
        <span className="text-3xl font-bold text-emerald-400">${instance.monthlyCost.toFixed(2)}</span>
        <span className="text-xs text-slate-500">{instance.daysRunning} days of idle spend stopped</span>
      </div>
      <p className="text-xs text-slate-600 italic">Panel closing automatically…</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
function exportZombieCSV(zombies: InstanceData[]) {
  const headers = ['Instance ID', 'Type', 'Owner', 'Email', 'CPU Avg %', 'Network Bytes', 'Days Running', 'Monthly Cost ($)'];
  const rows = zombies.map(i => [
    i.instanceId, i.instanceType, i.ownerName, i.ownerEmail,
    i.cpuUtilizationAvg.toFixed(1), i.networkInBytes, i.daysRunning, i.monthlyCost.toFixed(2),
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zombie-instances-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const [data, setData] = useState<InstanceData[]>(mockData);
  const [showZombiesOnly, setShowZombiesOnly] = useState(false);

  // Panel state
  const [selectedZombie, setSelectedZombie] = useState<InstanceData | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);

  // Typewriter state
  const [streamedMessage, setStreamedMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Decommission state
  const [isDecommissioned, setIsDecommissioned] = useState(false);

  // Kick off typewriter when full message arrives
  useEffect(() => {
    if (!generatedMessage) return;

    setStreamedMessage('');
    setIsStreaming(true);
    let index = 0;
    const CHARS_PER_TICK = 3;

    streamRef.current = setInterval(() => {
      index += CHARS_PER_TICK;
      setStreamedMessage(generatedMessage.slice(0, index));
      if (index >= generatedMessage.length) {
        setStreamedMessage(generatedMessage);
        setIsStreaming(false);
        if (streamRef.current) clearInterval(streamRef.current);
      }
    }, 16);

    return () => { if (streamRef.current) clearInterval(streamRef.current); };
  }, [generatedMessage]);

  const handleZombieClick = (instance: InstanceData) => {
    if (instance.networkInBytes >= 50000) return;

    // Reset all state
    setSelectedZombie(instance);
    setGeneratedMessage(null);
    setStreamedMessage('');
    setIsStreaming(false);
    setIsDecommissioned(false);
    setIsGenerating(true);
    setIsPanelVisible(true);
    if (streamRef.current) clearInterval(streamRef.current);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsPanelOpen(true));
    });

    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedMessage(buildSlackMessage(instance));
    }, 2000);
  };

  const handleDecommission = () => {
    if (!selectedZombie) return;
    setIsDecommissioned(true);
    setTimeout(() => {
      setData(prev => prev.filter(i => i.instanceId !== selectedZombie.instanceId));
      closePanel();
    }, 2200);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    if (streamRef.current) clearInterval(streamRef.current);
    setTimeout(() => {
      setIsPanelVisible(false);
      setSelectedZombie(null);
      setGeneratedMessage(null);
      setStreamedMessage('');
      setIsDecommissioned(false);
    }, 350);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const loadAppClusterA = () => {
    setData(mockData.filter(i => i.instanceType.startsWith('t') || i.instanceType.startsWith('c')));
  };
  const loadDBTier2 = () => {
    setData(mockData.filter(i => i.instanceType.startsWith('m') || i.instanceType.startsWith('r')));
  };
  const clearData = () => setData([]);

  // --- Dynamic metrics (raw numbers for count-up) ---
  const { zombies, totalCostWaste, totalPowerKW, coolingLoadTons } = useMemo(() => {
    const zombies = data.filter(i => i.networkInBytes < 50000);
    const totalCostWaste = zombies.reduce((acc, curr) => acc + curr.monthlyCost, 0);
    const totalPowerKW = (zombies.length * 120) / 1000;
    const coolingLoadTons = (totalPowerKW * 1.3) / 3.517;
    return { zombies, totalCostWaste, totalPowerKW, coolingLoadTons };
  }, [data]);

  const displayedRows = showZombiesOnly
    ? data.filter(i => i.networkInBytes < 50000)
    : data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30">

      {/* ── Watermark mascot ── */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <img
          src="/mascot.jpeg"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="w-[90vw] max-w-5xl select-none"
          style={{ opacity: 0.075, filter: 'saturate(0.6) brightness(1.4)' }}
        />
      </div>

      {/* Top Navbar */}
      <header className="h-16 border-b border-white/10 bg-slate-900/50 flex items-center px-6 shrink-0 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 shadow-lg shadow-black/40 shrink-0">
            <img src="/mascot.jpeg" alt="FinOps Zombie Hunter mascot" className="w-full h-full object-cover" draggable={false} />
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

          {/* Metric Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-slate-900/40 border border-white/10 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Total Waste / Mo</p>
                  <h3 className="text-3xl font-semibold text-white tracking-tight">
                    <AnimatedNumber value={totalCostWaste} prefix="$" decimals={2} />
                  </h3>
                </div>
                <div className="bg-slate-800 p-2.5 rounded-lg border border-white/5 shadow-inner">
                  <AlertTriangle className="text-red-500 w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 relative z-10">
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${totalCostWaste > 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                  {zombies.length} instances
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900/40 border border-white/10 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Power Waste (Grid)</p>
                  <h3 className="text-3xl font-semibold text-white tracking-tight">
                    <AnimatedNumber value={totalPowerKW} suffix=" kW" decimals={2} />
                  </h3>
                </div>
                <div className="bg-slate-800 p-2.5 rounded-lg border border-white/5 shadow-inner">
                  <Zap className="text-yellow-400 w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 relative z-10">
                <span className="text-xs font-medium px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Idle Draw
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900/40 border border-white/10 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">HVAC Cooling Load</p>
                  <h3 className="text-3xl font-semibold text-white tracking-tight">
                    <AnimatedNumber value={coolingLoadTons} suffix=" Tons" decimals={2} />
                  </h3>
                </div>
                <div className="bg-slate-800 p-2.5 rounded-lg border border-white/5 shadow-inner">
                  <Activity className="text-blue-400 w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 relative z-10">
                <span className="text-xs font-medium px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                  Facility Strain
                </span>
              </div>
            </div>
          </section>

          {/* Data Table */}
          <section className="bg-slate-900/40 border border-white/10 rounded-xl overflow-hidden flex flex-col min-h-0 relative">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  Stranded Resources Deep Dive
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Review potentially orphaned 'zombie' servers.{' '}
                  <span className="text-indigo-400">Click a zombie row</span> to generate an AI decommission request.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Zombies-only toggle */}
                <button
                  onClick={() => setShowZombiesOnly(prev => !prev)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    showZombiesOnly
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-slate-800/60 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  {showZombiesOnly ? 'Zombies Only' : 'All Instances'}
                </button>
                {/* CSV Export */}
                {zombies.length > 0 && (
                  <button
                    onClick={() => exportZombieCSV(zombies)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Export Zombies
                  </button>
                )}
                <div className="text-sm font-medium text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full border border-white/5">
                  {displayedRows.length} Instances
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-medium">Instance ID</th>
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
                  {displayedRows.length > 0 ? (
                    displayedRows.map(instance => {
                      const isZombie = instance.networkInBytes < 50000;
                      const isSelected = selectedZombie?.instanceId === instance.instanceId && isPanelVisible;
                      return (
                        <tr
                          key={instance.instanceId}
                          onClick={() => handleZombieClick(instance)}
                          className={`transition-colors ${isZombie ? 'cursor-pointer zombie-row hover:bg-red-900/20' : 'cursor-default hover:bg-slate-800/20'} ${isSelected ? 'bg-indigo-900/20 ring-1 ring-inset ring-indigo-500/30' : ''}`}
                        >
                          <td className="px-6 py-4 font-mono text-slate-300">
                            <div className="flex items-center gap-2">
                              {isZombie ? (
                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" title="Zombie — click to decommission" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                              )}
                              {instance.instanceId}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-300 border border-white/5">{instance.instanceType}</span>
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
                          <td className="px-6 py-4 text-right font-medium text-emerald-400">${instance.monthlyCost.toFixed(2)}</td>
                          <td className="px-6 py-4 text-center">
                            {isZombie ? (
                              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${isSelected ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}>
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
                        No instance data loaded. Use the sidebar to load clusters.
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
      {/* AI Communication Panel                                              */}
      {/* ------------------------------------------------------------------ */}
      {isPanelVisible && (
        <>
          <div
            onClick={closePanel}
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-350 ${isPanelOpen ? 'opacity-100' : 'opacity-0'}`}
          />
          <aside className={`fixed right-0 top-0 h-full w-full max-w-[520px] bg-slate-900 border-l border-white/10 z-40 flex flex-col shadow-2xl shadow-black/60 transition-transform duration-350 ease-in-out ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>

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
              <button onClick={closePanel} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
              {isDecommissioned && selectedZombie ? (
                <DecommissionSuccess instance={selectedZombie} />
              ) : (
                <>
                  {/* Instance summary */}
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

                  {/* Status */}
                  <div className="flex items-center gap-2 text-xs">
                    {isGenerating ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                        </span>
                        <span className="text-indigo-400 font-medium">Generating AI Decommission Request...</span>
                      </>
                    ) : isStreaming ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                        </span>
                        <span className="text-purple-400 font-medium">Streaming message...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Message ready — review before sending</span>
                      </>
                    )}
                  </div>

                  {isGenerating ? (
                    <LoadingSkeleton />
                  ) : streamedMessage && selectedZombie ? (
                    <SlackMessageCard
                      instance={selectedZombie}
                      message={streamedMessage}
                      isStreaming={isStreaming}
                      onDecommission={handleDecommission}
                    />
                  ) : null}
                </>
              )}
            </div>

            {/* Panel Footer */}
            <div className="border-t border-white/5 px-5 py-4 bg-slate-900/60 shrink-0">
              <p className="text-xs text-slate-600 text-center">
                Simulated preview — "Approve Decommission" removes the instance from the dataset.
              </p>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
