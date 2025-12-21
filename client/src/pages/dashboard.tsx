import { useAuth } from "@/hooks/use-auth";
import { useFolders, useCreateFolder, useDeleteFolder, useBatchMembers, useCreateBatchMember, useDeleteBatchMember, useMemberJournals } from "@/hooks/use-folders";
import { useCreateJournal } from "@/hooks/use-journals";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TokenGame } from "@/components/TokenGame";
import { useCrackTime } from "@/hooks/use-ai-chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  FolderOpen,
  LogOut, 
  Sparkles, 
  Map as MapIcon, 
  ChevronRight,
  Gem,
  Plus,
  Trash2,
  Users,
  UserPlus,
  ArrowLeft,
  BookOpen
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"crack" | "token" | "batch">("crack");

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
          <ThemeToggle />
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
  setActiveTab: (v: "crack" | "token" | "batch") => void, 
  activeTab: string,
  onLogout: () => void,
  user: any
}) {
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
        </nav>
      </div>

      <div className="flex-1" />

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
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const { toast } = useToast();
  const { user } = useAuth();
  const createJournal = useCreateJournal();
  
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [journalTitle, setJournalTitle] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [showJournalForm, setShowJournalForm] = useState(false);
  
  const { data: members, isLoading: membersLoading } = useBatchMembers(selectedFolderId);
  const createMember = useCreateBatchMember();
  const deleteMember = useDeleteBatchMember();
  const { data: memberJournals, isLoading: journalsLoading } = useMemberJournals(selectedMemberId);
  
  const selectedFolder = folders?.find(f => f.id === selectedFolderId);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({ title: "기수 이름을 입력하세요", variant: "destructive" });
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

  const handleCreateMember = () => {
    if (!newMemberName.trim() || !selectedFolderId) {
      toast({ title: "멤버 이름을 입력하세요", variant: "destructive" });
      return;
    }
    createMember.mutate({ folderId: selectedFolderId, data: { name: newMemberName } }, {
      onSuccess: () => {
        toast({ title: "멤버 추가됨" });
        setNewMemberName("");
      },
      onError: () => toast({ title: "추가 실패", variant: "destructive" })
    });
  };

  const handleCreateJournal = () => {
    if (!journalTitle.trim() || !journalContent.trim() || !selectedMemberId || !user) {
      toast({ title: "제목과 내용을 입력하세요", variant: "destructive" });
      return;
    }
    createJournal.mutate({
      title: journalTitle,
      content: journalContent,
      category: "morning",
      userId: user.id,
      memberId: selectedMemberId,
    }, {
      onSuccess: () => {
        toast({ title: "저널 작성 완료" });
        setJournalTitle("");
        setJournalContent("");
        setShowJournalForm(false);
      },
      onError: () => toast({ title: "저널 작성 실패", variant: "destructive" })
    });
  };

  const handleSelectMember = (memberId: number, memberName: string) => {
    setSelectedMemberId(memberId);
    setSelectedMemberName(memberName);
  };

  const handleBack = () => {
    if (selectedMemberId) {
      setSelectedMemberId(null);
      setSelectedMemberName("");
      setShowJournalForm(false);
    } else if (selectedFolderId) {
      setSelectedFolderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {(selectedFolderId || selectedMemberId) && (
            <Button variant="ghost" size="icon" onClick={handleBack} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
              <Users className="text-blue-500" />
              {selectedMemberId ? `${selectedMemberName} 저널` : selectedFolder ? selectedFolder.name : "기수 관리"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {selectedMemberId 
                ? "이 멤버의 아침 저널링을 확인하고 작성합니다." 
                : selectedFolder 
                  ? "멤버를 클릭하여 저널을 작성하세요." 
                  : "기수를 선택하면 멤버 목록이 표시됩니다."
              }
            </p>
          </div>
        </div>
        
        {!selectedFolderId && !selectedMemberId && (
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
              className="rounded-xl bg-blue-500"
              data-testid="button-create-folder"
            >
              <Plus className="w-4 h-4 mr-1" />
              기수 추가
            </Button>
          </div>
        )}

        {selectedFolderId && !selectedMemberId && (
          <div className="flex items-center gap-2 flex-wrap">
            <Input 
              placeholder="새 멤버 이름" 
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-40 rounded-xl bg-white/50 dark:bg-black/20"
              data-testid="input-new-member"
            />
            <Button 
              onClick={handleCreateMember}
              disabled={createMember.isPending}
              className="rounded-xl bg-green-500"
              data-testid="button-add-member"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              멤버 추가
            </Button>
          </div>
        )}

        {selectedMemberId && !showJournalForm && (
          <Button 
            onClick={() => setShowJournalForm(true)}
            className="rounded-xl bg-amber-500"
            data-testid="button-write-journal"
          >
            <BookOpen className="w-4 h-4 mr-1" />
            저널 작성
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedFolderId && (
          <motion.div
            key="folders"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {folders?.map(folder => (
              <Card 
                key={folder.id} 
                className="glass-card rounded-2xl p-5 cursor-pointer group hover:shadow-lg transition-all"
                onClick={() => setSelectedFolderId(folder.id)}
                data-testid={`card-folder-${folder.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">클릭하여 멤버 보기</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`"${folder.name}"를 삭제하시겠습니까?`)) {
                        deleteFolder.mutate(folder.id, { onSuccess: () => toast({ title: "삭제됨" }) });
                      }
                    }}
                    data-testid={`button-delete-folder-${folder.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {folders?.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">아직 기수가 없습니다.</p>
                <p className="text-sm">위에서 기수를 추가해보세요.</p>
              </div>
            )}
          </motion.div>
        )}

        {selectedFolderId && !selectedMemberId && (
          <motion.div
            key="members"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {membersLoading && <p className="col-span-full text-center text-muted-foreground animate-pulse">로딩 중...</p>}
            {members?.map(member => (
              <Card 
                key={member.id} 
                className="glass-card rounded-2xl p-5 cursor-pointer group hover:shadow-lg transition-all"
                onClick={() => handleSelectMember(member.id, member.name)}
                data-testid={`card-member-${member.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {member.name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{member.name}</p>
                      <p className="text-xs text-muted-foreground">클릭하여 저널 보기</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`"${member.name}"를 삭제하시겠습니까?`) && selectedFolderId) {
                        deleteMember.mutate({ id: member.id, folderId: selectedFolderId }, { onSuccess: () => toast({ title: "삭제됨" }) });
                      }
                    }}
                    data-testid={`button-delete-member-${member.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {members?.length === 0 && !membersLoading && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">아직 멤버가 없습니다.</p>
                <p className="text-sm">위에서 멤버를 추가해보세요.</p>
              </div>
            )}
          </motion.div>
        )}

        {selectedMemberId && (
          <motion.div
            key="journals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {showJournalForm && (
              <Card className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-lg">새 저널 작성</h3>
                <Input 
                  placeholder="제목" 
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  className="rounded-xl bg-white/50 dark:bg-black/20"
                  data-testid="input-journal-title"
                />
                <Textarea 
                  placeholder="오늘의 생각, 배움, 감사를 적어보세요..."
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  className="rounded-xl bg-white/50 dark:bg-black/20 min-h-[150px]"
                  data-testid="input-journal-content"
                />
                <div className="flex gap-2 justify-end flex-wrap">
                  <Button variant="outline" onClick={() => setShowJournalForm(false)}>취소</Button>
                  <Button 
                    onClick={handleCreateJournal} 
                    disabled={createJournal.isPending}
                    className="bg-amber-500"
                    data-testid="button-submit-journal"
                  >
                    저장하기
                  </Button>
                </div>
              </Card>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-muted-foreground text-sm">저널 목록</h3>
              {journalsLoading && <p className="text-center text-muted-foreground animate-pulse">로딩 중...</p>}
              {memberJournals?.map(journal => (
                <Card 
                  key={journal.id} 
                  className="glass-card rounded-2xl p-5"
                  data-testid={`card-journal-${journal.id}`}
                >
                  <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                      #{journal.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(journal.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">{journal.title}</h4>
                  <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">{journal.content}</p>
                </Card>
              ))}
              {memberJournals?.length === 0 && !journalsLoading && (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">아직 저널이 없습니다.</p>
                  <p className="text-sm">위의 '저널 작성' 버튼을 눌러 시작하세요.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
