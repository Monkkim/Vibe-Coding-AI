import { useAuth } from "@/hooks/use-auth";
import { useFolders, useCreateFolder, useDeleteFolder } from "@/hooks/use-folders";
import { useJournals } from "@/hooks/use-journals";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CreateJournalDrawer } from "@/components/CreateJournalDrawer";
import { SalesMachine } from "@/components/SalesMachine";
import { TokenGame } from "@/components/TokenGame";
import { useCrackTime } from "@/hooks/use-ai-chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Folder, 
  FolderOpen,
  Settings, 
  LogOut, 
  Sparkles, 
  Map as MapIcon, 
  ChevronRight,
  LayoutDashboard,
  Gem,
  Plus,
  Trash2,
  Users
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"crack" | "sales" | "token" | "batch">("crack");

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-amber-100">
      {/* Sidebar */}
      <Sidebar setActiveTab={setActiveTab} activeTab={activeTab} onLogout={() => logout()} user={user} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <header className="flex justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Hello, {user?.firstName || "Viber"}
            </h1>
            <p className="text-muted-foreground">오늘도 한계를 돌파할 준비가 되셨나요?</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <CreateJournalDrawer />
            <ThemeToggle />
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-7xl mx-auto"
          >
            {activeTab === "crack" && <CrackTimeSection />}
            {activeTab === "sales" && <SalesMachine />}
            {activeTab === "token" && <TokenGame />}
            {activeTab === "batch" && <BatchManager />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Sidebar({ 
  setActiveTab, 
  activeTab, 
  onLogout,
  user 
}: { 
  setActiveTab: (v: "crack" | "sales" | "token" | "batch") => void, 
  activeTab: string,
  onLogout: () => void,
  user: any
}) {
  const { data: folders } = useFolders();
  const deleteFolder = useDeleteFolder();
  const { toast } = useToast();

  const handleDeleteFolder = (id: number, name: string) => {
    if (confirm(`"${name}" 폴더를 삭제하시겠습니까?`)) {
      deleteFolder.mutate(id, {
        onSuccess: () => toast({ title: "폴더 삭제됨" }),
        onError: () => toast({ title: "삭제 실패", variant: "destructive" })
      });
    }
  };

  return (
    <aside className="w-64 glass border-r border-border hidden md:flex flex-col h-full z-10">
      <div className="p-6">
        <div className="flex items-center gap-2 font-display font-bold text-xl text-primary mb-8">
          <Gem className="w-6 h-6" />
          Vibe Coding
        </div>

        <nav className="space-y-2">
          <SidebarItem 
            icon={<Sparkles className="w-4 h-4" />} 
            label="Crack Time" 
            active={activeTab === "crack"}
            onClick={() => setActiveTab("crack")}
          />
          <SidebarItem 
            icon={<Users className="w-4 h-4" />} 
            label="기수 관리" 
            active={activeTab === "batch"}
            onClick={() => setActiveTab("batch")}
          />
          <SidebarItem 
            icon={<Gem className="w-4 h-4" />} 
            label="Token Game" 
            active={activeTab === "token"}
            onClick={() => setActiveTab("token")}
          />
          <SidebarItem 
            icon={<LayoutDashboard className="w-4 h-4" />} 
            label="Sales Machine" 
            active={activeTab === "sales"}
            onClick={() => setActiveTab("sales")}
          />
        </nav>
      </div>

      <Separator className="bg-border/50" />

      <ScrollArea className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Batches
          </h3>
        </div>
        <div className="space-y-1">
          {folders?.map(folder => (
            <div 
              key={folder.id} 
              className="group flex items-center justify-between w-full text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg px-2 py-2 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => setActiveTab("batch")}>
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{folder.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteFolder(folder.id, folder.name)}
                data-testid={`button-delete-folder-${folder.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {folders?.length === 0 && (
            <p className="text-xs text-muted-foreground/50 italic px-2">폴더가 없습니다.</p>
          )}
        </div>
      </ScrollArea>

      <div className="p-6 mt-auto border-t border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs">
            {user?.firstName?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
          onClick={onLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" /> 로그아웃
        </Button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`w-full justify-start rounded-xl transition-all duration-200 ${
        active 
          ? "bg-primary/10 text-primary font-semibold shadow-sm" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <span className={`mr-2 ${active ? "text-primary" : ""}`}>{icon}</span>
      {label}
      {active && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
    </Button>
  );
}

function CrackTimeSection() {
  const { sendMessage, isLoading, insight, actionMap } = useCrackTime();
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
      {/* Input Section */}
      <div className="flex flex-col justify-center space-y-8">
        <div>
          <h2 className="text-4xl font-display font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            Crack Time
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            지금 당신을 가로막고 있는 <span className="text-primary font-medium">안개(Fog)</span>는 무엇인가요?<br />
            명확하게 적을수록 빛은 더 선명해집니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur-lg"></div>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="예: 기술 스택을 선정하는 기준이 모호해서 프로젝트 시작을 못하고 있어요."
              className="relative w-full h-16 rounded-2xl bg-white/80 dark:bg-black/50 border-white/20 text-lg px-6 shadow-xl focus:ring-2 ring-primary/50 transition-all"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || !input}
            className="w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-bold text-lg shadow-lg transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-spin" /> 안개를 걷어내는 중...
              </span>
            ) : (
              "빛(Insight) 발견하기"
            )}
          </Button>
        </form>
      </div>

      {/* Output Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-blue-100/50 dark:from-amber-900/10 dark:to-blue-900/10 rounded-3xl blur-3xl -z-10"></div>
        <div className="h-full flex flex-col justify-center space-y-6 p-4">
          {insight ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-3xl p-8 border-t-4 border-t-amber-500 shadow-2xl"
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 text-amber-600 font-bold mb-2 uppercase tracking-wider text-sm">
                  <Sparkles className="w-4 h-4" /> Insight
                </div>
                <h3 className="text-2xl font-bold leading-relaxed text-foreground">
                  {insight}
                </h3>
              </div>
              
              <Separator className="my-6 bg-border/50" />
              
              <div>
                <div className="flex items-center gap-2 text-blue-600 font-bold mb-4 uppercase tracking-wider text-sm">
                  <MapIcon className="w-4 h-4" /> Action Map
                </div>
                <ul className="space-y-4">
                  {actionMap.map((action, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-foreground/90">{action}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : (
            <div className="h-full border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">아직 지도가 없습니다</h3>
              <p>좌측에 고민을 입력하여<br/>성장의 실마리를 찾아보세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BatchManager() {
  const { data: folders } = useFolders();
  const { data: journalsData, isLoading: journalsLoading } = useJournals();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const { toast } = useToast();
  const [selectedJournal, setSelectedJournal] = useState<{
    id: number;
    title: string;
    content: string;
    category: string;
    createdAt: Date;
  } | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({ title: "폴더 이름을 입력하세요", variant: "destructive" });
      return;
    }
    createFolder.mutate({ name: newFolderName, type: "batch" }, {
      onSuccess: () => {
        toast({ title: "기수 생성 완료" });
        setNewFolderName("");
      },
      onError: () => toast({ title: "생성 실패", variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Users className="text-blue-500" />
            기수 관리
          </h2>
          <p className="text-muted-foreground text-sm">기수별 폴더와 수강생 저널을 관리합니다.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Input 
            placeholder="새 기수 이름" 
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-40 rounded-xl bg-white/50 dark:bg-black/20"
            data-testid="input-new-folder"
          />
          <Button 
            onClick={handleCreateFolder}
            disabled={createFolder.isPending}
            className="rounded-xl bg-blue-500 hover:bg-blue-600"
            data-testid="button-create-folder"
          >
            <Plus className="w-4 h-4 mr-1" />
            기수 추가
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folders Section */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-muted-foreground text-sm px-2">기수 목록</h3>
          <div className="space-y-2">
            {folders?.map(folder => (
              <Card 
                key={folder.id} 
                className="glass-card rounded-2xl p-4 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">{folder.type}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm(`"${folder.name}"를 삭제하시겠습니까?`)) {
                      deleteFolder.mutate(folder.id, {
                        onSuccess: () => toast({ title: "삭제됨" })
                      });
                    }
                  }}
                  data-testid={`button-delete-batch-${folder.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
            {folders?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>아직 기수가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* Journals Section */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-muted-foreground text-sm px-2">아침 저널링 목록</h3>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2 pr-2">
              {journalsLoading && <p className="text-center text-muted-foreground animate-pulse">로딩 중...</p>}
              {journalsData?.map(journal => (
                <Card 
                  key={journal.id} 
                  className={`glass-card rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedJournal?.id === journal.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedJournal(journal)}
                  data-testid={`card-journal-${journal.id}`}
                >
                  <p className="font-medium truncate">{journal.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(journal.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </Card>
              ))}
              {journalsData?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>아직 저널이 없습니다.</p>
                  <p className="text-sm">상단의 '기록하기' 버튼을 눌러 시작하세요.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Detail Drawer */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-muted-foreground text-sm px-2 mb-4">저널 상세</h3>
          {selectedJournal ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-3xl p-6 border-l-4 border-l-primary"
            >
              <div className="flex items-center justify-between mb-4 gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  #{selectedJournal.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(selectedJournal.createdAt).toLocaleString('ko-KR')}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-4">{selectedJournal.title}</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">
                  {selectedJournal.content}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="h-[400px] border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-muted-foreground text-center p-6">
              <MapIcon className="w-12 h-12 mb-4 opacity-30" />
              <p>저널을 선택하면<br/>상세 내용이 여기에 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
