import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Specialized hook for the AI "Crack Time" feature
// Handles creating a conversation, sending a message, and parsing the streaming response
export function useCrackTime() {
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState("");
  const [actionItems, setActionItems] = useState<string[]>([]);
  const { toast } = useToast();

  const crackProblem = async (problem: string) => {
    setIsLoading(true);
    setInsight("");
    setActionItems([]);

    try {
      // 1. Create a conversation
      const convRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Crack Time: ${problem.substring(0, 20)}...` }),
        credentials: "include",
      });
      if (!convRes.ok) throw new Error("Failed to start session");
      const conversation = await convRes.json();

      // 2. Send the message and handle SSE stream
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: `You are a growth consultant. Analyze this problem: "${problem}". 
          Provide ONE single bold sentence of deep insight. 
          Then provide exactly THREE actionable steps formatted as bullet points starting with "- ".
          Do not include any other text.` 
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to get analysis");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                fullText += data.content;
                // Simple parsing logic to separate insight from actions as they stream
                // In a real app, you might want more robust parsing
                const parts = fullText.split("- ");
                if (parts.length > 0) setInsight(parts[0].trim());
                if (parts.length > 1) setActionItems(parts.slice(1).map(s => s.trim()));
              }
            } catch (e) {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast({ 
        title: "Connection Error", 
        description: "Could not consult the oracle. Try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { crackProblem, isLoading, insight, actionItems };
}
