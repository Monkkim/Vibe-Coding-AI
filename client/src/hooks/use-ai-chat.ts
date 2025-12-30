import { useState } from "react";

interface CrackTimeResponse {
  insight: string;
  map: string[];
}

export function useCrackTime() {
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [actionMap, setActionMap] = useState<string[]>([]);
  const [fogInput, setFogInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (content: string, userName?: string) => {
    setIsLoading(true);
    setInsight(null);
    setActionMap([]);
    setFogInput(content);
    setError(null);

    try {
      const response = await fetch('/api/crack-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userName }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'AI 응답 실패');
        return;
      }

      setInsight(data.insight);
      setActionMap(data.map || []);
    } catch (err) {
      console.error(err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading, insight, actionMap, fogInput, error };
}
