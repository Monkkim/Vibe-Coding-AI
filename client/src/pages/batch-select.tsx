import { useAuth } from "@/hooks/use-auth";
import { useFolders, useCreateFolder, useDeleteFolder } from "@/hooks/use-folders";
import { useBatch } from "@/contexts/BatchContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Users, Plus, Trash2, LogOut, Gem, ChevronRight, Settings } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Folder } from "@shared/schema";

export function BatchSelect() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { data: folders, isLoading } = useFolders();
  const { setSelectedBatch } = useBatch();
  const [, navigate] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const batches = folders?.filter((f: Folder) => f.type === "batch") || [];

  const handleSelectBatch = (batch: Folder) => {
    setSelectedBatch(batch);
    navigate("/dashboard");
  };

  const handleCreateBatch = () => {
    if (!newBatchName.trim()) return;
    createFolder.mutate(
      { name: newBatchName.trim(), type: "batch" },
      {
        onSuccess: () => {
          setNewBatchName("");
          setShowCreateDialog(false);
        },
      }
    );
  };

  const handleDeleteBatch = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("이 기수를 삭제하시겠습니까?")) {
      deleteFolder.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:from-amber-950/20 dark:via-background dark:to-orange-950/20">
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 font-display font-bold text-xl text-primary">
          <Gem className="w-6 h-6" />
          AGround
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="icon" data-testid="button-settings">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="button-logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-2">
            안녕하세요, {user?.firstName || "사용자"}님
          </h1>
          <p className="text-muted-foreground text-lg">참여할 기수를 선택해주세요</p>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground animate-pulse py-12">
            기수 목록을 불러오는 중...
          </div>
        ) : batches.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">등록된 기수가 없습니다</h3>
            <p className="text-muted-foreground mb-6">새로운 기수를 만들어 시작해보세요</p>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-batch">
              <Plus className="w-4 h-4 mr-2" />
              첫 기수 만들기
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((batch: Folder, index: number) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="p-6 cursor-pointer hover-elevate group"
                  onClick={() => handleSelectBatch(batch)}
                  data-testid={`card-batch-${batch.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{batch.name}</h3>
                        <p className="text-sm text-muted-foreground">기수 선택하기</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteBatch(e, batch.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-delete-batch-${batch.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: batches.length * 0.1 }}
            >
              <Card
                className="p-6 cursor-pointer hover-elevate border-dashed"
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-add-batch"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-muted-foreground">새 기수 추가</h3>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </main>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 기수 만들기</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="기수 이름 (예: AG 44기)"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateBatch()}
              data-testid="input-batch-name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreateBatch}
              disabled={!newBatchName.trim() || createFolder.isPending}
              data-testid="button-confirm-create-batch"
            >
              {createFolder.isPending ? "생성 중..." : "만들기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
