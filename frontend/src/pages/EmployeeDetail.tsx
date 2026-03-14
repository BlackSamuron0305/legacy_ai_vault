import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useEmployee } from "@/hooks/useApi";
import { ArrowLeft, Mic, AlertCircle } from "lucide-react";
import { EmployeeDetailSkeleton } from "@/components/skeletons";

export default function EmployeeDetail() {
  const { id } = useParams();
  const { data: emp, isLoading } = useEmployee(id!);

  if (isLoading || !emp) {
    return <EmployeeDetailSkeleton />;
  }

  const empSessions = emp.sessions || [];
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/app/employees"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{emp.name}</h1>
          <p className="text-[13px] text-muted-foreground">{emp.role} · {emp.department} · Leaving {emp.exitDate}</p>
        </div>
        <Link to="/app/sessions/new" className="h-8 px-4 bg-foreground text-background text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/90 transition-colors"><Mic className="w-3.5 h-3.5" /> New Session</Link>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{l:'Tenure',v:emp.tenure},{l:'Coverage',v:`${emp.coverageScore}%`},{l:'Sessions',v:empSessions.length.toString()},{l:'Risk Level',v:emp.riskLevel}].map(c=>(
          <div key={c.l} className="bg-white border border-border p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.l}</p>
            <p className="text-lg font-semibold mt-1">{c.v === emp.riskLevel ? <StatusBadge status={c.v}/> : c.v}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-border">
          <div className="px-5 py-3.5 border-b border-border"><h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Sessions</h2></div>
          <div className="divide-y divide-border">
            {empSessions.map(s=>(
              <Link key={s.id} to={`/app/sessions/${s.id}`} className="px-5 py-3.5 flex items-center justify-between hover:bg-foreground/[0.02] transition-colors">
                <div><p className="text-[13px] font-medium">Session — {s.lastActivity}</p><p className="text-xs text-muted-foreground">{s.duration} · {s.topicsExtracted} topics</p></div>
                <StatusBadge status={s.status}/>
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-border p-5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Session Summary</h2>
            <div className="space-y-2 text-[13px] text-muted-foreground">
              <p>{empSessions.length} session{empSessions.length !== 1 ? 's' : ''} recorded</p>
              <p>Coverage: {emp.coverageScore || 0}%</p>
            </div>
          </div>
          <div className="bg-white border border-border p-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 text-amber-500"/>Unresolved Gaps</h3>
            <div className="space-y-1 text-[13px] text-muted-foreground">
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