import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEmployees, useCreateSession } from "@/hooks/useApi";
import { Mic, ArrowRight, FileText, Users, Headphones, Loader2 } from "lucide-react";
import { useState } from "react";

const templates = [
  { title: 'Engineering Handover', desc: 'Infrastructure, systems, deployment processes, incident response', icon: '🔧', color: 'bg-foreground/[0.06]' },
  { title: 'Operations Expert Offboarding', desc: 'Vendor management, procurement, compliance workflows', icon: '⚙️', color: 'bg-amber-50' },
  { title: 'Customer Success Knowledge Transfer', desc: 'Account relationships, escalation patterns, renewal strategies', icon: '🤝', color: 'bg-emerald-50' },
  { title: 'Executive Handover', desc: 'Strategic decisions, stakeholder relationships, organizational context', icon: '👔', color: 'bg-blue-50' },
];

export default function NewSession() {
  const { data: employees = [], isLoading } = useEmployees();
  const createSession = useCreateSession();
  const navigate = useNavigate();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const handleStart = async () => {
    if (!selectedEmployeeId) return;
    try {
      const session = await createSession.mutateAsync(selectedEmployeeId);
      navigate(`/app/sessions/${session.id}`);
    } catch {}
  };
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Start New Session</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Begin a knowledge capture interview with a departing employee</p>
      </div>

      {/* Employee Selector */}
      <div className="bg-white border border-border p-6 space-y-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Select Employee</h2>
        <div className="grid grid-cols-2 gap-3">
          {employees.filter((e: any) => e.sessionStatus !== 'completed').slice(0, 4).map((e: any) => (
            <button key={e.id} onClick={() => setSelectedEmployeeId(e.id)} className={`flex items-center gap-3 p-3 border transition-colors text-left ${selectedEmployeeId === e.id ? 'border-foreground bg-foreground/[0.04]' : 'border-border hover:border-foreground/30 hover:bg-foreground/[0.02]'}`}>
              <div className="w-9 h-9 bg-foreground/[0.06] text-foreground text-[13px] font-semibold flex items-center justify-center">{e.avatarInitials || e.name?.split(' ').map((n: string) => n[0]).join('')}</div>
              <div>
                <p className="text-[13px] font-medium">{e.name}</p>
                <p className="text-xs text-muted-foreground">{e.role} · {e.department}</p>
                <p className="text-xs text-muted-foreground">Leaving {e.exitDate}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white border border-border p-6 space-y-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Interview Template</h2>
        <p className="text-xs text-muted-foreground">Choose a template to guide the AI interview, or start with a general session.</p>
        <div className="grid grid-cols-2 gap-3">
          {templates.map((t) => (
            <button key={t.title} className="flex items-start gap-3 p-4 border border-border hover:border-foreground/30 hover:bg-foreground/[0.02] transition-colors text-left">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="text-[13px] font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Session Purpose */}
      <div className="bg-white border border-border p-6 space-y-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Session Purpose</h2>
        <textarea
          placeholder="Describe what knowledge should be captured in this session... (optional)"
          className="w-full h-24 px-3 py-2 border border-border bg-white text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Link to="/app/sessions" className="h-9 px-4 border border-border text-[13px] font-medium flex items-center hover:bg-foreground/[0.04] transition-colors">Cancel</Link>
        <button onClick={handleStart} disabled={!selectedEmployeeId || createSession.isPending} className="h-9 px-4 bg-foreground text-background text-[13px] font-medium flex items-center gap-1.5 disabled:opacity-60 hover:bg-foreground/90 transition-colors">
          {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-3.5 h-3.5" />} Start Session
        </button>
      </div>
    </div>
  );
}