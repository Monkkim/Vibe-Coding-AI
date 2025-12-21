import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertFolder } from "@shared/schema";

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
