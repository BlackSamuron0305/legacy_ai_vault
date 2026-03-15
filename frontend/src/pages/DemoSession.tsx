import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, Mic, Volume2 } from "lucide-react";

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
  const [widgetReady, setWidgetReady] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Load ElevenLabs widget script
  useEffect(() => {
    if (!document.querySelector(`script[src="${WIDGET_SCRIPT_URL}"]`)) {
      const script = document.createElement("script");
      script.src = WIDGET_SCRIPT_URL;
      script.async = true;
      script.onload = () => setWidgetReady(true);
      document.body.appendChild(script);
    } else {
      setWidgetReady(true);
    }

    return () => {
      const widgets = document.querySelectorAll("elevenlabs-convai");
      widgets.forEach((w) => w.remove());
    };
  }, []);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/demo" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Zurück
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
            <Link to="/demo">Demo beenden</Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main — ElevenLabs Widget */}
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
                      ? `${name}, schade dass du uns verlässt.`
                      : `Willkommen an Bord, ${name}!`}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {isOffboarding
                      ? `Der KI-Interviewer möchte dein Wissen als ${role} sichern, bevor du gehst. Er wird dich kurz begrüßen und ein paar Fragen stellen.`
                      : `Der KI-Interviewer begrüßt dich als neuen ${role} und hilft dir beim Einstieg. Hör einfach zu!`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Widget area */}
          <div ref={widgetRef} className="w-full max-w-2xl">
            {widgetReady ? (
              <elevenlabs-convai agent-id={WIDGET_AGENT_ID} variant="full" />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                <Mic className="w-4 h-4 animate-pulse mr-2" /> KI-Interviewer wird geladen…
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l border-border bg-white overflow-y-auto shrink-0 hidden md:block">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Demo Session</h3>
            <p className="text-xs text-muted-foreground mt-1">Vereinfachte Version</p>
          </div>
          <div className="p-4 space-y-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rolle</span>
              <span className="font-medium">{role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Abteilung</span>
              <span className="font-medium">{department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Szenario</span>
              <span className="font-medium">{isOffboarding ? "Offboarding" : "Onboarding"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Laufzeit</span>
              <span className="font-medium">{formatElapsed(elapsed)}</span>
            </div>
          </div>

          <div className="p-4 border-t border-border space-y-3">
            <div className={`p-3 rounded-xl ${isOffboarding ? "bg-red-50" : "bg-emerald-50"}`}>
              <p className="text-xs font-semibold text-foreground mb-1">
                {isOffboarding ? "Offboarding-Interview" : "Onboarding-Begrüßung"}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isOffboarding
                  ? "Der Bot begrüßt dich, bedauert deinen Abgang und beginnt mit der Wissenssicherung."
                  : "Der Bot heißt dich willkommen und gibt dir eine kurze Einführung in deine neue Rolle."}
              </p>
            </div>

            <div className="p-3 bg-foreground/[0.03] border border-dashed border-border rounded-xl">
              <p className="text-xs text-muted-foreground leading-snug">
                <strong>Demo-Modus:</strong> Dies ist eine vereinfachte Version. In der Vollversion wird das gesamte Gespräch transkribiert und zu strukturiertem Wissen verarbeitet.
              </p>
            </div>

            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/demo">← Zurück zur Auswahl</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
