import { useState } from "react";
import { Link } from "react-router-dom";
import { sessions } from "@/data/mockData";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";

const filters = ['All', 'Scheduled', 'In Progress', 'Awaiting Review', 'Awaiting Approval', 'Processing', 'Finalized'];

export default function Sessions() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All' ? sessions : sessions.filter(s => {
    const map: Record<string, string> = { 'Scheduled': 'scheduled', 'In Progress': 'in_progress', 'Awaiting Review': 'awaiting_review', 'Awaiting Approval': 'awaiting_approval', 'Processing': 'processing', 'Finalized': 'finalized' };
    return s.status === map[activeFilter];
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">Knowledge capture sessions across your organization</p>
        </div>
        <Button asChild><Link to="/app/sessions/new"><Plus className="w-4 h-4" /> New Session</Link></Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">Employee</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Department</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Transcript</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Duration</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Topics</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Coverage</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="p-3">
                  <Link to={`/app/sessions/${s.id}`} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                      {s.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{s.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{s.employeeRole}</p>
                    </div>
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{s.department}</td>
                <td className="p-3"><StatusBadge status={s.status} /></td>
                <td className="p-3"><StatusBadge status={s.transcriptStatus} /></td>
                <td className="p-3 text-muted-foreground">{s.duration}</td>
                <td className="p-3 text-muted-foreground">{s.topicsExtracted}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${s.coverageScore}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{s.coverageScore}%</span>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground text-xs">{s.lastActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}