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
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-wrap gap-4 justify-center">
          {displayedScenarios.map((scenario) => (
            <button
              key={scenario.label}
              onClick={() => setText(scenario.text)}
              className="flex items-center gap-3 m3-button-tonal text-xs font-bold py-2.5 px-5 hover:bg-secondary-container/80 transition-colors cursor-pointer rounded-full uppercase tracking-wider shadow-elevation-1 hover:shadow-elevation-2"
            >
              <span>{scenario.icon}</span>
              {scenario.label}
            </button>
          ))}
          <button
            onClick={() => setShowAllScenarios(!showAllScenarios)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50 transition-all cursor-pointer border border-outline/10"
          >
            {showAllScenarios ? (
              <>
                <ChevronUp className="w-4 h-4" /> Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> {EXAMPLES.length - 3} More
              </>
            )}
          </button>
        </div>
      </div>

      <M3Card className="relative p-3" variant="elevated">
        <div className="rounded-[16px] bg-surface-variant/20 p-2 border border-outline/10">
          <textarea
            className="w-full bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/40 min-h-[260px] resize-none p-6 text-sm leading-relaxed"
            placeholder="Paste raw logs, alerts, or terminal output here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        
        <div className="absolute top-8 right-8 flex gap-3">
          {text && (
            <button 
              onClick={() => setText('')}
              className="p-3 rounded-full hover:bg-error-container hover:text-on-error-container transition-colors text-on-surface-variant cursor-pointer shadow-elevation-1 hover:shadow-elevation-2"
              title="Clear"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 p-4 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary-container/30 text-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-on-surface font-bold">Ready for AI analysis</p>
              <p className="text-xs text-on-surface-variant font-medium">Select a scenario or paste your own data</p>
            </div>
          </div>
          
          <button 
            onClick={() => onAnalyze(text, provider)}
            disabled={!text.trim()}
            className="w-full sm:w-auto m3-button-filled flex items-center justify-center gap-3 disabled:opacity-30 cursor-pointer py-4 px-8 shadow-elevation-2 hover:shadow-elevation-3"
          >
            <Send className="w-5 h-5" />
            <span className="text-base font-bold uppercase tracking-wide">Analyze Incident</span>
          </button>
        </div>
      </M3Card>
    </div>
  );
};
