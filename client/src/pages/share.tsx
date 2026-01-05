import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Gem, BookOpen, Loader2, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { SharedContent } from "@shared/schema";

export function ShareView() {
  const params = useParams<{ id: string }>();
  const shareId = params.id;

  const { data: shared, isLoading, error } = useQuery<SharedContent>({
    queryKey: ["/api/share", shareId],
    enabled: !!shareId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !shared) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">콘텐츠를 찾을 수 없습니다</h1>
          <p className="text-muted-foreground">
            공유된 콘텐츠가 존재하지 않거나 삭제되었습니다.
          </p>
        </div>
      </div>
    );
  }

  if (shared.type === "cracktime") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary font-display font-bold text-lg">
              <Gem className="w-5 h-5" />
              AGround
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Shared by {shared.authorName}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto p-4 md:p-8">
          <iframe
            srcDoc={shared.content}
            className="w-full h-[800px] rounded-2xl shadow-lg border border-border bg-white"
            title={shared.title}
            data-testid="iframe-shared-content"
          />
        </main>
      </div>
    );
  }

  if (shared.type === "journal") {
    let journalData;
    try {
      journalData = JSON.parse(shared.content);
    } catch {
      journalData = { content: shared.content };
    }

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary font-display font-bold text-lg">
              <Gem className="w-5 h-5" />
              AGround
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Shared by {shared.authorName}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto p-4 md:p-8">
          <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-amber-400 dark:bg-amber-600 px-6 py-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-xl tracking-wide">MORNING JOURNAL</span>
              </div>
              <span className="text-white/90 text-sm font-medium">{journalData.date}</span>
            </div>

            <div className="p-6 space-y-6">
              <div className="border-l-4 border-amber-500 pl-4">
                <h2 className="text-2xl font-bold text-foreground">{journalData.memberName}</h2>
                {journalData.category && (
                  <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                    #{journalData.category}
                  </span>
                )}
              </div>

              <div className="bg-white/80 dark:bg-black/30 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-foreground mb-4">{journalData.title}</h3>
                <div 
                  className="text-foreground/80 leading-relaxed text-lg journal-content"
                  dangerouslySetInnerHTML={{ __html: journalData.content }}
                />
                <style>{`
                  .journal-content p { margin: 0 0 0.5em 0; min-height: 1.5em; }
                  .journal-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
                  .journal-content br { line-height: 1.7; }
                `}</style>
              </div>

              <div className="text-center pt-4">
                <p className="text-xs text-muted-foreground tracking-widest">
                  MORNING SUNLIGHT · BREAKING LIMITS · AGROUND
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">알 수 없는 콘텐츠 타입</h1>
      </div>
    </div>
  );
}
