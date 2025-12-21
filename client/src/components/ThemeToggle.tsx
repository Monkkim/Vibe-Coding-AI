import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    const root = window.document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="rounded-full w-10 h-10 hover:bg-muted/50 transition-all duration-300"
    >
      {theme === "light" ? (
        <Sun className="h-5 w-5 text-amber-500 transition-all rotate-0 scale-100" />
      ) : (
        <Moon className="h-5 w-5 text-blue-400 transition-all rotate-90 scale-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
