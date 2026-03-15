import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopNav } from "./TopNav";
import { SearchOverlay } from "./SearchOverlay";
import { useAuth } from "@/hooks/useAuth";
import JoinCompany from "@/pages/JoinCompany";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Users without a workspace see the join-company page (except settings/profile)
  const allowedWithoutWorkspace = ["/app/settings"];
  const needsWorkspace = !user?.workspaceId && !allowedWithoutWorkspace.some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onSearchOpen={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-auto">
          {needsWorkspace ? <JoinCompany /> : <Outlet />}
        </main>
      </div>
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}