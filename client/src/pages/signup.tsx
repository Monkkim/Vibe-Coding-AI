import { useState } from "react";
import { useSignup } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";

export function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [, setLocation] = useLocation();
  const signup = useSignup();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "오류",
        description: "올바른 이메일 형식을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "오류",
        description: "비밀번호는 6자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "오류",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      await signup.mutateAsync({ email, password, firstName });
      toast({
        title: "회원가입 완료",
        description: "환영합니다! 로그인되었습니다.",
      });
      setLocation("/batches");
    } catch (error: any) {
      toast({
        title: "회원가입 실패",
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
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription>AGround 계정을 만들어보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">이름 (선택)</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="홍길동"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                data-testid="input-firstName"
              />
            </div>
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
                placeholder="6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                data-testid="input-confirmPassword"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={signup.isPending}
              data-testid="button-signup"
            >
              {signup.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  가입 중...
                </>
              ) : (
                "가입하기"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-login">
              이미 계정이 있으신가요? <span className="text-primary font-medium">로그인</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
