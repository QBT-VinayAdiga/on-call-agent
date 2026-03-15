import { useState } from 'react';

export const useIncidentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (text: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Structure raw data via the new backend endpoint
      const structRes = await fetch('/api/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!structRes.ok) {
        throw new Error('Failed to structure incident data');
      }
      
      const structured = await structRes.json();

      // 2. Invoke Analysis on the structured data
      const analysisRes = await fetch('/api/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(structured)
      });
      
      if (!analysisRes.ok) {
        throw new Error('Failed to analyze structured data');
      }
      
      const final = await analysisRes.json();
      setResult(final);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { analyze, result, loading, error };
};
