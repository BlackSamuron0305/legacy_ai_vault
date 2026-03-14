import { Link } from "react-router-dom";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { sessions, employees, activityFeed } from "@/data/mockData";
import { Mic, FileCheck, BookOpen, Upload, AlertTriangle, Users, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const awaitingReview = sessions.filter(s => s.status === 'awaiting_review' || s.status === 'awaiting_approval');
  const pendingEmployees = employees.filter(e => e.sessionStatus === 'not_started' || e.sessionStatus === 'scheduled');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Knowledge capture overview for Acme Corp</p>
        </div>
        <Button asChild><Link to="/app/sessions/new"><Mic className="w-4 h-4" /> Start Session</Link></Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Employees Pending" value={pendingEmployees.length} icon={<Users className="w-5 h-5" />} change="+2 this week" trend="up" />
        <StatCard label="Sessions Completed" value={4} icon={<Mic className="w-5 h-5" />} change="67% completion" trend="up" />
        <StatCard label="Transcripts Awaiting" value={awaitingReview.length} icon={<FileCheck className="w-5 h-5" />} change="Action needed" trend="neutral" />
        <StatCard label="Reports Finalized" value={3} icon={<BookOpen className="w-5 h-5" />} change="+1 this week" trend="up" />
      </div>

      {/* Approval Banner */}
      {awaitingReview.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="font-medium text-sm">{awaitingReview.length} transcript{awaitingReview.length > 1 ? 's' : ''} awaiting review</p>
              <p className="text-xs text-muted-foreground">Knowledge processing is paused until transcripts are approved</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/sessions">Review Now <ArrowRight className="w-3.5 h-3.5" /></Link>
          </Button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="md:col-span-2 bg-card rounded-2xl border border-border shadow-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Recent Sessions</h2>
            <Link to="/app/sessions" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {sessions.slice(0, 5).map((s) => (
              <Link to={`/app/sessions/${s.id}`} key={s.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                    {s.employeeName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.employeeName}</p>
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
        <div className="bg-card rounded-2xl border border-border shadow-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-sm">Recent Activity</h2>
          </div>
          <div className="p-4 space-y-4">
            {activityFeed.map((a) => (
              <div key={a.id} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <p className="text-sm text-foreground">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employees Leaving Soon */}
      <div className="bg-card rounded-2xl border border-border shadow-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Employees Leaving Soon</h2>
          <Link to="/app/employees" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">Employee</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Department</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Exit Date</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Session Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Risk</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 5).map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="p-3">
                    <Link to={`/app/employees/${e.id}`} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{e.avatar}</div>
                      <div>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">{e.role}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">{e.department}</td>
                  <td className="p-3 text-muted-foreground">{e.exitDate}</td>
                  <td className="p-3"><StatusBadge status={e.sessionStatus} /></td>
                  <td className="p-3"><StatusBadge status={e.riskLevel} /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${e.coverageScore}%` }} />
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