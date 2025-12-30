import { useState } from "react";

interface CrackTimeResponse {
  html: string;
  situation: string;
  crackPoint: string;
  userName: string;
  date: string;
}

export function useCrackTime() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CrackTimeResponse | null>(null);
  const [fogInput, setFogInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (content: string, userName?: string) => {
    setIsLoading(true);
    setResult(null);
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

      setResult(data);
    } catch (err) {
      console.error(err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setFogInput("");
    setError(null);
  };

  return { sendMessage, isLoading, result, fogInput, error, reset };
}
