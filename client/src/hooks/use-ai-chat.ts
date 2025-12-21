import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

interface ChatResponse {
  insight: string;
  map: string[];
}

export function useCrackTime() {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [actionMap, setActionMap] = useState<string[]>([]);
  const [fogInput, setFogInput] = useState<string>("");

  const sendMessage = async (content: string, userName?: string) => {
    setIsLoading(true);
    setInsight(null);
    setActionMap([]);
    setFogInput(content);
    
    // User message immediately for UI
    setMessages(prev => [...prev, { role: 'user', content }]);

    try {
      const prompt = `
        ${userName ? `${userName} 대표님이` : '사용자가'} "현재의 안개(고민 상황)"를 입력했습니다: "${content}"
        
        당신은 성장 컨설턴트입니다. 크랙 타임의 목표는 사용자의 막연한 고민을 명확한 관점과 구체적인 실행 계획으로 바꿔주는 것입니다.
        
        다음 두 가지를 포함하여 JSON 형식으로만 답변하세요. 마크다운 코드 블록 없이 순수 JSON만 반환하세요.
        1. "insight": 고민을 꿰뚫는 핵심 관점의 빛 (2-3문장으로 작성. 첫 문장은 강렬한 헤드라인 형식으로, 나머지는 부연 설명)
        2. "map": 오늘 당장 실행할 수 있는 구체적인 액션 아이템 3가지 (문자열 배열). 각 항목은 실행 가능하고 구체적이어야 합니다.
      `;

      // Assuming we have a conversation ID 1 for "Crack Time" or create new one
      const convRes = await fetch('/api/conversations', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ title: 'Crack Time Session' }),
         credentials: 'include'
      });
      const conv = await convRes.json();
      
      const response = await fetch(`/api/conversations/${conv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: prompt }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('AI 응답 실패');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              try {
                const data = JSON.parse(jsonStr);
                if (data.content) {
                  fullText += data.content;
                }
              } catch (e) {
                // ignore incomplete chunks
              }
            }
          }
        }
      }

      // Parse the JSON result from AI
      try {
        const parsed = JSON.parse(fullText.trim().replace(/```json/g, '').replace(/```/g, ''));
        setInsight(parsed.insight);
        setActionMap(parsed.map);
      } catch (e) {
        // Fallback if AI didn't return perfect JSON
        setInsight("AI가 인사이트를 도출하는 중 형식이 어긋났습니다.");
        setActionMap(["다시 시도해주세요."]);
      }
      
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading, insight, actionMap, fogInput };
}
