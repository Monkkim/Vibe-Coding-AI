import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlassButton } from "@/components/ui/glass-button";
import { useJournals, useCreateJournal } from "@/hooks/use-journals";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJournalSchema, type InsertJournal } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, PenLine } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export function JournalDrawer() {
  const { data: journals } = useJournals();
  const { mutate: createJournal, isPending } = useCreateJournal();
  const { user } = useAuth();

  const form = useForm<InsertJournal>({
    resolver: zodResolver(insertJournalSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "general",
      userId: user?.id || "",
    },
  });

  const onSubmit = (data: InsertJournal) => {
    createJournal({ ...data, userId: user?.id || "" }, {
      onSuccess: () => form.reset()
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <GlassButton variant="outline" size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-primary hover:bg-primary/90 text-white border-none">
          <PenLine className="h-6 w-6" />
        </GlassButton>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white/95 dark:bg-black/95 backdrop-blur-xl border-l border-border/50">
        <SheetHeader className="mb-8">
          <SheetTitle className="font-display text-3xl">Journal</SheetTitle>
          <SheetDescription>Capture your thoughts, ideas, and reflections.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full gap-8">
          <div className="bg-secondary/50 p-6 rounded-2xl border border-white/20">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Title of your entry..." className="bg-white/50 border-transparent focus:bg-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="What's on your mind?" 
                          className="resize-none min-h-[100px] bg-white/50 border-transparent focus:bg-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <GlassButton type="submit" disabled={isPending} size="sm">
                    {isPending ? "Saving..." : <><Plus className="w-4 h-4 mr-2" /> Add Entry</>}
                  </GlassButton>
                </div>
              </form>
            </Form>
          </div>

          <ScrollArea className="flex-1 -mr-6 pr-6">
            <div className="space-y-4 pb-20">
              {journals?.map((journal) => (
                <div key={journal.id} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{journal.title}</h3>
                    <span className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-1 rounded-full">
                      {format(new Date(journal.createdAt), "MMM d")}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{journal.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
