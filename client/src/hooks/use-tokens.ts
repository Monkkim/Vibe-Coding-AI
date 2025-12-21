import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertToken } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useTokens() {
  return useQuery({
    queryKey: [api.tokens.list.path],
    queryFn: async () => {
      const res = await fetch(api.tokens.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tokens");
      return api.tokens.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateToken() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertToken) => {
      const res = await fetch(api.tokens.create.path, {
        method: api.tokens.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create token");
      return api.tokens.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tokens.list.path] });
      toast({ title: "Token awarded!", description: "Recognition sent successfully." });
    },
  });
}
