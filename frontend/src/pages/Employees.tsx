import { Link } from "react-router-dom";
import { employees } from "@/data/mockData";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Employees() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">Track knowledge capture for departing employees</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4" /> Add Employee</Button>
      </div>
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="text-left p-3 font-medium text-muted-foreground">Employee</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Department</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Exit Date</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Tenure</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Session</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Transcript</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Risk</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Coverage</th>
          </tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="p-3"><Link to={`/app/employees/${e.id}`} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{e.avatar}</div>
                  <div><p className="font-medium">{e.name}</p><p className="text-xs text-muted-foreground">{e.role}</p></div>
                </Link></td>
                <td className="p-3 text-muted-foreground">{e.department}</td>
                <td className="p-3 text-muted-foreground">{e.exitDate}</td>
                <td className="p-3 text-muted-foreground">{e.tenure}</td>
                <td className="p-3"><StatusBadge status={e.sessionStatus} /></td>
                <td className="p-3"><StatusBadge status={e.transcriptStatus} /></td>
                <td className="p-3"><StatusBadge status={e.riskLevel} /></td>
                <td className="p-3"><div className="flex items-center gap-2"><div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{width:`${e.coverageScore}%`}}/></div><span className="text-xs text-muted-foreground">{e.coverageScore}%</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}