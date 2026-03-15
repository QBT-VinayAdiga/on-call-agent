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
        <header className="mb-16 flex flex-col items-center">
          <div className="flex items-center gap-6 mb-4">
            <div className="p-5 rounded-3xl bg-primary-container text-on-primary-container shadow-elevation-1">
              <Activity className="w-10 h-10 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-on-surface">
              On-Call Copilot
            </h1>
          </div>
          <p className="text-on-surface-variant font-medium text-sm tracking-wide bg-secondary-container/30 px-6 py-2 rounded-full border border-outline/10">
            Active Incident Command Center
          </p>
        </header>

        <section className="mb-16">
          <MagicBox onAnalyze={analyze} />
          {error && (
            <div className="mt-8 p-6 bg-error-container text-on-error-container rounded-2xl border border-error/20 flex items-center gap-4 max-w-2xl mx-auto shadow-elevation-1">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </section>

        {loading && (
          <div className="mt-20 flex flex-col items-center gap-8 py-24 animate-in fade-in duration-500">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-primary font-medium text-lg tracking-wide">Synthesizing Incident Context...</p>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Triage Agent Card */}
            <M3Card title="Immediate Actions" className="bg-surface-variant/20 border border-outline/10">
              <div className="flex items-center gap-2 text-primary mb-6">
                <AlertCircle className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Remediation Steps</span>
              </div>
              <div className="space-y-4">
                {result.immediate_actions?.map((action: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-surface shadow-elevation-1 border border-outline/5 hover:border-outline/20 transition-colors">
                    <div className="mt-1 flex-shrink-0">
                      <input type="checkbox" className="w-5 h-5 rounded-md border-outline bg-surface-variant text-primary focus:ring-primary cursor-pointer" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-relaxed">{action.step}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-4">
                        <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded-md uppercase">
                          {action.owner_role}
                        </span>
                        <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase ${
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
              <div className="flex items-center gap-2 text-primary mb-6">
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Executive Summary</span>
              </div>
              <div className="p-6 rounded-2xl bg-surface shadow-elevation-1 italic opacity-95 leading-relaxed text-sm border border-outline/5">
                "{result.summary?.what_happened}"
              </div>
              <div className={`mt-8 p-6 rounded-2xl border-l-4 shadow-sm ${
                result.summary?.current_status?.includes('ONGOING') 
                  ? 'bg-error-container/20 border-error text-on-error-container' 
                  : 'bg-primary-container/20 border-primary text-on-primary-container'
              }`}>
                <div className="flex items-center gap-2 mb-2 opacity-70">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Official Status</span>
                </div>
                <p className="text-sm font-bold leading-relaxed tracking-wide uppercase">
                  {result.summary?.current_status}
                </p>
              </div>
            </M3Card>

            {/* Comms Agent Card */}
            <M3Card title="Communications" className="bg-surface-variant/20 border border-outline/10">
              <div className="flex items-center gap-2 text-tertiary mb-6">
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Stakeholder Updates</span>
              </div>
              <div className="space-y-8">
                <div className="group relative">
                  <div className="flex items-center justify-between ml-1 mb-3">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] opacity-70">Slack Update Template</label>
                    <button 
                      onClick={() => copyToClipboard(result.comms?.slack_update || '')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container text-[10px] font-bold uppercase tracking-wider shadow-sm hover:shadow-elevation-1 transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy Template'}
                    </button>
                  </div>
                  <div className="relative">
                    <pre className="p-6 rounded-2xl bg-surface/50 shadow-inner text-sm leading-relaxed opacity-95 whitespace-pre-wrap border border-outline/10 overflow-x-auto text-on-surface">
                      {result.comms?.slack_update}
                    </pre>
                  </div>
                </div>
              </div>
            </M3Card>

            {/* PIR Agent Card */}
            <M3Card title="Post-Incident Report" className="bg-surface-variant/20 border border-outline/10">
              <div className="flex items-center gap-2 text-secondary mb-6">
                <ClipboardList className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Timeline Draft</span>
              </div>
              <div className="relative pl-9 space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-primary/10 before:rounded-full">
                {result.post_incident_report?.timeline?.map((event: any, i: number) => (
                  <div key={i} className="relative group">
                    <div className="absolute left-[-32px] top-1.5 w-4 h-4 rounded-full bg-surface border-4 border-primary shadow-elevation-1 transition-transform group-hover:scale-110" />
                    <div className="bg-surface/40 p-4 rounded-xl border border-outline/5 hover:border-outline/20 transition-all hover:shadow-elevation-1">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">{event.time}</span>
                      <p className="text-sm font-medium text-on-surface leading-relaxed">{event.event}</p>
                    </div>
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
