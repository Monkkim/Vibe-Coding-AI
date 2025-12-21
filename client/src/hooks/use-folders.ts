import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertFolder } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useFolders() {
  return useQuery({
    queryKey: [api.folders.list.path],
    queryFn: async () => {
      const res = await fetch(api.folders.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch folders");
      return api.folders.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertFolder) => {
      const res = await fetch(api.folders.create.path, {
        method: api.folders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create folder");
      return api.folders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.folders.list.path] });
      toast({ title: "Folder created", description: "Organized successfully." });
    },
  });
}
