import { useState, useEffect } from 'react';
import { MagicBox } from './components/MagicBox';
import { M3Card } from './components/M3Card';
import { ThemeToggle } from './components/ThemeToggle';
import { useIncidentAnalysis } from './hooks/useIncidentAnalysis';
import { Activity, LayoutDashboard, MessageSquare, ClipboardList, AlertCircle, Copy, Check } from 'lucide-react';

function App() {
  const { analyze, result, loading, error } = useIncidentAnalysis();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen p-6 md:p-12 bg-surface text-on-surface transition-colors duration-200">
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-4 rounded-3xl bg-primary-container text-on-primary-container shadow-elevation-1">
              <Activity className="w-10 h-10 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-on-surface">
              On-Call Copilot
            </h1>
          </div>
          <p className="text-on-surface-variant font-medium text-sm tracking-wide bg-secondary-container/30 px-4 py-1 rounded-full border border-outline/10">
            Active Incident Command Center
          </p>
        </header>

        <section className="mb-12">
          <MagicBox onAnalyze={analyze} />
          {error && (
            <div className="mt-6 p-4 bg-error-container text-on-error-container rounded-2xl border border-error/20 flex items-center gap-3 max-w-2xl mx-auto shadow-elevation-1">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </section>

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-6 py-20 animate-in fade-in duration-500">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-primary font-medium text-lg tracking-wide">Synthesizing Incident Context...</p>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Triage Agent Card */}
            <M3Card title="Immediate Actions" className="bg-surface-variant/20 border border-outline/10">
              <div className="flex items-center gap-2 text-primary mb-4">
                <AlertCircle className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Remediation Steps</span>
              </div>
              <div className="space-y-3">
                {result.immediate_actions?.map((action: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-surface shadow-elevation-1 border border-outline/5 hover:border-outline/20 transition-colors">
                    <div className="mt-1 flex-shrink-0">
                      <input type="checkbox" className="w-5 h-5 rounded-md border-outline bg-surface-variant text-primary focus:ring-primary cursor-pointer" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-relaxed">{action.step}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-md uppercase">
                          {action.owner_role}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          action.priority === 'HIGH' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'
                        }`}>
                          {action.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </M3Card>

            {/* Summary Agent Card */}
            <M3Card title="Incident Narrative" className="bg-surface-variant/20 border border-outline/10">
              <div className="flex items-center gap-2 text-primary mb-4">
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Executive Summary</span>
              </div>
              <div className="p-5 rounded-2xl bg-surface shadow-elevation-1 italic opacity-95 leading-relaxed text-sm border border-outline/5">
                "{result.summary?.what_happened}"
              </div>
              <div className="flex items-center justify-between mt-4 p-4 rounded-2xl bg-secondary-container/20 border border-outline/5">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Status</span>
                <span className={`px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                  result.summary?.current_status?.includes('ONGOING') ? 'bg-error text-on-error' : 'bg-primary text-on-primary'
                } shadow-elevation-1`}>
                  {result.summary?.current_status}
                </span>
              </div>
            </M3Card>

            {/* Comms Agent Card */}
            <M3Card title="Communications" className="bg-surface-variant/20 border border-outline/10">
              <div className="flex items-center gap-2 text-tertiary mb-4">
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Stakeholder Updates</span>
              </div>
              <div className="space-y-4">
                <div className="group relative">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-1 block">Slack Update Template</label>
                  <div className="relative">
                    <pre className="p-5 rounded-2xl bg-surface shadow-elevation-1 text-xs opacity-90 whitespace-pre-wrap font-mono border border-outline/5 overflow-x-auto">
                      {result.comms?.slack_update}
                    </pre>
                    <button 
                      onClick={() => copyToClipboard(result.comms?.slack_update || '')}
                      className="absolute top-4 right-4 p-2 rounded-xl bg-primary-container text-on-primary-container shadow-elevation-1 hover:shadow-elevation-2 transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </M3Card>

            {/* PIR Agent Card */}
            <M3Card title="Post-Incident Report" className="bg-surface-variant/20 border border-outline/10">
              <div className="flex items-center gap-2 text-secondary mb-4">
                <ClipboardList className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Timeline Draft</span>
              </div>
              <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-outline/20 before:rounded-full">
                {result.post_incident_report?.timeline?.map((event: any, i: number) => (
                  <div key={i} className="relative">
                    <div className="absolute left-[-26px] top-1.5 w-4 h-4 rounded-full bg-surface border-2 border-primary shadow-elevation-1" />
                    <span className="text-[10px] font-bold text-primary block mb-1">{event.time}</span>
                    <p className="text-xs font-medium text-on-surface opacity-90 leading-normal">{event.event}</p>
                  </div>
                ))}
              </div>
            </M3Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
