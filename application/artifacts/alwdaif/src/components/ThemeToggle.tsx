import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  const currentIcon = theme === "dark"
    ? <Moon className="h-4 w-4" />
    : theme === "light"
    ? <Sun className="h-4 w-4" />
    : <Monitor className="h-4 w-4" />;

  if (compact) {
    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
        title={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
        aria-label="تبديل الوضع"
      >
        {theme === "dark"
          ? <Sun className="h-4 w-4 text-amber-400" />
          : <Moon className="h-4 w-4 text-blue-500" />
        }
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 rounded-xl border border-border/60 hover:bg-accent"
          title="تغيير المظهر"
          aria-label="تغيير المظهر"
        >
          {currentIcon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`flex items-center gap-2 cursor-pointer ${theme === "light" ? "text-primary font-medium" : ""}`}
        >
          <Sun className="h-4 w-4 text-amber-400 shrink-0" />
          وضع فاتح
          {theme === "light" && <span className="mr-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-2 cursor-pointer ${theme === "dark" ? "text-primary font-medium" : ""}`}
        >
          <Moon className="h-4 w-4 text-indigo-400 shrink-0" />
          وضع داكن
          {theme === "dark" && <span className="mr-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`flex items-center gap-2 cursor-pointer ${theme === "system" ? "text-primary font-medium" : ""}`}
        >
          <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
          وضع النظام
          {theme === "system" && <span className="mr-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
