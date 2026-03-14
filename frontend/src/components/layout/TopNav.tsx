import { Bell, Search, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function TopNav() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <Link to="/app/settings/workspace" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors text-sm">
          <span className="font-medium text-foreground">{user?.companyName || user?.workspaceName || 'My Workspace'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </Link>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sessions, employees, knowledge..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5">⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="default" size="sm" onClick={() => navigate('/app/sessions/new')}>
          <Plus className="w-4 h-4" />
          New Session
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>
        <Link to="/app/settings" className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold hover:opacity-80 transition-opacity">
          {user?.avatarInitials || '?'}
        </Link>
      </div>
    </header>
  );
}