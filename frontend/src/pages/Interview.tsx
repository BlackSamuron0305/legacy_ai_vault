import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, Loader2, Square, Mic } from "lucide-react";
import { api } from "@/lib/api";

const WIDGET_AGENT_ID = "agent_8901kkq04wagefmr6qtbvw8ab0z2";
const WIDGET_SCRIPT_URL = "https://unpkg.com/@elevenlabs/convai-widget-embed";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { "agent-id": string },
        HTMLElement
      >;
    }
  }
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

  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [ending, setEnding] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [employeeName, setEmployeeName] = useState("Employee");
  const [employeeRole, setEmployeeRole] = useState("");
  const [department, setDepartment] = useState("");
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  // Load the widget script and create the custom element
  useEffect(() => {
    if (!document.querySelector(`script[src="${WIDGET_SCRIPT_URL}"]`)) {
      const script = document.createElement("script");
      script.src = WIDGET_SCRIPT_URL;
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      const widgets = document.querySelectorAll("elevenlabs-convai");
      widgets.forEach((w) => w.remove());
    };
  }, []);

  // Initialize the session
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

        await api.startSession(id);
        const sessionData = await api.getSession(id);

        if (active) {
          setEmployeeName(sessionData?.employeeName || "Employee");
          setEmployeeRole(sessionData?.employeeRole || "");
          setDepartment(sessionData?.department || "");
          setSessionStarted(true);
        }
      } catch (error: any) {
        if (!active) return;
        setSessionError(error?.message || "Failed to initialize interview session");
      } finally {
        if (active) setSessionLoading(false);
      }
    }

    initializeSession();
    return () => { active = false; };
  }, [id]);

  // Elapsed time timer
  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted]);

  const handleEndAndProcess = async () => {
    if (!id) return;

    try {
      setEnding(true);

      await api.endSession(id, {
        transcript: "",
        duration: formatDuration(elapsedSeconds),
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
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Initializing interview session...
        </div>
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
            <Badge variant="secondary" className="text-xs">Voice Widget</Badge>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {employeeName} — {employeeRole || "Offboarding Interview"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {department ? `${department} · ` : ""}Session {id?.slice(0, 8)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndAndProcess}
            disabled={ending}
          >
            {ending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Ending...</>
              : <><Square className="w-4 h-4" /> End &amp; Process</>}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Interview Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Status Card */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Interview in Progress</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the voice widget in the bottom-right corner to conduct the interview with {employeeName}.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">
                  Recording · {formatElapsed(elapsedSeconds)}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-muted/30 rounded-2xl border border-border p-6 space-y-3">
              <h3 className="text-sm font-semibold">How it works</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 mt-0.5 shrink-0">1</span>
                  Click the voice widget bubble in the bottom-right corner to start speaking.
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 mt-0.5 shrink-0">2</span>
                  The AI interviewer will guide the conversation through key knowledge areas.
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 mt-0.5 shrink-0">3</span>
                  When finished, click <strong>End &amp; Process</strong> above. The transcript will be fetched from ElevenLabs and processed automatically.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l border-border bg-card overflow-y-auto shrink-0">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Session Runtime</h3>
            <p className="text-xs text-muted-foreground mt-1">Live session details</p>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interviewee</span>
              <span className="font-medium">{employeeName}</span>
            </div>
            {employeeRole && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{employeeRole}</span>
              </div>
            )}
            {department && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium">{department}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Elapsed</span>
              <span className="font-medium">{formatElapsed(elapsedSeconds)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              <span className="font-medium">Voice Widget</span>
            </div>
          </div>
          <div className="p-4 border-t border-border">
            <div className="p-3 bg-muted/50 rounded-xl border border-dashed border-border">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-snug">
                  The transcript is automatically fetched from ElevenLabs when you end the session. Click <strong>End &amp; Process</strong> to trigger AI report generation.
                </p>
              </div>
            </div>
            <Button className="w-full mt-3" variant="outline" asChild>
              <Link to={`/app/sessions/${id}`}>Back to Session</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ElevenLabs Conversational AI Widget */}
      <div ref={widgetContainerRef}>
        <elevenlabs-convai agent-id={WIDGET_AGENT_ID} />
      </div>
    </div>
  );
}
