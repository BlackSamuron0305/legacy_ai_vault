import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Edit3, Flag, Loader2, RotateCcw, Save, Shield } from "lucide-react";
import { TranscriptReviewSkeleton } from "@/components/skeletons";
import { useApproveTranscript, useSession, useSessionTopics } from "@/hooks/useApi";

type ParsedSegment = {
  timestamp: string;
  speaker: "ai" | "employee";
  text: string;
};

function parseTranscriptToSegments(transcript?: string | null): ParsedSegment[] {
  if (!transcript) return [];
  return transcript
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(AI|Employee):\s*(.+)$/i);
      if (match) {
        return {
          timestamp: match[1],
          speaker: match[2].toLowerCase() === "ai" ? "ai" : "employee",
          text: match[3],
        };
      }

      const fallback = line.match(/^(Agent|User):\s*(.+)$/i);
      if (fallback) {
        return {
          timestamp: "--:--:--",
          speaker: fallback[1].toLowerCase() === "agent" ? "ai" : "employee",
          text: fallback[2],
        };
      }

      return {
        timestamp: "--:--:--",
        speaker: "employee",
        text: line,
      };
    });
}

export default function TranscriptReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: session, isLoading } = useSession(id || "");
  const { data: extractedTopics = [] } = useSessionTopics(id || "");
  const approveTranscript = useApproveTranscript();

  const [showConfirm, setShowConfirm] = useState(false);

  const transcriptSegments = useMemo(() => parseTranscriptToSegments(session?.transcript), [session?.transcript]);

  const handleApprove = async () => {
    if (!id) return;
    await approveTranscript.mutateAsync(id);
    navigate(`/app/sessions/${id}/processing`);
  };

  if (isLoading || !session) {
    return <TranscriptReviewSkeleton />;
  }

  if (showConfirm) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-border p-8 space-y-6">
          <div className="w-12 h-12 bg-foreground/[0.06] flex items-center justify-center text-foreground">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Approve transcript for processing?</h2>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
              Once approved, the system will begin structuring knowledge, generating categories, and preparing outputs from this transcript.
            </p>
          </div>
          <div className="bg-foreground/[0.03] border border-border p-4 space-y-2">
            <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Transcript segments</span><span className="font-medium">{transcriptSegments.length}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Topics detected</span><span className="font-medium">{extractedTopics.length}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Duration</span><span className="font-medium">{session.duration || "—"}</span></div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">Confirming approval sends this session through final post-processing lifecycle.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 h-9 border border-border text-[13px] font-medium hover:bg-foreground/[0.04] transition-colors" onClick={() => setShowConfirm(false)}>Go Back & Review</button>
            <button className="flex-1 h-9 bg-foreground text-background text-[13px] font-medium flex items-center justify-center gap-1.5 disabled:opacity-60 hover:bg-foreground/90 transition-colors" onClick={handleApprove} disabled={approveTranscript.isPending}>
              {approveTranscript.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Confirm & Process
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Transcript Panel */}
      <div className="flex-1 overflow-y-auto">
        {/* Status Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <div>
            <p className="text-[13px] font-medium">Transcript captured — awaiting your review</p>
            <p className="text-xs text-muted-foreground">No knowledge extraction will happen until this transcript is approved.</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto py-8 px-6">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="warning">Step 2: Review</Badge>
            <h1 className="text-xl font-semibold">Verify Knowledge Capture</h1>
          </div>

          {transcriptSegments.length === 0 ? (
            <div className="border border-border p-6 text-[13px] text-muted-foreground">
              Transcript is not ready yet. Return after processing completes.
            </div>
          ) : null}

          <div className="space-y-4">
            {transcriptSegments.map((seg, i) => (
              <div key={i} className="group relative">
                <div className={`border p-4 transition-colors ${
                  'border-border hover:border-foreground/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono px-1.5 py-0.5 bg-foreground/[0.06] text-muted-foreground">{seg.timestamp}</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {seg.speaker === 'ai' ? 'LegacyAI' : 'Sarah Jenkins'}
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-foreground">{seg.text}</p>
                </div>
                <div className="absolute right-2 top-2 hidden group-hover:flex gap-1">
                  <button className="p-1.5 bg-white border border-border hover:bg-foreground/[0.04] text-muted-foreground"><Edit3 className="w-3 h-3" /></button>
                  <button className="p-1.5 bg-white border border-border hover:bg-foreground/[0.04] text-muted-foreground"><Flag className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-border bg-white flex flex-col shrink-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Session Info</h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Employee</span><span className="font-medium">{session.employeeName || 'Employee'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span>{session.employeeRole || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{session.duration || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Segments</span><span>{transcriptSegments.length}</span></div>
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">AI Confidence Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">AI processing status</span>
                <span className="text-emerald-600 font-medium">{session.reportStatus || 'pending'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Draft Extractions</h3>
            <div className="space-y-2">
              {extractedTopics.slice(0, 6).map((t) => (
                <div key={t.name} className="px-3 py-2 border border-border bg-foreground/[0.03] text-[13px]">
                  <span className="font-medium">{t.name}</span>
                  <p className="text-xs text-muted-foreground">{t.category}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            No data will be committed to the Knowledge Base until you approve this transcript.
          </p>
          <button className="w-full h-10 bg-foreground text-background text-[13px] font-medium flex items-center justify-center gap-1.5 hover:bg-foreground/90 transition-colors" onClick={() => setShowConfirm(true)}>
            <CheckCircle2 className="w-4 h-4" /> Approve & Process
          </button>
          <div className="grid grid-cols-2 gap-2">
            <Link to={`/app/sessions/${id}/interview`} className="h-8 border border-border text-[13px] font-medium flex items-center justify-center gap-1 hover:bg-foreground/[0.04] transition-colors"><RotateCcw className="w-3 h-3" /> Re-record</Link>
            <button className="h-8 border border-border text-[13px] text-muted-foreground font-medium flex items-center justify-center gap-1 hover:bg-foreground/[0.04] transition-colors"><Save className="w-3 h-3" /> Save Draft</button>
          </div>
        </div>
      </div>
    </div>
  );
}