import { useState, useEffect } from 'react';
import { MagicBox } from './components/MagicBox';
import { NeuCard } from './components/NeuCard';
import { ThemeToggle } from './components/ThemeToggle';
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
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-16 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-4 p-4 rounded-full neu-flat">
            <Activity className="w-10 h-10 text-accent animate-pulse" />
            <h1 className="text-4xl font-extrabold tracking-tight opacity-90 uppercase">
              On-Call Copilot
            </h1>
          </div>
          <p className="opacity-50 text-sm font-bold uppercase tracking-[0.2em]">Active Incident Response Command Center</p>
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
            <NeuCard title="Triage & Remediation" className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold uppercase tracking-widest text-xs">Immediate Actions</span>
              </div>
              <div className="space-y-3">
                {result.immediate_actions?.map((action: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl neu-pressed">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded-full border-slate-300 bg-slate-100 text-emerald-500 focus:ring-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{action.step}</p>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">{action.owner_role} • {action.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </NeuCard>

            {/* Summary Agent Card */}
            <NeuCard title="Incident Summary" className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-blue-500 mb-2">
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-bold uppercase tracking-widest text-xs">Narrative</span>
              </div>
              <div className="p-5 rounded-2xl neu-pressed italic opacity-90 leading-relaxed text-sm">
                "{result.summary?.what_happened}"
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl neu-pressed">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Current Status</span>
                <span className={`px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                  result.summary?.current_status?.includes('ONGOING') ? 'text-red-500' : 'text-emerald-500'
                }`}>
                  {result.summary?.current_status}
                </span>
              </div>
            </NeuCard>

            {/* Comms Agent Card */}
            <NeuCard title="Communications" className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-purple-500 mb-2">
                <MessageSquare className="w-5 h-5" />
                <span className="font-bold uppercase tracking-widest text-xs">Stakeholder Updates</span>
              </div>
              <div className="space-y-4">
                <div className="group relative">
                  <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest ml-2 mb-1 block">Slack Update</label>
                  <pre className="p-5 rounded-2xl neu-pressed text-xs opacity-80 whitespace-pre-wrap font-mono">
                    {result.comms?.slack_update}
                  </pre>
                  <button className="absolute top-8 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-purple-500 text-[10px] font-bold neu-button">COPY</button>
                </div>
              </div>
            </NeuCard>

            {/* PIR Agent Card */}
            <NeuCard title="Post-Incident Report" className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <ClipboardList className="w-5 h-5" />
                <span className="font-bold uppercase tracking-widest text-xs">Draft Timeline</span>
              </div>
              <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[4px] before:bg-slate-300/50 before:rounded-full">
                {result.post_incident_report?.timeline?.map((event: any, i: number) => (
                  <div key={i} className="relative">
                    <div className="absolute left-[-26px] top-1.5 w-4 h-4 rounded-full neu-flat flex items-center justify-center">
                       <div className="w-2 h-2 rounded-full bg-slate-400" />
                    </div>
                    <span className="text-[10px] font-mono opacity-50 block mb-1">{event.time}</span>
                    <p className="text-xs font-medium">{event.event}</p>
                  </div>
                ))}
              </div>
            </NeuCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
