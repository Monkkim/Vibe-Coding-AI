import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertJournal } from "@shared/schema";

export function useJournals() {
  return useQuery({
    queryKey: [api.journals.list.path],
    queryFn: async () => {
      const res = await fetch(api.journals.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("저널 목록을 불러오는데 실패했습니다.");
      return api.journals.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertJournal & { memberId?: number }) => {
      const res = await fetch(api.journals.create.path, {
        method: api.journals.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("저널 생성에 실패했습니다.");
      return api.journals.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.journals.list.path] });
      if (variables.memberId) {
        queryClient.invalidateQueries({ queryKey: ['/api/batch-members', variables.memberId, 'journals'] });
      }
    },
  });
}

export function useUpdateJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertJournal>) => {
      const url = buildUrl(api.journals.update.path, { id });
      const res = await fetch(url, {
        method: api.journals.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("저널 수정에 실패했습니다.");
      return api.journals.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.journals.list.path] }),
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.journals.delete.path, { id });
      const res = await fetch(url, {
        method: api.journals.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("저널 삭제에 실패했습니다.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.journals.list.path] }),
  });
}
