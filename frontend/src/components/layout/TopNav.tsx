import { useEffect, useRef, useState } from "react";
import { Bell, Search, LogOut, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface TopNavProps {
  onSearchOpen: () => void;
}

export function TopNav({ onSearchOpen }: TopNavProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onSearchOpen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSearchOpen]);

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
        <button
          onClick={onSearchOpen}
          className="relative w-full flex items-center h-8 border border-border bg-white text-[13px] text-muted-foreground/60 hover:border-foreground/30 hover:text-muted-foreground transition-colors px-3 gap-2"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left">Search sessions, employees, knowledge...</span>
          <kbd className="text-[10px] border border-border px-1.5 py-0.5 shrink-0">⌘K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-foreground" />
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="w-7 h-7 bg-foreground text-background flex items-center justify-center text-xs font-semibold hover:opacity-80 transition-opacity"
          >
            {user?.avatarInitials || '?'}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-9 w-44 bg-white border border-border shadow-md z-50">
              <Link
                to="/app/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-foreground hover:bg-foreground/[0.04] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-destructive hover:bg-destructive/[0.06] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}