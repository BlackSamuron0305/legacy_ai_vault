import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { useConversation } from "@elevenlabs/react";

const WIDGET_AGENT_ID = "agent_8901kkq04wagefmr6qtbvw8ab0z2";

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DemoSession() {
  const [params] = useSearchParams();
  const name = params.get("name") || "Demo User";
  const scenario = params.get("scenario") || "offboarding";
  const role = params.get("role") || "Senior Engineer";
  const department = params.get("department") || "Engineering";

  const isOffboarding = scenario === "offboarding";

  const [elapsed, setElapsed] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const conversation = useConversation({
    onModeChange: ({ mode }) => {
      setIsSpeaking(mode === "speaking");
    },
  });

  const callActive = conversation.status === "connected";

  // Timer
  useEffect(() => {
    if (!callActive) return;
    const interval = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [callActive]);

  const handleStart = async () => {
    try {
      await conversation.startSession({ agentId: WIDGET_AGENT_ID } as any);
    } catch {
      // User denied mic or connection failed
    }
  };

  const handleEnd = async () => {
    await conversation.endSession();
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/demo" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <Badge variant={isOffboarding ? "destructive" : "success"} className="text-xs">
              {isOffboarding ? "Offboarding" : "Onboarding"} Demo
            </Badge>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {name} — {role}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatElapsed(elapsed)}</span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/demo">End Demo</Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Area */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center bg-foreground/[0.01] p-6">
          {/* Welcome banner */}
          <div className="w-full max-w-2xl mb-6">
            <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isOffboarding ? "bg-red-50" : "bg-emerald-50"
                }`}>
                  <Volume2 className={`w-6 h-6 ${isOffboarding ? "text-red-500" : "text-emerald-500"}`} />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-lg">
                    {isOffboarding
                      ? `${name}, we're sorry to see you go.`
                      : `Welcome aboard, ${name}!`}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {isOffboarding
                      ? `The AI interviewer would like to capture your knowledge as ${role} before you leave. It will greet you briefly and ask a few questions.`
                      : `The AI interviewer will welcome you as a new ${role} and help you get started. Just listen in!`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audio interaction area */}
          <div className="w-full max-w-2xl flex flex-col items-center gap-6">
            <div className={[
              "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300",
              callActive
                ? isSpeaking
                  ? "bg-primary/10 ring-4 ring-primary/30 animate-pulse"
                  : "bg-emerald-50 ring-4 ring-emerald-200"
                : "bg-muted",
            ].join(" ")}>
              {callActive ? (
                <Mic className="w-10 h-10 text-emerald-600" />
              ) : (
                <MicOff className="w-10 h-10 text-muted-foreground" />
              )}
            </div>

            <button
              type="button"
              onClick={callActive ? handleEnd : handleStart}
              disabled={conversation.status === "connecting"}
              className={[
                "px-6 py-3 rounded-lg text-sm font-semibold transition-all",
                conversation.status === "connecting"
                  ? "bg-muted text-foreground"
                  : callActive
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
              ].join(" ")}
            >
              {conversation.status === "connecting" ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</span>
              ) : callActive ? (
                "End Conversation"
              ) : (
                "Start Conversation"
              )}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l border-border bg-white overflow-y-auto shrink-0 hidden md:block">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Demo Session</h3>
            <p className="text-xs text-muted-foreground mt-1">Simplified version</p>
          </div>
          <div className="p-4 space-y-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">{role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium">{department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scenario</span>
              <span className="font-medium">{isOffboarding ? "Offboarding" : "Onboarding"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{formatElapsed(elapsed)}</span>
            </div>
          </div>

          <div className="p-4 border-t border-border space-y-3">
            <div className={`p-3 rounded-xl ${isOffboarding ? "bg-red-50" : "bg-emerald-50"}`}>
              <p className="text-xs font-semibold text-foreground mb-1">
                {isOffboarding ? "Offboarding Interview" : "Onboarding Welcome"}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isOffboarding
                  ? "The bot will greet you, acknowledge your departure and begin the knowledge capture process."
                  : "The bot will welcome you and give you a brief introduction to your new role."}
              </p>
            </div>

            <div className="p-3 bg-foreground/[0.03] border border-dashed border-border rounded-xl">
              <p className="text-xs text-muted-foreground leading-snug">
                <strong>Demo mode:</strong> This is a simplified version. In the full version, the entire conversation is transcribed and processed into structured knowledge.
              </p>
            </div>

            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/demo">&larr; Back to selection</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
