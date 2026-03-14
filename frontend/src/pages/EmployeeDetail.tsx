import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { employees, sessions, extractedTopics } from "@/data/mockData";
import { ArrowLeft, Mic, AlertCircle } from "lucide-react";

export default function EmployeeDetail() {
  const emp = employees[0];
  const empSessions = sessions.filter(s => s.employeeId === emp.id);
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/app/employees"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{emp.name}</h1>
          <p className="text-sm text-muted-foreground">{emp.role} · {emp.department} · Leaving {emp.exitDate}</p>
        </div>
        <Button size="sm" asChild><Link to="/app/sessions/new"><Mic className="w-4 h-4" /> New Session</Link></Button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{l:'Tenure',v:emp.tenure},{l:'Coverage',v:`${emp.coverageScore}%`},{l:'Sessions',v:empSessions.length.toString()},{l:'Risk Level',v:emp.riskLevel}].map(c=>(
          <div key={c.l} className="bg-card rounded-2xl border border-border p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{c.l}</p>
            <p className="text-lg font-semibold mt-1">{c.v === emp.riskLevel ? <StatusBadge status={c.v}/> : c.v}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border shadow-card">
          <div className="p-4 border-b border-border"><h2 className="font-semibold text-sm">Sessions</h2></div>
          <div className="divide-y divide-border">
            {empSessions.map(s=>(
              <Link key={s.id} to={`/app/sessions/${s.id}`} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                <div><p className="text-sm font-medium">Session — {s.lastActivity}</p><p className="text-xs text-muted-foreground">{s.duration} · {s.topicsExtracted} topics</p></div>
                <StatusBadge status={s.status}/>
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-card p-4">
            <h2 className="font-semibold text-sm mb-3">Knowledge Categories Captured</h2>
            <div className="space-y-2">{extractedTopics.slice(0,6).map(t=>(
              <div key={t.name} className="flex justify-between text-sm"><span>{t.category}</span><span className="text-muted-foreground">{Math.round(t.confidence*100)}%</span></div>
            ))}</div>
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-card p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-warning"/>Unresolved Gaps</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Complete vendor contact handover</p>
              <p>• Infrastructure access credentials transfer</p>
              <p>• Budget approval chain documentation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}