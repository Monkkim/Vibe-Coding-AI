import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertToken } from "@shared/routes";

export function useTokens() {
  return useQuery({
    queryKey: [api.tokens.list.path],
    queryFn: async () => {
      const res = await fetch(api.tokens.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("토큰 목록을 불러오는데 실패했습니다.");
      return api.tokens.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertToken) => {
      const res = await fetch(api.tokens.create.path, {
        method: api.tokens.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("토큰 발행에 실패했습니다.");
      return api.tokens.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.tokens.list.path] }),
  });
}
