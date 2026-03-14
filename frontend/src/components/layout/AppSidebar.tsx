import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Mic, BookOpen, FileText, Upload, Users, BarChart3, Play, Settings, ChevronLeft, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Sessions", url: "/app/sessions", icon: Mic },
  { title: "Knowledge Base", url: "/app/knowledge", icon: BookOpen },
  { title: "Reports", url: "/app/reports", icon: FileText },
  { title: "Exports", url: "/app/exports", icon: Upload },
  { title: "Employees", url: "/app/employees", icon: Users },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
  { title: "Demo Mode", url: "/app/demo", icon: Play },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();

  return (
    <aside className={cn(
      "h-screen flex flex-col border-r border-border bg-sidebar transition-all duration-200 shrink-0",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className={cn("p-4 flex items-center gap-2", collapsed ? "justify-center" : "")}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Brain className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="font-semibold text-foreground text-lg tracking-tight">LegacyAI</span>}
      </div>

      <nav className="flex-1 px-2 space-y-0.5 mt-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url || 
            (item.url !== '/app' && location.pathname.startsWith(item.url));
          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border">
        <Link
          to="/app/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
            location.pathname.startsWith('/app/settings') && "bg-primary/10 text-primary",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn("w-full mt-1", collapsed ? "px-2" : "")}
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="text-xs text-muted-foreground">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}