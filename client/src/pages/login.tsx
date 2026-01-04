import { useState } from "react";
import { useLogin } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const login = useLogin();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login.mutateAsync({ email, password });
      setLocation("/batches");
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-amber-400/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px]" />
      </div>

      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <Gem className="text-amber-500" />
          <span>AGround</span>
        </Link>
        <ThemeToggle />
      </nav>

      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">로그인</CardTitle>
          <CardDescription>AGround에 오신 것을 환영합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={login.isPending}
              data-testid="button-login"
            >
              {login.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm">
            <Link href="/signup" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-signup">
              계정이 없으신가요? <span className="text-primary font-medium">회원가입</span>
            </Link>
            <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-forgot-password">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
