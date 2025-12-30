import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Key, Eye, EyeOff, Save, Trash2, Settings as SettingsIcon } from "lucide-react";
import { Link } from "wouter";

export function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const { data: settings, isLoading } = useQuery<{ hasGeminiApiKey: boolean }>({
    queryKey: ["/api/settings"],
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
      </div>
    </div>
  );
}
