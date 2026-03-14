import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useSessions, useEmployees, useKnowledgeCategories } from "@/hooks/useApi";
import { Mic, Users, BookOpen, LayoutDashboard, FileText, BarChart3, Upload, Settings } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", url: "/app", icon: LayoutDashboard },
  { label: "Sessions", url: "/app/sessions", icon: Mic },
  { label: "Knowledge Base", url: "/app/knowledge", icon: BookOpen },
  { label: "Reports", url: "/app/reports", icon: FileText },
  { label: "Exports", url: "/app/exports", icon: Upload },
  { label: "Employees", url: "/app/employees", icon: Users },
  { label: "Analytics", url: "/app/analytics", icon: BarChart3 },
  { label: "Settings", url: "/app/settings", icon: Settings },
];

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();
  const { data: employees = [] } = useEmployees();
  const { data: categories = [] } = useKnowledgeCategories();

  const runAndClose = (url: string) => {
    navigate(url);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Suchen – Sessions, Mitarbeiter, Wissen..." />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {NAV_ITEMS.map((item) => (
            <CommandItem key={item.url} onSelect={() => runAndClose(item.url)}>
              <item.icon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {sessions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Sessions">
              {sessions.slice(0, 8).map((s: any) => (
                <CommandItem key={s.id} onSelect={() => runAndClose(`/app/sessions/${s.id}`)}>
                  <Mic className="mr-2 h-4 w-4 shrink-0 opacity-60" />
                  <span className="truncate">{s.employeeName || s.title || `Session #${s.id}`}</span>
                  {s.status && (
                    <span className="ml-auto text-xs text-muted-foreground capitalize">{s.status}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {employees.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Mitarbeiter">
              {employees.slice(0, 8).map((e: any) => (
                <CommandItem key={e.id} onSelect={() => runAndClose(`/app/employees/${e.id}`)}>
                  <Users className="mr-2 h-4 w-4 shrink-0 opacity-60" />
                  <span className="truncate">{e.name}</span>
                  {e.department && (
                    <span className="ml-auto text-xs text-muted-foreground">{e.department}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {categories.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Wissensbereiche">
              {categories.slice(0, 8).map((c: any) => (
                <CommandItem key={c.name} onSelect={() => runAndClose(`/app/knowledge/${encodeURIComponent(c.name)}`)}>
                  <BookOpen className="mr-2 h-4 w-4 shrink-0 opacity-60" />
                  <span className="truncate">{c.name}</span>
                  {c.cardCount !== undefined && (
                    <span className="ml-auto text-xs text-muted-foreground">{c.cardCount} Karten</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
