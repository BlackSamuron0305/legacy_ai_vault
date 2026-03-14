import { StatCard } from "@/components/common/StatCard";
import { BarChart3, Users, FileCheck, AlertTriangle, BookOpen, Upload } from "lucide-react";

const deptData = [
  { dept: 'Engineering', coverage: 78, sessions: 4, gaps: 2 },
  { dept: 'Operations', coverage: 45, sessions: 1, gaps: 4 },
  { dept: 'Customer Success', coverage: 88, sessions: 2, gaps: 1 },
  { dept: 'Product', coverage: 0, sessions: 0, gaps: 3 },
  { dept: 'Finance', coverage: 0, sessions: 0, gaps: 2 },
  { dept: 'Data', coverage: 0, sessions: 0, gaps: 2 },
];

export default function Analytics() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Knowledge capture metrics and organizational coverage</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Capture Completion" value="52%" icon={<BarChart3 className="w-5 h-5"/>} change="Up from 38% last month" trend="up"/>
        <StatCard label="Employees Covered" value="3/8" icon={<Users className="w-5 h-5"/>} change="5 remaining" trend="neutral"/>
        <StatCard label="Transcripts Pending" value={2} icon={<FileCheck className="w-5 h-5"/>} change="Action needed" trend="neutral"/>
        <StatCard label="Knowledge Packs" value={5} icon={<Upload className="w-5 h-5"/>} change="+2 this week" trend="up"/>
      </div>
      <div className="bg-card rounded-2xl border border-border shadow-card">
        <div className="p-4 border-b border-border"><h2 className="font-semibold text-sm">Coverage by Department</h2></div>
        <div className="p-4">
          <div className="space-y-4">
            {deptData.map(d=>(
              <div key={d.dept} className="flex items-center gap-4">
                <span className="text-sm font-medium w-32">{d.dept}</span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${d.coverage > 70 ? 'bg-success' : d.coverage > 30 ? 'bg-warning' : 'bg-destructive/30'}`} style={{width:`${Math.max(d.coverage,2)}%`}}/>
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">{d.coverage}%</span>
                <span className="text-xs text-muted-foreground w-20">{d.sessions} sessions</span>
                {d.gaps > 2 && <span className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>{d.gaps} gaps</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border shadow-card p-4">
          <h3 className="font-semibold text-sm mb-4">Topics with Low Confidence</h3>
          <div className="space-y-3">
            {['Security Protocols (45%)','Historical Decisions (58%)','Incident Response (65%)','Customer Context (69%)'].map((t,i)=>(
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.split('(')[0]}</span>
                <span className="text-warning font-medium">{t.match(/\((.+)\)/)?.[1]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-card p-4">
          <h3 className="font-semibold text-sm mb-4">Employees Leaving Without Coverage</h3>
          <div className="space-y-3">
            {[{n:'Lisa Thompson',d:'Product',date:'Apr 20'},{n:'Anna Kowalski',d:'Data',date:'May 15'},{n:'Robert Kim',d:'Finance',date:'Jun 1'}].map((e,i)=>(
              <div key={i} className="flex items-center justify-between text-sm">
                <div><span className="font-medium">{e.n}</span><span className="text-muted-foreground ml-2">{e.d}</span></div>
                <span className="text-xs text-destructive">{e.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}