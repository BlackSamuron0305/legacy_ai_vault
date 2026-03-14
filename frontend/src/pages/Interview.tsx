import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Pause, Square, Clock, AlertCircle, Loader2, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useConversation } from "@elevenlabs/react";

type ConversationTurn = {
  role: "agent" | "user";
  message: string;
  timestamp: string;
};

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

function mapFrequenciesToBars(data: Uint8Array | undefined, count = 60): number[] {
  if (!data || data.length === 0) return Array.from({ length: count }, () => 12);

  const step = Math.max(1, Math.floor(data.length / count));
  const bars: number[] = [];

  for (let i = 0; i < count; i++) {
    const start = i * step;
    const end = Math.min(data.length, start + step);
    let sum = 0;
    for (let j = start; j < end; j++) sum += data[j];
    const avg = end > start ? sum / (end - start) : 0;
    const scaled = Math.max(8, Math.min(100, (avg / 255) * 100));
    bars.push(scaled);
  }

  return bars;
}

export default function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recording, setRecording] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [ending, setEnding] = useState(false);
  const [inputBars, setInputBars] = useState<number[]>(Array.from({ length: 60 }, () => 12));
  const [outputBars, setOutputBars] = useState<number[]>(Array.from({ length: 60 }, () => 12));

  const conversation = useConversation({
    micMuted,
    onConnect: ({ conversationId: connectedId }) => {
      setConversationId(connectedId);
      setRecording(true);
    },
    onMessage: ({ role, message }) => {
      const resolvedRole = role === "agent" ? "agent" : "user";
      setTurns((prev) => [
        ...prev,
        {
          role: resolvedRole,
          message,
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        },
      ]);
    },
    onError: (message) => {
      setSessionError(message || "Failed to communicate with ElevenLabs conversation service");
    },
  });

  const transcriptText = useMemo(() => {
    return turns
      .map((t) => `[${t.timestamp}] ${t.role === "agent" ? "AI" : "Employee"}: ${t.message}`)
      .join("\n");
  }, [turns]);

  useEffect(() => {
    let active = true;

    async function initializeSession() {
      if (!id) {
        setSessionError("Missing session id");
        setSessionLoading(false);
        return;
      }

      try {
        setSessionLoading(true);
        setSessionError(null);

        // 1) Mark session as in progress
        await api.startSession(id);

        // 2) Fetch signed URL from backend -> AI service -> ElevenLabs
        const tokenResponse = await api.getSessionToken(id);
        if (!active) return;

        const signed = tokenResponse.signed_url;
        setSignedUrl(signed);

        // 3) Start live ElevenLabs conversation from signed URL
        const liveConversationId = await conversation.startSession({
          signedUrl: signed,
          connectionType: "websocket",
        });
        if (!active) return;

        setConversationId(liveConversationId);
      } catch (error: any) {
        if (!active) return;
        setSessionError(error?.message || "Failed to initialize interview session");
      } finally {
        if (!active) return;
        setSessionLoading(false);
      }
    }

    initializeSession();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (conversation.status !== "connected") return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [conversation.status]);

  useEffect(() => {
    if (conversation.status !== "connected") return;

    let frameId = 0;
    const renderWaveform = () => {
      const input = conversation.getInputByteFrequencyData();
      const output = conversation.getOutputByteFrequencyData();
      setInputBars(mapFrequenciesToBars(input));
      setOutputBars(mapFrequenciesToBars(output));
      frameId = window.requestAnimationFrame(renderWaveform);
    };

    frameId = window.requestAnimationFrame(renderWaveform);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [conversation.status]);

  const handleToggleRecording = () => {
    setMicMuted((prev) => !prev);
    setRecording((prev) => !prev);
  };

  const handleEndAndProcess = async () => {
    if (!id) return;

    try {
      setEnding(true);

      if (conversation.status === "connected" || conversation.status === "connecting") {
        await conversation.endSession();
      }

      await api.endSession(id, {
        transcript: transcriptText,
        duration: formatDuration(elapsedSeconds),
        elevenlabsConversationId: conversationId || conversation.getId(),
      });

      navigate(`/app/sessions/${id}/processing`);
    } catch (error: any) {
      setSessionError(error?.message || "Failed to end and process interview session");
    } finally {
      setEnding(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Initializing interview session...</div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="max-w-md text-center space-y-3">
          <p className="text-sm text-destructive">{sessionError}</p>
          <Button asChild variant="outline">
            <Link to={`/app/sessions/${id}`}>Back to Session</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="info" className="text-xs">Live Session</Badge>
            {signedUrl ? <Badge variant="secondary" className="text-xs">ElevenLabs Auth Ready</Badge> : null}
            <Badge variant="outline" className="text-xs">{conversation.status}</Badge>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Engineering Lead Offboarding</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Conversation: {conversationId || "pending"}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleToggleRecording} disabled={conversation.status !== "connected"}>
            {recording ? <><Pause className="w-4 h-4" /> Pause</> : <><Mic className="w-4 h-4" /> Resume</>}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleEndAndProcess} disabled={ending}>
            {ending ? <><Loader2 className="w-4 h-4 animate-spin" /> Ending...</> : <><Square className="w-4 h-4" /> End & Process</>}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Interview Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Waveform */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                    <Mic className="w-6 h-6 text-primary-foreground" />
                  </div>
                  {recording && (
                    <div className="absolute inset-0 w-14 h-14 rounded-full bg-primary/30 animate-pulse-ring" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {recording && <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />}
                    <span className="text-sm font-medium">{recording ? 'Recording in progress' : 'Paused'}</span>
                  </div>
                  {/* Waveform visualization */}
                  <div className="flex items-center gap-0.5 h-8">
                    {inputBars.map((h, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-primary/40"
                        style={{
                          height: `${recording ? h : 12}%`,
                          transition: 'height 0.15s ease',
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Input {Math.round(conversation.getInputVolume() * 100)}%</span>
                    <span>·</span>
                    <span>Output {Math.round(conversation.getOutputVolume() * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Output Waveform */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-4">
              <p className="text-xs text-muted-foreground mb-2">Agent audio output</p>
              <div className="flex items-center gap-0.5 h-8">
                {outputBars.map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-success/50"
                    style={{
                      height: `${h}%`,
                      transition: 'height 0.15s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Conversation */}
            <div className="space-y-4">
              {turns.length === 0 ? (
                <div className="rounded-2xl border border-border p-5 bg-muted/30 text-sm text-muted-foreground">
                  Waiting for first exchange...
                </div>
              ) : turns.slice(-20).map((seg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`rounded-2xl border border-border p-5 ${
                    seg.role === 'agent' ? 'bg-card shadow-card' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {seg.role === 'agent' ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">LegacyAI</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center">SJ</div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sarah Jenkins</span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto font-mono">{seg.timestamp}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${seg.role === 'agent' ? 'text-foreground' : 'text-foreground/80'}`}>
                    "{seg.message}"
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Live transcription */}
            {recording && (
              <div className="opacity-60 space-y-2 pl-4 border-l-2 border-primary/20">
                <p className="text-sm italic text-muted-foreground">Conversation mode: {conversation.isSpeaking ? 'Agent speaking' : 'Listening'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Session State */}
        <div className="w-72 border-l border-border bg-card overflow-y-auto shrink-0">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Session Runtime</h3>
            <p className="text-xs text-muted-foreground mt-1">Live voice state and completion details</p>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium">{conversation.status}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span className="font-medium">{conversation.isSpeaking ? 'speaking' : 'listening'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Elapsed</span><span className="font-medium">{formatElapsed(elapsedSeconds)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Messages</span><span className="font-medium">{turns.length}</span></div>
          </div>
          <div className="p-4 border-t border-border">
            <div className="p-3 bg-muted/50 rounded-xl border border-dashed border-border">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-snug">
                  On "End & Process", the app posts to the backend end-session endpoint, which triggers Python transcript/report processing and moves you to the processing screen.
                </p>
              </div>
            </div>
            <Button className="w-full mt-3" variant="outline" asChild>
              <Link to={`/app/sessions/${id}`}>Back to Session</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}