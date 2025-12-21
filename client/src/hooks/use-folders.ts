import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertFolder, InsertBatchMember } from "@shared/schema";

export function useFolders() {
  return useQuery({
    queryKey: [api.folders.list.path],
    queryFn: async () => {
      const res = await fetch(api.folders.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("폴더 목록을 불러오는데 실패했습니다.");
      return api.folders.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFolder) => {
      const res = await fetch(api.folders.create.path, {
        method: api.folders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("폴더 생성에 실패했습니다.");
      return api.folders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.folders.list.path] }),
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.folders.delete.path, { id }), {
        method: api.folders.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("폴더 삭제에 실패했습니다.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.folders.list.path] }),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("사용자 목록을 불러오는데 실패했습니다.");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useBatchMembers(folderId: number | null) {
  return useQuery({
    queryKey: ['/api/folders', folderId, 'members'],
    queryFn: async () => {
      if (!folderId) return [];
      const res = await fetch(buildUrl(api.batchMembers.list.path, { folderId }), { credentials: "include" });
      if (!res.ok) throw new Error("멤버 목록을 불러오는데 실패했습니다.");
      return api.batchMembers.list.responses[200].parse(await res.json());
    },
    enabled: !!folderId,
  });
}

export function useCreateBatchMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderId, data }: { folderId: number; data: Omit<InsertBatchMember, 'folderId'> }) => {
      const res = await fetch(buildUrl(api.batchMembers.create.path, { folderId }), {
        method: api.batchMembers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("멤버 추가에 실패했습니다.");
      return api.batchMembers.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { folderId }) => queryClient.invalidateQueries({ queryKey: ['/api/folders', folderId, 'members'] }),
  });
}

export function useDeleteBatchMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, folderId }: { id: number; folderId: number }) => {
      const res = await fetch(buildUrl(api.batchMembers.delete.path, { id }), {
        method: api.batchMembers.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("멤버 삭제에 실패했습니다.");
      return { folderId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders', data.folderId, 'members'] });
    },
  });
}

export function useMemberJournals(memberId: number | null) {
  return useQuery({
    queryKey: ['/api/batch-members', memberId, 'journals'],
    queryFn: async () => {
      if (!memberId) return [];
      const res = await fetch(buildUrl(api.memberJournals.list.path, { memberId }), { credentials: "include" });
      if (!res.ok) throw new Error("저널 목록을 불러오는데 실패했습니다.");
      return api.memberJournals.list.responses[200].parse(await res.json());
    },
    enabled: !!memberId,
  });
}
