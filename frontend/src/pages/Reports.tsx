import { Link } from "react-router-dom";
import { reports } from "@/data/mockData";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Reports() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Generated knowledge outputs and handover documentation</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">Report</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Employee</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Export</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Updated</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="p-3">
                  <Link to={`/app/reports/${r.id}`} className="flex items-center gap-2 font-medium text-foreground hover:text-primary">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {r.title}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{r.employee}</td>
                <td className="p-3 text-muted-foreground">{r.type}</td>
                <td className="p-3"><StatusBadge status={r.status} /></td>
                <td className="p-3"><StatusBadge status={r.exportStatus} /></td>
                <td className="p-3 text-muted-foreground text-xs">{r.lastUpdated}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link to={`/app/reports/${r.id}`}><Eye className="w-3.5 h-3.5" /></Link></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-3.5 h-3.5" /></Button>
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