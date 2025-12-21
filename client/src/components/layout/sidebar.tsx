import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Lightbulb, 
  Trophy, 
  Users, 
  Settings, 
  LogOut, 
  FolderOpen
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFolders } from "@/hooks/use-folders";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: folders } = useFolders();

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: Lightbulb, label: "Crack Time", href: "/dashboard/crack-time" },
    { icon: Users, label: "Sales Machine", href: "/dashboard/leads" },
    { icon: Trophy, label: "Token Game", href: "/dashboard/tokens" },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 h-screen bg-white/50 dark:bg-black/20 backdrop-blur-xl border-r border-border p-6 fixed left-0 top-0 z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <div className="w-3 h-3 rounded-sm bg-white rotate-45" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight">Vibe Coding</span>
      </div>

      <nav className="space-y-2 mb-8">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
              isActive 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                : "text-muted-foreground hover:bg-white/60 dark:hover:bg-white/10 hover:text-foreground"
            )}>
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mb-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Batch Manager
      </div>
      
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-1">
          {folders?.map((folder) => (
            <div key={folder.id} className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-white/40 dark:hover:bg-white/5 cursor-pointer transition-colors">
              <FolderOpen className="w-4 h-4" />
              <span>{folder.name}</span>
            </div>
          ))}
          {!folders?.length && (
            <div className="px-4 py-2 text-sm text-muted-foreground italic">No folders yet</div>
          )}
        </div>
      </ScrollArea>

      <div className="mt-auto pt-6 border-t border-border/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="w-10 h-10 border border-white/50 shadow-sm">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback>{user?.firstName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <ThemeToggle />
        </div>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
