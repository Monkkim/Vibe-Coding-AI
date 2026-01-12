import { useState } from "react";
import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Key, Eye, EyeOff, Save, Trash2, Settings as SettingsIcon, Users, MoreVertical, LogOut, Wand2, RotateCcw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UserBatch = {
  batchId: number;
  batchName: string;
  memberId: number;
  memberName: string;
  joinedAt: string | null;
};

export function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [leaveBatchDialogOpen, setLeaveBatchDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<UserBatch | null>(null);
  
  const [youtubePrompt, setYoutubePrompt] = useState("");
  const [threadsPrompt, setThreadsPrompt] = useState("");
  const [reelsPrompt, setReelsPrompt] = useState("");
  const [promptsLoaded, setPromptsLoaded] = useState(false);

  const { data: settings, isLoading } = useQuery<{ hasGeminiApiKey: boolean }>({
    queryKey: ["/api/settings"],
  });

  const { data: userBatches, isLoading: batchesLoading } = useQuery<UserBatch[]>({
    queryKey: ["/api/user/batches"],
  });

  const { data: promptTemplates, isLoading: promptsLoading } = useQuery<{
    youtubePrompt: string;
    threadsPrompt: string;
    reelsPrompt: string;
  }>({
    queryKey: ["/api/ai/prompts"],
  });

  const updatePrompts = useMutation({
    mutationFn: async (prompts: { youtubePrompt: string; threadsPrompt: string; reelsPrompt: string }) => {
      return apiRequest("PUT", "/api/ai/prompts", prompts);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/prompts"] });
      toast({ title: "프롬프트가 저장되었습니다" });
    },
    onError: () => {
      toast({ title: "저장 실패", variant: "destructive" });
    },
  });

  const defaultPrompts = {
    youtube: "당신은 유튜브 콘텐츠 전문가입니다. 다음 내용을 기반으로 시청자의 관심을 끄는 유튜브 대본을 작성해주세요. 인트로, 본론, 결론 구조로 작성하고, 시청자 참여를 유도하는 멘트를 포함해주세요.",
    threads: "당신은 SNS 콘텐츠 전문가입니다. 다음 내용을 기반으로 쓰레드에 올릴 짧고 임팩트 있는 글을 작성해주세요. 500자 이내로, 핵심 메시지가 잘 전달되도록 작성해주세요.",
    reels: "당신은 인스타그램 릴스 전문가입니다. 다음 내용을 기반으로 15-60초 분량의 릴스 대본을 작성해주세요. 짧고 강렬한 훅, 핵심 내용, 행동 유도 문구를 포함해주세요.",
  };

  React.useEffect(() => {
    if (promptTemplates && !promptsLoaded) {
      setYoutubePrompt(promptTemplates.youtubePrompt || defaultPrompts.youtube);
      setThreadsPrompt(promptTemplates.threadsPrompt || defaultPrompts.threads);
      setReelsPrompt(promptTemplates.reelsPrompt || defaultPrompts.reels);
      setPromptsLoaded(true);
    }
  }, [promptTemplates, promptsLoaded]);

  const leaveBatch = useMutation({
    mutationFn: async (batchId: number) => {
      return apiRequest("DELETE", `/api/batches/${batchId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/batches"] });
      toast({ title: "기수를 탈퇴했습니다" });
      setLeaveBatchDialogOpen(false);
      setSelectedBatch(null);
    },
    onError: () => {
      toast({ title: "탈퇴 실패", variant: "destructive" });
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (geminiApiKey: string) => {
      return apiRequest("PUT", "/api/settings", { geminiApiKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "API 키가 저장되었습니다" });
      setApiKey("");
    },
    onError: () => {
      toast({ title: "저장 실패", variant: "destructive" });
    },
  });

  const deleteApiKey = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/settings", { geminiApiKey: "" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "API 키가 삭제되었습니다" });
    },
    onError: () => {
      toast({ title: "삭제 실패", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({ title: "API 키를 입력하세요", variant: "destructive" });
      return;
    }
    updateSettings.mutate(apiKey);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard" data-testid="button-back-dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-amber-500" />
              설정
            </h1>
            <p className="text-muted-foreground text-sm">API 키와 계정 설정을 관리합니다</p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              Gemini API 키
            </h2>
            <p className="text-sm text-muted-foreground">
              Crack Time 기능에서 사용할 Gemini API 키를 입력하세요.
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-600 hover:underline ml-1"
              >
                API 키 발급받기
              </a>
            </p>
          </div>

          {isLoading ? (
            <div className="h-10 bg-muted animate-pulse rounded-md" />
          ) : settings?.hasGeminiApiKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <Key className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">API 키가 설정되어 있습니다</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  onClick={() => deleteApiKey.mutate()}
                  disabled={deleteApiKey.isPending}
                  className="text-destructive hover:text-destructive"
                  data-testid="button-delete-api-key"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  API 키 삭제
                </Button>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">새 API 키로 변경:</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKey ? "text" : "password"}
                      placeholder="새 API 키 입력..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10"
                      data-testid="input-new-api-key"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowKey(!showKey)}
                      data-testid="button-toggle-key-visibility"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSave}
                    disabled={updateSettings.isPending || !apiKey.trim()}
                    data-testid="button-save-api-key"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <Key className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-700 dark:text-amber-400">API 키가 설정되지 않았습니다</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder="Gemini API 키 입력..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10"
                    data-testid="input-api-key"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowKey(!showKey)}
                    data-testid="button-toggle-key-visibility"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button 
                  onClick={handleSave}
                  disabled={updateSettings.isPending || !apiKey.trim()}
                  className="bg-amber-500 hover:bg-amber-600"
                  data-testid="button-save-api-key"
                >
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-violet-500" />
              원소스 멀티유즈 프롬프트
            </h2>
            <p className="text-sm text-muted-foreground">
              각 플랫폼별 콘텐츠 생성에 사용되는 AI 프롬프트를 커스터마이즈할 수 있습니다.
            </p>
          </div>

          {promptsLoading ? (
            <div className="space-y-4">
              <div className="h-24 bg-muted animate-pulse rounded-md" />
              <div className="h-24 bg-muted animate-pulse rounded-md" />
              <div className="h-24 bg-muted animate-pulse rounded-md" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium">YouTube 대본 프롬프트</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setYoutubePrompt(defaultPrompts.youtube)}
                    className="text-xs"
                    data-testid="button-reset-youtube-prompt"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> 기본값
                  </Button>
                </div>
                <Textarea
                  value={youtubePrompt}
                  onChange={(e) => setYoutubePrompt(e.target.value)}
                  placeholder="YouTube 대본 생성 프롬프트..."
                  className="min-h-[100px] resize-none"
                  data-testid="input-youtube-prompt"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium">Threads 포스트 프롬프트</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setThreadsPrompt(defaultPrompts.threads)}
                    className="text-xs"
                    data-testid="button-reset-threads-prompt"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> 기본값
                  </Button>
                </div>
                <Textarea
                  value={threadsPrompt}
                  onChange={(e) => setThreadsPrompt(e.target.value)}
                  placeholder="Threads 포스트 생성 프롬프트..."
                  className="min-h-[100px] resize-none"
                  data-testid="input-threads-prompt"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium">Reels 대본 프롬프트</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReelsPrompt(defaultPrompts.reels)}
                    className="text-xs"
                    data-testid="button-reset-reels-prompt"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> 기본값
                  </Button>
                </div>
                <Textarea
                  value={reelsPrompt}
                  onChange={(e) => setReelsPrompt(e.target.value)}
                  placeholder="Reels 대본 생성 프롬프트..."
                  className="min-h-[100px] resize-none"
                  data-testid="input-reels-prompt"
                />
              </div>

              <Button
                onClick={() => updatePrompts.mutate({ youtubePrompt, threadsPrompt, reelsPrompt })}
                disabled={updatePrompts.isPending}
                className="w-full bg-violet-500 hover:bg-violet-600"
                data-testid="button-save-prompts"
              >
                <Save className="w-4 h-4 mr-2" />
                {updatePrompts.isPending ? "저장 중..." : "프롬프트 저장"}
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">계정 정보</h2>
          <div className="grid gap-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">이름</span>
              <span className="font-medium">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">이메일</span>
              <span className="font-medium">{user?.email || "-"}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            참가 기수
          </h2>
          <p className="text-sm text-muted-foreground">
            현재 참가 중인 기수 목록입니다. 기수를 탈퇴하면 가치 인정 명단에서 제외됩니다.
          </p>
          
          {batchesLoading ? (
            <div className="space-y-2">
              <div className="h-12 bg-muted animate-pulse rounded-md" />
              <div className="h-12 bg-muted animate-pulse rounded-md" />
            </div>
          ) : userBatches && userBatches.length > 0 ? (
            <div className="space-y-2">
              {userBatches.map((batch) => (
                <div 
                  key={batch.batchId} 
                  className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg"
                  data-testid={`batch-item-${batch.batchId}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{batch.batchName}</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.memberName} · {batch.joinedAt ? new Date(batch.joinedAt).toLocaleDateString('ko-KR') : '가입일 미상'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        data-testid={`button-batch-menu-${batch.batchId}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setSelectedBatch(batch);
                          setLeaveBatchDialogOpen(true);
                        }}
                        data-testid={`button-leave-batch-${batch.batchId}`}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        기수 탈퇴
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>참가 중인 기수가 없습니다</p>
            </div>
          )}
        </Card>

        <AlertDialog open={leaveBatchDialogOpen} onOpenChange={setLeaveBatchDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>기수 탈퇴</AlertDialogTitle>
              <AlertDialogDescription>
                정말 <span className="font-semibold">{selectedBatch?.batchName}</span>에서 탈퇴하시겠습니까?
                <br />
                탈퇴 후에는 가치 인정 명단에서 제외됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedBatch && leaveBatch.mutate(selectedBatch.batchId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-leave-batch"
              >
                {leaveBatch.isPending ? "탈퇴 중..." : "탈퇴하기"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
