import { StatCard } from "@/components/common/StatCard";
import { useAnalyticsCoverage, useAnalyticsGaps, useAnalyticsSummary } from "@/hooks/useApi";
import { BarChart3, Users, FileCheck, AlertTriangle, BookOpen, Upload, Loader2 } from "lucide-react";

export default function Analytics() {
  const { data: coverage = [], isLoading: coverageLoading } = useAnalyticsCoverage();
  const { data: gaps = [] } = useAnalyticsGaps();
  const { data: summary } = useAnalyticsSummary();

  if (coverageLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Knowledge capture metrics and organizational coverage</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Capture Completion" value={`${summary?.captureCompletion || 0}%`} icon={<BarChart3 className="w-4 h-4"/>} change="" trend="up"/>
        <StatCard label="Employees Covered" value={`${summary?.employeesCovered || 0}/${summary?.totalEmployees || 0}`} icon={<Users className="w-4 h-4"/>} change={`${(summary?.totalEmployees || 0) - (summary?.employeesCovered || 0)} remaining`} trend="neutral"/>
        <StatCard label="Transcripts Pending" value={summary?.transcriptsPending || 0} icon={<FileCheck className="w-4 h-4"/>} change={summary?.transcriptsPending > 0 ? "Action needed" : "All clear"} trend="neutral"/>
        <StatCard label="Sessions Total" value={summary?.totalSessions || 0} icon={<Upload className="w-4 h-4"/>} change="" trend="up"/>
      </div>
      <div className="bg-white border border-border">
        <div className="px-5 py-3.5 border-b border-border"><h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Coverage by Department</h2></div>
        <div className="p-5">
          <div className="space-y-4">
            {coverage.map((d: any) =>(
              <div key={d.department} className="flex items-center gap-4">
                <span className="text-[13px] font-medium w-32">{d.department}</span>
                <div className="flex-1 h-2 bg-border overflow-hidden">
                  <div className={`h-full ${d.avgCoverage > 70 ? 'bg-emerald-600' : d.avgCoverage > 30 ? 'bg-amber-500' : 'bg-red-400'}`} style={{width:`${Math.max(d.avgCoverage,2)}%`}}/>
                </div>
                <span className="text-[13px] text-muted-foreground w-12 text-right">{Math.round(d.avgCoverage)}%</span>
                <span className="text-xs text-muted-foreground w-20">{d.sessionCount} sessions</span>
              </div>
            ))}
            {coverage.length === 0 && <p className="text-[13px] text-muted-foreground">No department data yet</p>}
          </div>
        </div>
      </div>
      <div className="bg-white border border-border p-5">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-4">Employees Leaving Without Coverage</h3>
        <div className="space-y-3">
          {gaps.map((e: any, i: number) =>(
            <div key={i} className="flex items-center justify-between text-[13px]">
              <div><span className="font-medium">{e.name}</span><span className="text-muted-foreground ml-2">{e.department}</span></div>
              <span className="text-xs text-red-600">{e.exitDate}</span>
            </div>
          ))}
          {gaps.length === 0 && <p className="text-[13px] text-muted-foreground">All employees have coverage</p>}
        </div>
      </div>
    </div>
  );
}