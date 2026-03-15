import { useState } from "react";
import { Link } from "react-router-dom";
import { useSessions } from "@/hooks/useApi";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { SessionsSkeleton } from "@/components/skeletons";

const filters = ['All', 'Scheduled', 'In Progress', 'Awaiting Review', 'Awaiting Approval', 'Processing', 'Finalized'];

export default function Sessions() {
  const [activeFilter, setActiveFilter] = useState('All');
  const { data: sessions = [], isLoading } = useSessions();

  const getInitials = (name?: string | null) => {
    if (!name) return 'NA';
    return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return <SessionsSkeleton />;
  }

  const filtered = activeFilter === 'All' ? sessions : sessions.filter((s: any) => {
    const map: Record<string, string> = { 'Scheduled': 'scheduled', 'In Progress': 'in_progress', 'Awaiting Review': 'awaiting_review', 'Awaiting Approval': 'awaiting_approval', 'Processing': 'processing', 'Finalized': 'finalized' };
    return s.status === map[activeFilter];
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sessions</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Knowledge capture sessions across your organization</p>
        </div>
        <Link to="/app/sessions/new" className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-[13px] font-medium hover:bg-foreground/90 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Session
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${
              activeFilter === f ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-border overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Employee</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Department</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Transcript</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Duration</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Topics</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Coverage</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-foreground/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <Link to={`/app/sessions/${s.id}`} className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-foreground text-background text-xs font-semibold flex items-center justify-center">
                      {s.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{s.employeeName || 'No employee selected'}</p>
                      <p className="text-xs text-muted-foreground">{s.employeeRole || 'Test mode'}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{s.department}</td>
                <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-5 py-3"><StatusBadge status={s.transcriptStatus} /></td>
                <td className="px-5 py-3 text-muted-foreground">{s.duration}</td>
                <td className="px-5 py-3 text-muted-foreground">{s.topicsExtracted}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1 bg-border overflow-hidden">
                      <div className="h-full bg-foreground" style={{ width: `${s.coverageScore}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{s.coverageScore}%</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs">{s.lastActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}