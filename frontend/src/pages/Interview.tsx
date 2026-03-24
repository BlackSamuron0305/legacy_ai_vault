import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, Mic, MicOff, Pause, Play } from "lucide-react";
import { api } from "@/lib/api";
import { useConversation } from "@elevenlabs/react";

const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_8901kkq04wagefmr6qtbvw8ab0z2";

interface TranscriptEntry {
  speaker: "ai" | "employee";
  text: string;
  timestamp: string;
}

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sessionError, setSessionError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  // Live transcript state
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const segmentQueueRef = useRef<TranscriptEntry[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const conversation = useConversation({
    onConnect: ({ conversationId: cid }) => {
      if (cid) {
        conversationIdRef.current = cid;
        setConversationId(cid);
      }
    },
    onDisconnect: () => {},
    onMessage: ({ message, source }) => {
      const entry: TranscriptEntry = {
        speaker: source === "ai" ? "ai" : "employee",
        text: message,
        timestamp: new Date().toISOString().slice(11, 19),
      };
      setTranscript((prev) => [...prev, entry]);
      // Queue for backend flush
      segmentQueueRef.current.push(entry);
    },
    onModeChange: ({ mode }) => {
      setIsSpeaking(mode === "speaking");
    },
    onError: (error) => {
      console.error("ElevenLabs conversation error:", error);
      setSessionError("Conversation error. Please try again.");
    },
  });

  const callActive = conversation.status === "connected";

  // Auto-scroll transcript panel
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Elapsed timer (pauses when paused)
  useEffect(() => {
    if (!callActive || paused) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [callActive, paused]);

  // Flush queued segments to backend every 10s for parallel processing
  useEffect(() => {
    if (!callActive || !id) return;
    flushTimerRef.current = setInterval(() => {
      const queue = segmentQueueRef.current;
      if (queue.length === 0) return;
      const batch = queue.splice(0);
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("auth_token") || "";
      for (const seg of batch) {
        fetch(`${apiBase}/sessions/${id}/transcript/segment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(seg),
        }).catch(() => {});
      }
    }, 10_000);
    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    };
  }, [callActive, id]);

  const handleStart = useCallback(async () => {
    if (!id) return;
    try {
      setSessionError(null);
      await api.startSession(id);

      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const tokenRes = await fetch(`${apiBase}/sessions/${id}/token`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
        },
      });

      let connectionOpts: Parameters<typeof conversation.startSession>[0];

      if (tokenRes.ok) {
        const { signed_url } = await tokenRes.json();
        connectionOpts = { signedUrl: signed_url };
      } else {
        connectionOpts = { agentId: ELEVENLABS_AGENT_ID } as any;
      }

      await conversation.startSession(connectionOpts);
    } catch (error: any) {
      setSessionError(error?.message ?? "Failed to start session");
    }
  }, [id, conversation]);

  const handlePauseResume = useCallback(async () => {
    if (!id) return;
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
    const token = localStorage.getItem("auth_token") || "";
    try {
      if (paused) {
        // Resume: restore agent volume
        conversation.setVolume({ volume: 1 });
        await fetch(`${apiBase}/sessions/${id}/resume`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setPaused(false);
      } else {
        // Pause: mute agent output (user stops hearing responses)
        conversation.setVolume({ volume: 0 });
        await fetch(`${apiBase}/sessions/${id}/pause`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setPaused(true);
      }
    } catch (error: any) {
      setSessionError(error?.message ?? "Failed to pause/resume");
    }
  }, [id, paused, conversation]);

  const handleEnd = useCallback(async () => {
    if (!id) return;
    try {
      setEnding(true);

      // Flush remaining segments
      const remaining = segmentQueueRef.current.splice(0);
      if (remaining.length > 0) {
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
        const token = localStorage.getItem("auth_token") || "";
        for (const seg of remaining) {
          fetch(`${apiBase}/sessions/${id}/transcript/segment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(seg),
          }).catch(() => {});
        }
      }

      await conversation.endSession();

      const finalConversationId = conversationIdRef.current;
      const duration = formatDuration(elapsedSeconds);

      // Build a full transcript text from captured messages
      const fullTranscript = transcript
        .map((e) => `[${e.timestamp}] ${e.speaker === "ai" ? "AI" : "Employee"}: ${e.text}`)
        .join("\n");

      await api.endSession(id, {
        transcript: fullTranscript,
        duration,
        elevenlabsConversationId: finalConversationId || undefined,
      });

      setShowThankYou(true);
    } catch (error: any) {
      setSessionError(error?.message ?? "Failed to end session");
    } finally {
      setEnding(false);
    }
  }, [id, conversation, elapsedSeconds, transcript]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-xs">Interview</Badge>
          {callActive && <Badge variant="secondary" className="text-xs">Live</Badge>}
          {paused && <Badge variant="destructive" className="text-xs">Paused</Badge>}
          {isSpeaking && !paused && <Badge variant="outline" className="text-xs animate-pulse">Agent speaking</Badge>}
          <span className="text-xs text-muted-foreground">Conversation: {conversationId || "—"}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>
          <Link to={`/app/sessions/${id}`} className="text-[13px] font-medium text-muted-foreground hover:text-foreground">Back to Session</Link>
        </div>
      </div>

      {sessionError && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-2 flex items-center justify-between shrink-0">
          <p className="text-xs text-destructive">{sessionError}</p>
          <button className="text-xs text-destructive underline ml-4" onClick={() => setSessionError(null)}>Dismiss</button>
        </div>
      )}

      {/* Main content: two-panel layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel: Audio indicator + controls */}
        <div className="w-1/3 min-w-[280px] flex flex-col items-center justify-center border-r border-border p-6 gap-6">
          {/* Visual audio indicator */}
          <div className={[
            "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300",
            paused
              ? "bg-yellow-50 ring-4 ring-yellow-300"
              : callActive
                ? isSpeaking
                  ? "bg-primary/10 ring-4 ring-primary/30 animate-pulse"
                  : "bg-emerald-50 ring-4 ring-emerald-200"
                : "bg-muted",
          ].join(" ")}>
            {paused ? (
              <Pause className="w-10 h-10 text-yellow-600" />
            ) : callActive ? (
              <Mic className={`w-10 h-10 ${isSpeaking ? "text-primary" : "text-emerald-600"}`} />
            ) : (
              <MicOff className="w-10 h-10 text-muted-foreground" />
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {paused
              ? "Interview paused. Click Resume to continue."
              : callActive
                ? isSpeaking
                  ? "Agent is speaking..."
                  : "Listening — speak when ready."
                : "Click Start to begin the interview."}
          </p>

          <div className="flex gap-3">
            {/* Start / End button */}
            <button
              type="button"
              onClick={callActive ? handleEnd : handleStart}
              disabled={ending || conversation.status === "connecting"}
              className={[
                "w-20 h-20 rounded-full flex items-center justify-center text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none",
                ending || conversation.status === "connecting"
                  ? "bg-muted text-foreground"
                  : callActive
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
              ].join(" ")}
            >
              {ending || conversation.status === "connecting" ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : callActive ? "End" : "Start"}
            </button>

            {/* Pause / Resume button */}
            {callActive && (
              <button
                type="button"
                onClick={handlePauseResume}
                className={[
                  "w-20 h-20 rounded-full flex items-center justify-center text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95",
                  paused
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-yellow-500 text-white hover:bg-yellow-600",
                ].join(" ")}
              >
                {paused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>

        {/* Right panel: Live Transcript */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
          <div className="px-4 py-3 border-b border-border bg-white shrink-0">
            <h3 className="text-sm font-semibold">Live Transcript</h3>
            <p className="text-xs text-muted-foreground">{transcript.length} messages captured</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {transcript.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-8">
                Transcript will appear here as the interview progresses...
              </p>
            )}
            {transcript.map((entry, idx) => (
              <div key={idx} className={`flex flex-col ${entry.speaker === "ai" ? "items-start" : "items-end"}`}>
                <span className="text-[10px] text-muted-foreground mb-0.5">
                  {entry.speaker === "ai" ? "Agent" : "Employee"} · {entry.timestamp}
                </span>
                <div className={[
                  "px-3 py-2 rounded-lg text-sm max-w-[85%] leading-relaxed",
                  entry.speaker === "ai"
                    ? "bg-white border border-border text-foreground"
                    : "bg-primary text-primary-foreground",
                ].join(" ")}>
                  {entry.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>

      {/* Thank you modal */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white border border-border rounded-lg p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Interview complete</Badge>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Thanks for sharing your knowledge</h2>
              <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                We&apos;re processing the conversation transcript. {transcript.length} messages were captured in real-time.
                Next, you&apos;ll be able to review and refine the transcript.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowThankYou(false)}>
                Stay on interview
              </Button>
              <Button size="sm" onClick={() => { if (id) navigate(`/app/sessions/${id}/review`); }}>
                Go to transcript review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
