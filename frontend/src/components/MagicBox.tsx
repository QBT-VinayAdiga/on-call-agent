import { useState } from 'react';
import { GlassCard } from './GlassCard';

export const MagicBox = ({ onAnalyze }: { onAnalyze: (text: string) => void }) => {
  const [text, setText] = useState('');

  return (
    <GlassCard className="w-full max-w-4xl mx-auto">
      <textarea
        className="w-full bg-transparent border-none outline-none text-white placeholder-white/40 min-h-[150px] resize-none p-4 font-mono text-sm leading-relaxed"
        placeholder="Paste raw logs, alerts, or terminal output here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-end mt-4 p-2">
        <button 
          onClick={() => onAnalyze(text)}
          className="px-8 py-2.5 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded-xl transition-all cursor-pointer font-medium text-blue-400"
        >
          Analyze Incident
        </button>
      </div>
    </GlassCard>
  );
};
