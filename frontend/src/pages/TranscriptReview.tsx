import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Edit3, Flag, Loader2, RefreshCw, RotateCcw, Save, Shield } from "lucide-react";
import { TranscriptReviewSkeleton } from "@/components/skeletons";
import { useApproveTranscript, useSession, useSessionTopics, useSessionTranscript } from "@/hooks/useApi";
import { api } from "@/lib/api";

type Segment = {
  id?: string;
  timestamp: string;
  speaker: "ai" | "employee";
  text: string;
  orderIndex: number;
};

function normalizeSegments(raw: any[]): Segment[] {
  return raw
    .filter((s): s is Record<string, unknown> => s != null && typeof s === "object")
    .map((s: any, i: number) => ({
      id: s.id,
      timestamp: s.timestamp != null ? String(s.timestamp) : "--:--:--",
      speaker: s.speaker === "ai" ? "ai" : "employee",
      text: s.text != null ? String(s.text) : "",
      orderIndex: typeof s.orderIndex === "number" ? s.orderIndex : i,
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

function parseTranscriptText(transcript?: string | null): Segment[] {
  if (transcript == null || typeof transcript !== "string" || !transcript.trim()) return [];
  return transcript
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const m = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(AI|Employee):\s*(.+)$/i);
      if (m) return { timestamp: m[1], speaker: (m[2].toLowerCase() === "ai" ? "ai" : "employee") as "ai" | "employee", text: m[3], orderIndex: i };
      const f = line.match(/^(Agent|User):\s*(.+)$/i);
      if (f) return { timestamp: "--:--:--", speaker: (f[1].toLowerCase() === "agent" ? "ai" : "employee") as "ai" | "employee", text: f[2], orderIndex: i };
      return { timestamp: "--:--:--", speaker: "employee" as const, text: line, orderIndex: i };
    });
}

export default function TranscriptReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: session, isLoading, refetch: refetchSession } = useSession(id || "");
  const { data: dbSegmentsRaw = [], refetch: refetchSegments } = useSessionTranscript(id || "");
  const { data: extractedTopics = [] } = useSessionTopics(id || "");
  const approveTranscript = useApproveTranscript();

  const [showConfirm, setShowConfirm] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [polling, setPolling] = useState(false);

  const dbSegments = useMemo(() => normalizeSegments(Array.isArray(dbSegmentsRaw) ? dbSegmentsRaw : []), [dbSegmentsRaw]);
  const parsedSegments = useMemo(() => parseTranscriptText(session?.transcript), [session?.transcript]);
  const transcriptSegments = dbSegments.length > 0 ? dbSegments : parsedSegments;

  const isProcessing = session?.status === "processing" || session?.transcriptStatus === "pending" || session?.reportStatus === "generating";

  useEffect(() => {
    if (!id || transcriptSegments.length > 0 || !isProcessing) {
      setPolling(false);
      return;
    }
    setPolling(true);
    const interval = setInterval(async () => {
      const segs = await refetchSegments();
      const sess = await refetchSession();
      const newSegs = normalizeSegments(Array.isArray(segs.data) ? segs.data : []);
      const newParsed = parseTranscriptText(sess.data?.transcript);
      if (newSegs.length > 0 || newParsed.length > 0) {
        setPolling(false);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [id, transcriptSegments.length, isProcessing, refetchSegments, refetchSession]);

  const handleReprocess = useCallback(async () => {
    if (!id) return;
    setReprocessing(true);
    try {
      await api.reprocessSession(id);
      setPolling(true);
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const segs = await refetchSegments();
        await refetchSession();
        const newSegs = normalizeSegments(Array.isArray(segs.data) ? segs.data : []);
        if (newSegs.length > 0 || attempts > 20) {
          clearInterval(poll);
          setReprocessing(false);
          setPolling(false);
        }
      }, 5000);
    } catch {
      setReprocessing(false);
    }
  }, [id, refetchSegments, refetchSession]);

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
      <div className="flex-1 overflow-y-auto">
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
            <div className="border border-border p-6 space-y-4">
              <p className="text-[13px] text-muted-foreground">
                {polling || reprocessing
                  ? "Processing transcript... This may take up to a minute. The page will update automatically."
                  : "No transcript data found for this session."}
              </p>
              {(polling || reprocessing) && (
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Waiting for transcript from ElevenLabs...</span>
                </div>
              )}
              {!polling && !reprocessing && (
                <Button variant="outline" size="sm" onClick={handleReprocess} className="gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reprocess transcript
                </Button>
              )}
            </div>
          ) : null}

          <div className="space-y-4">
            {transcriptSegments.map((seg, i) => (
              <div key={seg.id ?? i} className="group relative">
                <div className="border p-4 transition-colors border-border hover:border-foreground/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono px-1.5 py-0.5 bg-foreground/[0.06] text-muted-foreground">{seg.timestamp}</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {seg.speaker === "ai" ? "LegacyAI" : "Employee"}
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

      <div className="w-80 border-l border-border bg-white flex flex-col shrink-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Session Info</h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Employee</span><span className="font-medium">{session.employeeName || "Employee"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span>{session.employeeRole || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{session.duration || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Segments</span><span>{transcriptSegments.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{session.status || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Conversation ID</span><span className="text-[11px] font-mono truncate max-w-[140px]">{session.elevenlabsConversationId || "—"}</span></div>
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">AI Confidence Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">AI processing status</span>
                <span className="text-emerald-600 font-medium">{session.reportStatus || "pending"}</span>
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
          {transcriptSegments.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground text-center">
                No data will be committed to the Knowledge Base until you approve this transcript.
              </p>
              <button className="w-full h-10 bg-foreground text-background text-[13px] font-medium flex items-center justify-center gap-1.5 hover:bg-foreground/90 transition-colors" onClick={() => setShowConfirm(true)}>
                <CheckCircle2 className="w-4 h-4" /> Approve & Process
              </button>
            </>
          ) : (
            <Button
              variant="default"
              className="w-full gap-1.5"
              onClick={handleReprocess}
              disabled={reprocessing}
            >
              {reprocessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {reprocessing ? "Reprocessing..." : "Reprocess transcript"}
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Link to={`/app/sessions/${id}/interview`} className="h-8 border border-border text-[13px] font-medium flex items-center justify-center gap-1 hover:bg-foreground/[0.04] transition-colors"><RotateCcw className="w-3 h-3" /> Re-record</Link>
            <button className="h-8 border border-border text-[13px] text-muted-foreground font-medium flex items-center justify-center gap-1 hover:bg-foreground/[0.04] transition-colors"><Save className="w-3 h-3" /> Save Draft</button>
          </div>
        </div>
      </div>
    </div>
  );
}
