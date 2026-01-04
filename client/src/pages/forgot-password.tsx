import { useState } from "react";
import { useForgotPassword } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const forgotPassword = useForgotPassword();
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

    try {
      const result = await forgotPassword.mutateAsync(email);
      setIsSubmitted(true);
      if (result.tempPassword) {
        setTempPassword(result.tempPassword);
      }
    } catch (error: any) {
      toast({
        title: "오류",
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
          <CardTitle className="text-2xl font-bold">비밀번호 찾기</CardTitle>
          <CardDescription>
            {isSubmitted 
              ? "임시 비밀번호가 발급되었습니다" 
              : "가입하신 이메일을 입력해주세요"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              {tempPassword ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground">임시 비밀번호가 발급되었습니다:</p>
                  <div className="bg-muted p-4 rounded-md">
                    <code className="text-lg font-mono font-bold" data-testid="text-temp-password">{tempPassword}</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    이 비밀번호로 로그인 후 새 비밀번호로 변경해주세요.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  입력하신 이메일로 임시 비밀번호가 발송되었습니다.
                  이메일을 확인해주세요.
                </p>
              )}
              <Link href="/login">
                <Button variant="outline" className="mt-4" data-testid="button-back-to-login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  로그인으로 돌아가기
                </Button>
              </Link>
            </div>
          ) : (
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
              <Button 
                type="submit" 
                className="w-full"
                disabled={forgotPassword.isPending}
                data-testid="button-submit"
              >
                {forgotPassword.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  "임시 비밀번호 발급"
                )}
              </Button>
            </form>
          )}

          {!isSubmitted && (
            <div className="mt-6 text-center text-sm">
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-login">
                <ArrowLeft className="inline mr-1 h-4 w-4" />
                로그인으로 돌아가기
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
