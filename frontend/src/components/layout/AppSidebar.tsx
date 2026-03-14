import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Mic, BookOpen, FileText, Upload, Users, BarChart3, Settings, ChevronLeft, LogOut, Shield, Building2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Sessions", url: "/app/sessions", icon: Mic },
  { title: "Knowledge Base", url: "/app/knowledge", icon: BookOpen },
  { title: "Reports", url: "/app/reports", icon: FileText },
  { title: "Exports", url: "/app/exports", icon: Upload },
  { title: "Employees", url: "/app/employees", icon: Users },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={cn(
      "h-screen flex flex-col border-r border-border bg-white transition-all duration-200 shrink-0",
      collapsed ? "w-14" : "w-56"
    )}>
      {/* Logo */}
      <div className={cn("h-14 flex items-center border-b border-border px-4", collapsed ? "justify-center px-2" : "")}>
        {collapsed ? (
          <img src="/logo-icon.svg" alt="LegacyAI" className="h-6 w-6 dark:invert" />
        ) : (
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-icon.svg" alt="LegacyAI" className="h-6 w-6 dark:invert" />
            <span className="text-sm font-semibold text-foreground tracking-tight">Legacy AI</span>
          </Link>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-px">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url || 
            (item.url !== '/app' && location.pathname.startsWith(item.url));
          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "text-foreground bg-foreground/[0.06]"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="py-2 px-2 border-t border-border space-y-px">
        {/* Admin: platform admin panel */}
        {user?.role === 'admin' && (
          <Link
            to="/app/admin"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors",
              location.pathname.startsWith('/app/admin')
                ? "text-foreground bg-foreground/[0.06]"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
              collapsed && "justify-center px-2"
            )}
          >
            <Shield className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <span className="flex items-center gap-1.5">
                Admin
                <span className="text-[9px] font-semibold uppercase tracking-wider border border-foreground/20 text-foreground/60 px-1 py-px leading-none">Admin</span>
              </span>
            )}
          </Link>
        )}
        {/* Owner: company management */}
        {user?.role === 'owner' && (
          <Link
            to="/app/admin"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors",
              location.pathname.startsWith('/app/admin')
                ? "text-foreground bg-foreground/[0.06]"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
              collapsed && "justify-center px-2"
            )}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Company</span>}
          </Link>
        )}
        {/* Team: visible to owner and member */}
        {(user?.role === 'owner' || user?.role === 'member') && (
          <Link
            to="/app/team"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors",
              location.pathname.startsWith('/app/team')
                ? "text-foreground bg-foreground/[0.06]"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
              collapsed && "justify-center px-2"
            )}
          >
            <Users className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Team</span>}
          </Link>
        )}
        <Link
          to="/app/settings"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors",
            location.pathname.startsWith('/app/settings') && "text-foreground bg-foreground/[0.06]",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-destructive transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={onToggle}
          className={cn("w-full flex items-center gap-2.5 px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors", collapsed ? "justify-center px-2" : "")}
        >
          <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}