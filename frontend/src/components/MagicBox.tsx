import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Sparkles, Trash2 } from 'lucide-react';

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

export const MagicBox = ({ onAnalyze }: { onAnalyze: (text: string) => void }) => {
  const [text, setText] = useState('');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap gap-3 justify-center">
        {DEMO_SCENARIOS.map((scenario) => (
          <button
            key={scenario.label}
            onClick={() => setText(scenario.text)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 hover:bg-slate-800 border border-white/10 rounded-full text-xs font-medium text-slate-300 transition-all hover:border-blue-500/50 hover:text-blue-400"
          >
            <span>{scenario.icon}</span>
            {scenario.label}
          </button>
        ))}
      </div>

      <GlassCard className="relative group">
        <textarea
          className="w-full bg-transparent border-none outline-none text-white placeholder-white/20 min-h-[200px] resize-none p-6 font-mono text-sm leading-relaxed"
          placeholder="Paste raw logs, alerts, or terminal output here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setText('')}
            className="p-2 bg-slate-900/80 hover:bg-red-500/20 border border-white/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-between items-center mt-2 p-4 border-t border-white/5 bg-white/5">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-blue-500" />
            AI-Powered Analysis
          </p>
          <button 
            onClick={() => onAnalyze(text)}
            disabled={!text.trim()}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-all cursor-pointer font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Analyze Incident
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
