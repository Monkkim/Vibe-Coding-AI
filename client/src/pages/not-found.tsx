import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card border-none">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold font-display">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            찾으시는 페이지가 존재하지 않습니다. 주소를 다시 확인해주세요.
          </p>
          
          <div className="mt-8">
             <Link href="/">
               <Button className="w-full rounded-xl" variant="outline">
                 메인으로 돌아가기
               </Button>
             </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
