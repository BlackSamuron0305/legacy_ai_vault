import { useState } from "react";
import { Link } from "react-router-dom";
import { useReports } from "@/hooks/useApi";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FileText, Download, Eye, Loader2, Search } from "lucide-react";
import { ReportsSkeleton } from "@/components/skeletons";
import { api } from "@/lib/api";

export default function Reports() {
  const { data: reports = [], isLoading } = useReports();
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = reports.filter((r: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.employee?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q) ||
      r.type?.toLowerCase().includes(q)
    );
  });

  const handleDownload = async (report: any) => {
    const id = report.sessionId || report.id;
    if (!id || report.source === 'report') return;
    setDownloadingId(report.id);
    try {
      if (!report.hasPdf) {
        await api.generateSessionPdf(report.sessionId);
      }
      const { pdfUrl } = await api.getSessionReportUrls(report.sessionId);
      if (pdfUrl) {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      // fall back to opening the HTML report
      window.open(`/app/sessions/${report.sessionId}/report`, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const getViewLink = (report: any) => {
    if (report.source === 'session' && report.sessionId) {
      return `/app/sessions/${report.sessionId}/report`;
    }
    return `/app/reports/${report.id}`;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            All generated knowledge capture reports
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} report{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, employee, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 border border-border bg-white text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-border p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-[13px] text-muted-foreground">
            {reports.length === 0
              ? "No reports generated yet. Complete a session to generate your first report."
              : "No reports match your search."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.02]">
                <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">
                  Report
                </th>
                <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">
                  Employee
                </th>
                <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-foreground/[0.02] transition-colors"
                >
                  <td className="px-5 py-3">
                    <Link
                      to={getViewLink(r)}
                      className="flex items-center gap-2.5 font-medium text-foreground hover:underline underline-offset-4"
                    >
                      <div className="w-8 h-8 bg-foreground/[0.06] flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate max-w-[280px]">{r.title}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-foreground">{r.employee}</p>
                      {r.department && (
                        <p className="text-xs text-muted-foreground">{r.department}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{r.type}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {formatDate(r.lastUpdated || r.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <Link
                        to={getViewLink(r)}
                        className="h-8 px-3 flex items-center gap-1.5 text-[12px] font-medium border border-border hover:bg-foreground/[0.04] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Open
                      </Link>
                      {r.source === "session" && r.sessionId && (
                        <button
                          className="h-8 px-3 flex items-center gap-1.5 text-[12px] font-medium border border-border hover:bg-foreground/[0.04] transition-colors disabled:opacity-50"
                          onClick={() => handleDownload(r)}
                          disabled={downloadingId === r.id}
                        >
                          {downloadingId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          PDF
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
