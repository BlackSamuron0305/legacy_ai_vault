import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEmployees, useCreateSession } from "@/hooks/useApi";
import { Mic, ArrowRight, FileText, Users, Headphones, Loader2 } from "lucide-react";
import { useState } from "react";

const templates = [
  { title: 'Engineering Handover', desc: 'Infrastructure, systems, deployment processes, incident response', icon: '🔧', color: 'bg-primary/10' },
  { title: 'Operations Expert Offboarding', desc: 'Vendor management, procurement, compliance workflows', icon: '⚙️', color: 'bg-warning/10' },
  { title: 'Customer Success Knowledge Transfer', desc: 'Account relationships, escalation patterns, renewal strategies', icon: '🤝', color: 'bg-success/10' },
  { title: 'Executive Handover', desc: 'Strategic decisions, stakeholder relationships, organizational context', icon: '👔', color: 'bg-info/10' },
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
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Start New Session</h1>
        <p className="text-sm text-muted-foreground mt-1">Begin a knowledge capture interview with a departing employee</p>
      </div>

      {/* Employee Selector */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h2 className="font-semibold text-sm">Select Employee</h2>
        <div className="grid grid-cols-2 gap-3">
          {employees.filter((e: any) => e.sessionStatus !== 'completed').slice(0, 4).map((e: any) => (
            <button key={e.id} onClick={() => setSelectedEmployeeId(e.id)} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${selectedEmployeeId === e.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-primary/5'}`}>
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">{e.avatarInitials || e.name?.split(' ').map((n: string) => n[0]).join('')}</div>
              <div>
                <p className="text-sm font-medium">{e.name}</p>
                <p className="text-xs text-muted-foreground">{e.role} · {e.department}</p>
                <p className="text-xs text-muted-foreground">Leaving {e.exitDate}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h2 className="font-semibold text-sm">Interview Template</h2>
        <p className="text-xs text-muted-foreground">Choose a template to guide the AI interview, or start with a general session.</p>
        <div className="grid grid-cols-2 gap-3">
          {templates.map((t) => (
            <button key={t.title} className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors text-left">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Session Purpose */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h2 className="font-semibold text-sm">Session Purpose</h2>
        <textarea
          placeholder="Describe what knowledge should be captured in this session... (optional)"
          className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild><Link to="/app/sessions">Cancel</Link></Button>
        <Button onClick={handleStart} disabled={!selectedEmployeeId || createSession.isPending}>
          {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />} Start Session
        </Button>
      </div>
    </div>
  );
}