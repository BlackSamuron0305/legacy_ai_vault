import { Bell, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function TopNav() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="h-14 border-b border-border bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] font-medium text-foreground">{user?.companyName || user?.workspaceName || 'My Workspace'}</span>
        {user?.role === 'owner' && (
          <span className="text-[10px] font-semibold uppercase tracking-wider border border-foreground/25 text-foreground/70 px-1.5 py-0.5 leading-none">Company</span>
        )}
        {user?.role === 'admin' && (
          <span className="text-[10px] font-semibold uppercase tracking-wider border border-foreground/25 text-foreground/70 px-1.5 py-0.5 leading-none">Admin</span>
        )}
        {user?.role && user.role !== 'admin' && user.role !== 'owner' && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 leading-none">{user.role}</span>
        )}
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sessions, employees, knowledge..."
            className="w-full h-8 pl-9 pr-4 border border-border bg-white text-[13px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/20"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border border-border px-1.5 py-0.5">⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate('/app/sessions/new')}
          className="h-8 text-[13px] rounded-none bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="w-3.5 h-3.5" />
          New Session
        </Button>
        <button className="relative w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-foreground" />
        </button>
        <Link to="/app/settings" className="w-7 h-7 bg-foreground text-background flex items-center justify-center text-xs font-semibold hover:opacity-80 transition-opacity">
          {user?.avatarInitials || '?'}
        </Link>
      </div>
    </header>
  );
}