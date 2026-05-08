import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl font-semibold text-muted-foreground">404</div>
      <p className="text-muted-foreground">您想找的頁面不存在。</p>
      <Button asChild>
        <Link to="/">返回首頁</Link>
      </Button>
    </div>
  );
}
