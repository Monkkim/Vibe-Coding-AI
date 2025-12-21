import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJournalSchema, type InsertJournal } from "@shared/schema";
import { useCreateJournal } from "@/hooks/use-journals";
import { useAuth } from "@/hooks/use-auth";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, PenLine } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function CreateJournalDrawer({ defaultCategory }: { defaultCategory?: string }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const createJournal = useCreateJournal();

  const form = useForm<InsertJournal>({
    resolver: zodResolver(insertJournalSchema),
    defaultValues: {
      title: "",
      content: "",
      category: defaultCategory || "retrospective",
      userId: user?.id || "",
    },
  });

  const onSubmit = (data: InsertJournal) => {
    createJournal.mutate({ ...data, userId: user!.id }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({ title: "저널 저장 완료", description: "성공적으로 기록되었습니다." });
      },
      onError: (err) => {
        toast({ title: "저장 실패", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white gap-2 font-medium px-6">
          <PenLine className="w-4 h-4" /> 기록하기
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-w-3xl mx-auto glass-card border-t-white/50">
        <DrawerHeader>
          <DrawerTitle className="text-2xl font-bold font-display">오늘의 기록</DrawerTitle>
          <DrawerDescription>
            성장의 순간을 기록하세요. 작은 깨달음이 큰 변화를 만듭니다.
          </DrawerDescription>
        </DrawerHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select 
                defaultValue={form.getValues("category")} 
                onValueChange={(val) => form.setValue("category", val)}
              >
                <SelectTrigger className="rounded-xl border-white/20 bg-white/50 dark:bg-black/20">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">기술 (Tech)</SelectItem>
                  <SelectItem value="business">비즈니스 (Business)</SelectItem>
                  <SelectItem value="retrospective">회고 (Retrospective)</SelectItem>
                  <SelectItem value="etc">기타 (Etc)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input 
                id="title" 
                placeholder="오늘의 핵심 키워드는?" 
                className="rounded-xl border-white/20 bg-white/50 dark:bg-black/20"
                {...form.register("title")} 
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용</Label>
            <Textarea 
              id="content" 
              placeholder="어떤 고민과 배움이 있었나요?" 
              className="min-h-[200px] rounded-xl border-white/20 bg-white/50 dark:bg-black/20 resize-none p-4"
              {...form.register("content")} 
            />
             {form.formState.errors.content && (
                <p className="text-xs text-destructive">{form.formState.errors.content.message}</p>
              )}
          </div>

          <DrawerFooter className="flex-row gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={createJournal.isPending}
              className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold h-12 text-lg shadow-lg shadow-primary/25"
            >
              {createJournal.isPending ? "저장 중..." : "기록 완료"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 rounded-xl h-12">취소</Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
