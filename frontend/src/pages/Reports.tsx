import { Link } from "react-router-dom";
import { useReports } from "@/hooks/useApi";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FileText, Download, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Reports() {
  const { data: reports = [], isLoading } = useReports();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Generated knowledge outputs and handover documentation</p>
      </div>

      <div className="bg-white border border-border overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Report</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Employee</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Type</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Export</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Updated</th>
              <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-foreground/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <Link to={`/app/reports/${r.id}`} className="flex items-center gap-2 font-medium text-foreground hover:underline underline-offset-4">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    {r.title}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{r.employee}</td>
                <td className="px-5 py-3 text-muted-foreground">{r.type}</td>
                <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-5 py-3"><StatusBadge status={r.exportStatus} /></td>
                <td className="px-5 py-3 text-muted-foreground text-xs">{r.lastUpdated}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <Link to={`/app/reports/${r.id}`} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-3.5 h-3.5" /></Link>
                    <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Download className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}