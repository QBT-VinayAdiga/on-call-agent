import { useState } from 'react';
import { NeuCard } from './NeuCard';
import { Sparkles, Trash2, Cpu, Zap } from 'lucide-react';
import type { Provider } from '../hooks/useIncidentAnalysis';

const DEMO_SCENARIOS = [
  {
    label: 'Checkout Latency',
    icon: '🛒',
    text: `ALERTS:
- CheckoutLatencyHigh: 4500ms (threshold: 1000ms) fired at 2026-03-15T14:03:00Z
- CheckoutErrorRateHigh: 15.4% (threshold: 5%) fired at 2026-03-15T14:05:00Z

LOGS:
[2026-03-15T14:04:00Z] ERROR checkout-api: upstream service timeout connecting to inventory-db-01
[2026-03-15T14:04:05Z] WARN checkout-api: retrying connection to inventory-db-01 (attempt 3/3)
[2026-03-15T14:04:10Z] ERROR checkout-api: circuit breaker opened for inventory-service

METRICS:
- inventory_db_connection_pool_usage: 100%
- inventory_db_cpu_utilization: 92%`
  },
  {
    label: 'Database Timeout',
    icon: '🗄️',
    text: `CRITICAL ALERT: DBConnectionTimeout on production-cluster-01
Fired: 2 mins ago
Service: user-profile-service
Region: us-east-1

STACK TRACE:
Internal Server Error: Failed to acquire connection from pool 'default' after 30000ms.
  at com.zaxxer.hikari.pool.PoolBase.getConnection(PoolBase.java:162)
  at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:145)

RECENT CHANGES:
- Deployment 'v1.4.2-hotfix-3' pushed to user-profile-service (10 mins ago)
- Migration '20260315_add_index_to_profiles' started (15 mins ago)`
  },
  {
    label: 'API 500 Spike',
    icon: '🌐',
    text: `High 5xx Error Rate on Load Balancer 'prod-ext-lb'
Current: 25.5 req/s
Target: < 0.5 req/s

UPSTREAM LOGS (gateway-api):
[ERROR] 502 Bad Gateway - POST /v1/auth/login
[ERROR] 502 Bad Gateway - GET /v1/user/settings
[WARN] upstream 'auth-service' unreachable, timing out after 5s

K8S EVENTS:
- auth-service-67fbd-92x1: CrashLoopBackOff (12 restarts in 5m)
- auth-service-67fbd-92x1: Liveness probe failed: HTTP probe failed with statuscode: 500`
  }
];

export const MagicBox = ({ onAnalyze }: { onAnalyze: (text: string, provider: Provider) => void }) => {
  const [text, setText] = useState('');
  const [provider, setProvider] = useState<Provider>('gemini');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap gap-4 justify-center">
        {DEMO_SCENARIOS.map((scenario) => (
          <button
            key={scenario.label}
            onClick={() => setText(scenario.text)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest neu-button hover:text-blue-500 transition-all"
          >
            <span>{scenario.icon}</span>
            {scenario.label}
          </button>
        ))}
      </div>

      <NeuCard className="relative group overflow-visible" variant="flat">
        <div className="rounded-[24px] neu-pressed p-2">
          <textarea
            className="w-full bg-transparent border-none outline-none text-inherit placeholder:opacity-30 min-h-[220px] resize-none p-4 font-mono text-sm leading-relaxed"
            placeholder="Paste raw logs, alerts, or terminal output here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        
        <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setText('')}
            className="p-2 rounded-xl neu-button text-slate-400 hover:text-red-500 transition-colors"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-4 gap-4">
          <div className="flex items-center gap-6">
            <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-blue-500" />
              AI-Powered Analysis
            </p>
            
            <div className="flex p-1 rounded-2xl neu-pressed">
              <button
                onClick={() => setProvider('gemini')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  provider === 'gemini' 
                    ? 'neu-button text-blue-500' 
                    : 'opacity-40 hover:opacity-100'
                }`}
              >
                <Cpu className="w-3 h-3" />
                Gemini
              </button>
              <button
                onClick={() => setProvider('openrouter')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  provider === 'openrouter' 
                    ? 'neu-button text-purple-500' 
                    : 'opacity-40 hover:opacity-100'
                }`}
              >
                <Zap className="w-3 h-3" />
                OpenRouter
              </button>
            </div>
          </div>
          
          <button 
            onClick={() => onAnalyze(text, provider)}
            disabled={!text.trim()}
            className="w-full sm:w-auto px-10 py-3 rounded-2xl neu-button text-blue-600 disabled:opacity-30 font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
          >
            Analyze Incident
          </button>
        </div>
      </NeuCard>
    </div>
  );
};
