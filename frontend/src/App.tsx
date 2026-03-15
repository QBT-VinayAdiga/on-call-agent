import { useState, useEffect } from 'react';
import { MagicBox } from './components/MagicBox';
import { GlassCard } from './components/GlassCard';
import { useIncidentAnalysis } from './hooks/useIncidentAnalysis';
import { Activity, LayoutDashboard, MessageSquare, ClipboardList, AlertCircle } from 'lucide-react';

function App() {
  const { analyze, result, loading, error } = useIncidentAnalysis();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  );

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <div className="min-h-screen p-8 relative overflow-hidden transition-colors duration-300">
      {/* Background Auroras */}
      <div className="aurora top-[-10%] left-[-10%] bg-blue-600/30" />
      <div className="aurora bottom-[-10%] right-[-10%] bg-purple-600/30" />
      <div className="aurora top-[20%] right-[10%] bg-emerald-600/20" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-12 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-10 h-10 text-blue-400 animate-pulse" />
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400">
              On-Call Copilot
            </h1>
          </div>
          <p className="text-slate-400 text-lg">Active Incident Response Command Center</p>
        </header>

        <section className="mb-12">
          <MagicBox onAnalyze={analyze} />
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-center max-w-4xl mx-auto">
              {error}
            </div>
          )}
        </section>

        {loading && (
          <div className="mt-12 flex flex-col items-center gap-4 py-20">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-blue-400 font-medium animate-pulse">Analyzing Incident Ecosystem...</p>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Triage Agent Card */}
            <GlassCard title="Triage & Remediation" className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold">Immediate Actions</span>
              </div>
              <div className="space-y-3">
                {result.immediate_actions?.map((action: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{action.step}</p>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-500/60 font-bold">{action.owner_role} • {action.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Summary Agent Card */}
            <GlassCard title="Incident Summary" className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-bold">Narrative</span>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 italic text-slate-300 leading-relaxed">
                "{result.summary?.what_happened}"
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5">
                <span className="text-sm text-slate-400">Current Status</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                  result.summary?.current_status?.includes('ONGOING') ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {result.summary?.current_status}
                </span>
              </div>
            </GlassCard>

            {/* Comms Agent Card */}
            <GlassCard title="Communications" className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <MessageSquare className="w-5 h-5" />
                <span className="font-bold">Stakeholder Updates</span>
              </div>
              <div className="space-y-4">
                <div className="group relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2 mb-1 block">Slack Update</label>
                  <pre className="p-4 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-slate-400 whitespace-pre-wrap font-mono">
                    {result.comms?.slack_update}
                  </pre>
                  <button className="absolute top-8 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-purple-500/20 hover:bg-purple-500/40 p-2 rounded-lg text-purple-400 text-[10px] font-bold">COPY</button>
                </div>
              </div>
            </GlassCard>

            {/* PIR Agent Card */}
            <GlassCard title="Post-Incident Report" className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <ClipboardList className="w-5 h-5" />
                <span className="font-bold">Draft Timeline</span>
              </div>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                {result.post_incident_report?.timeline?.map((event: any, i: number) => (
                  <div key={i} className="relative">
                    <div className="absolute left-[-22px] top-1 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-950" />
                    <span className="text-[10px] font-mono text-slate-500">{event.time}</span>
                    <p className="text-xs text-slate-300">{event.event}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
