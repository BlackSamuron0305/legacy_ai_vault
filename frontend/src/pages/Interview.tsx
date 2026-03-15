import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, Loader2, Square } from "lucide-react";
import { api } from "@/lib/api";

const WIDGET_AGENT_ID = "agent_8901kkq04wagefmr6qtbvw8ab0z2";
const WIDGET_SCRIPT_URL = "https://unpkg.com/@elevenlabs/convai-widget-embed";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "agent-id": string;
          variant?: string;
        },
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
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-white shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="info" className="text-xs">Live Session</Badge>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {employeeName} — {employeeRole || "Offboarding Interview"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>
          <button
            className="h-8 px-3 bg-red-600 text-white text-[13px] font-medium flex items-center gap-1.5 hover:bg-red-700 transition-colors disabled:opacity-60"
            onClick={handleEndAndProcess}
            disabled={ending}
          >
            {ending
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Ending...</>
              : <><Square className="w-3.5 h-3.5" /> End & Process</>}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Interview Area — ElevenLabs Widget */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-foreground/[0.01]">
          <div ref={widgetContainerRef} className="w-full max-w-2xl">
            <elevenlabs-convai agent-id={WIDGET_AGENT_ID} variant="full" />
          </div>
        </div>

        {/* Sidebar: Session Info */}
        <div className="w-72 border-l border-border bg-white overflow-y-auto shrink-0">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Session Runtime</h3>
            <p className="text-xs text-muted-foreground mt-1">Live session details</p>
          </div>
          <div className="p-4 space-y-3 text-[13px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Interviewee</span><span className="font-medium">{employeeName}</span></div>
            {employeeRole && <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium">{employeeRole}</span></div>}
            {department && <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="font-medium">{department}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Elapsed</span><span className="font-medium">{formatElapsed(elapsedSeconds)}</span></div>
          </div>
          <div className="p-4 border-t border-border">
            <div className="p-3 bg-foreground/[0.03] border border-dashed border-border">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-snug">
                  The transcript is automatically fetched from ElevenLabs when you end the session. Click <strong>End &amp; Process</strong> to trigger AI report generation.
                </p>
              </div>
            </div>
            <Link to={`/app/sessions/${id}`} className="w-full mt-3 h-8 border border-border text-[13px] font-medium flex items-center justify-center hover:bg-foreground/[0.04] transition-colors">Back to Session</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
