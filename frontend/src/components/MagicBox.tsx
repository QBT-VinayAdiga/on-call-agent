import { useState } from 'react';
import { M3Card } from './M3Card';
import { Sparkles, Trash2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import type { Provider } from '../hooks/useIncidentAnalysis';
import { EXAMPLES } from '../data/examples';

export const MagicBox = ({ onAnalyze }: { onAnalyze: (text: string, provider: Provider) => void }) => {
  const [text, setText] = useState('');
  const [showAllScenarios, setShowAllScenarios] = useState(false);
  const provider: Provider = 'openrouter';

  const displayedScenarios = showAllScenarios ? EXAMPLES : EXAMPLES.slice(0, 3);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {displayedScenarios.map((scenario) => (
            <button
              key={scenario.label}
              onClick={() => setText(scenario.text)}
              className="flex items-center gap-2 m3-button-tonal text-[10px] font-bold py-2 px-4 hover:bg-secondary-container/80 transition-colors cursor-pointer rounded-full uppercase tracking-wider"
            >
              <span>{scenario.icon}</span>
              {scenario.label}
            </button>
          ))}
          <button
            onClick={() => setShowAllScenarios(!showAllScenarios)}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50 transition-all cursor-pointer"
          >
            {showAllScenarios ? (
              <>
                <ChevronUp className="w-3 h-3" /> Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> {EXAMPLES.length - 3} More
              </>
            )}
          </button>
        </div>
      </div>

      <M3Card className="relative p-2" variant="elevated">
        <div className="rounded-[12px] bg-surface-variant/30 p-1 border border-outline/20">
          <textarea
            className="w-full bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/50 min-h-[220px] resize-none p-4 font-mono text-sm leading-relaxed"
            placeholder="Paste raw logs, alerts, or terminal output here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        
        <div className="absolute top-6 right-6 flex gap-2">
          {text && (
            <button 
              onClick={() => setText('')}
              className="p-2 rounded-full hover:bg-error-container hover:text-on-error-container transition-colors text-on-surface-variant cursor-pointer"
              title="Clear"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-2 gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <p className="text-sm text-on-surface-variant font-medium">
              Ready for AI analysis
            </p>
          </div>
          
          <button 
            onClick={() => onAnalyze(text, provider)}
            disabled={!text.trim()}
            className="w-full sm:w-auto m3-button-filled flex items-center justify-center gap-2 disabled:opacity-30 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Analyze Incident
          </button>
        </div>
      </M3Card>
    </div>
  );
};
