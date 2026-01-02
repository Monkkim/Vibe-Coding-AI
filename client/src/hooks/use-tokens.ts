import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertToken, Token } from "@shared/schema";

export function useTokens(batchId?: number) {
  return useQuery<Token[]>({
    queryKey: ['/api/tokens', batchId],
    queryFn: async () => {
      const url = batchId ? `${api.tokens.list.path}?batchId=${batchId}` : api.tokens.list.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("토큰 목록을 불러오는데 실패했습니다.");
      return res.json();
    },
  });
}

export function useCreateToken(batchId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InsertToken, 'fromUserId'> & { fromUserId?: string }) => {
      const res = await fetch(api.tokens.create.path, {
        method: api.tokens.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, batchId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("토큰 발행에 실패했습니다.");
      return res.json() as Promise<Token>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/tokens', batchId] }),
  });
}

export function useAcceptToken(batchId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.tokens.accept.path, { id }), {
        method: api.tokens.accept.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("토큰 수령에 실패했습니다.");
      return res.json() as Promise<Token>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/tokens', batchId] }),
  });
}
