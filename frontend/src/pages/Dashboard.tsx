import { Link } from "react-router-dom";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useSessions, useEmployees, useActivityFeed } from "@/hooks/useApi";
import { Mic, FileCheck, BookOpen, Upload, AlertTriangle, Users, Clock, ArrowRight } from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: activityFeed = [] } = useActivityFeed();

  const awaitingReview = sessions.filter((s: any) => s.status === 'awaiting_review' || s.status === 'awaiting_approval');
  const pendingEmployees = employees.filter((e: any) => e.sessionStatus === 'not_started' || e.sessionStatus === 'scheduled');
  const completedSessions = sessions.filter((s: any) => s.status === 'finalized').length;

  if (sessionsLoading || employeesLoading) {
    return <DashboardSkeleton />;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "NA";
    return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Knowledge capture overview</p>
        </div>
        <Link to="/app/sessions/new" className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-[13px] font-medium hover:bg-foreground/90 transition-colors">
          <Mic className="w-3.5 h-3.5" /> Start Session
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Employees Pending" value={pendingEmployees.length} icon={<Users className="w-4 h-4" />} change="+2 this week" trend="up" />
        <StatCard label="Sessions Completed" value={completedSessions} icon={<Mic className="w-4 h-4" />} change={`${sessions.length} total`} trend="up" />
        <StatCard label="Transcripts Awaiting" value={awaitingReview.length} icon={<FileCheck className="w-4 h-4" />} change={awaitingReview.length > 0 ? "Action needed" : "All clear"} trend="neutral" />
        <StatCard label="Reports Finalized" value={3} icon={<BookOpen className="w-4 h-4" />} change="+1 this week" trend="up" />
      </div>

      {/* Approval Banner */}
      {awaitingReview.length > 0 && (
        <div className="border border-foreground/10 bg-foreground/[0.03] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-foreground/[0.08] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <p className="font-medium text-[13px]">{awaitingReview.length} transcript{awaitingReview.length > 1 ? 's' : ''} awaiting review</p>
              <p className="text-xs text-muted-foreground">Knowledge processing is paused until transcripts are approved</p>
            </div>
          </div>
          <Link to="/app/sessions" className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[13px] font-medium hover:bg-foreground/[0.04] transition-colors">
            Review Now <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="md:col-span-2 bg-white border border-border">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Recent Sessions</h2>
            <Link to="/app/sessions" className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-all">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {sessions.slice(0, 5).map((s) => (
              <Link to={`/app/sessions/${s.id}`} key={s.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-foreground/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-foreground text-background text-xs font-semibold flex items-center justify-center">
                    {s.employeeName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">{s.employeeName}</p>
                    <p className="text-xs text-muted-foreground">{s.employeeRole} · {s.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={s.status} />
                  <span className="text-xs text-muted-foreground">{s.duration}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white border border-border">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Recent Activity</h2>
          </div>
          <div className="p-5 space-y-4">
            {activityFeed.map((a) => (
              <div key={a.id} className="flex gap-3">
                <div className="w-1 h-1 rounded-full bg-foreground mt-2 shrink-0" />
                <div>
                  <p className="text-[13px] text-foreground">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employees Leaving Soon */}
      <div className="bg-white border border-border">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Employees Leaving Soon</h2>
          <Link to="/app/employees" className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-all">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Employee</th>
                <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Department</th>
                <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Exit Date</th>
                <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Session</th>
                <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Risk</th>
                <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 5).map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/app/employees/${e.id}`} className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-foreground text-background text-xs font-semibold flex items-center justify-center">{e.avatarInitials || e.name?.split(' ').map((n: string) => n[0]).join('')}</div>
                      <div>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">{e.role}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{e.department}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.exitDate}</td>
                  <td className="px-5 py-3"><StatusBadge status={e.sessionStatus} /></td>
                  <td className="px-5 py-3"><StatusBadge status={e.riskLevel} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-border overflow-hidden">
                        <div className="h-full bg-foreground" style={{ width: `${e.coverageScore}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{e.coverageScore}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}