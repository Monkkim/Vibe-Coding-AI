import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertJournal, type Journal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useJournals() {
  return useQuery({
    queryKey: [api.journals.list.path],
    queryFn: async () => {
      const res = await fetch(api.journals.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch journals");
      return api.journals.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertJournal) => {
      const res = await fetch(api.journals.create.path, {
        method: api.journals.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create journal");
      return api.journals.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.journals.list.path] });
      toast({ title: "Journal created", description: "Your thoughts have been captured." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create journal.", variant: "destructive" });
    }
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.journals.delete.path, { id });
      const res = await fetch(url, { 
        method: api.journals.delete.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete journal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.journals.list.path] });
      toast({ title: "Journal deleted", description: "Entry removed successfully." });
    },
  });
}
