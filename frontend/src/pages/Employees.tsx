import { useState } from "react";
import { Link } from "react-router-dom";
import { useEmployees, useCreateEmployee } from "@/hooks/useApi";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, X } from "lucide-react";

function AddEmployeeDialog({ onClose }: { onClose: () => void }) {
  const createEmployee = useCreateEmployee();
  const [form, setForm] = useState({ name: '', role: '', department: '', email: '', exitDate: '', tenure: '', riskLevel: 'medium' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEmployee.mutateAsync(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border shadow-lg w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Employee</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Full Name *</label>
            <input type="text" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Sarah Jenkins" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Role *</label>
              <input type="text" required value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Senior Engineer" />
            </div>
            <div>
              <label className="text-sm font-medium">Department *</label>
              <input type="text" required value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Engineering" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="sarah@company.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Exit Date</label>
              <input type="date" value={form.exitDate} onChange={e => setForm(f => ({...f, exitDate: e.target.value}))} className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium">Tenure</label>
              <input type="text" value={form.tenure} onChange={e => setForm(f => ({...f, tenure: e.target.value}))} className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="5 years" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Risk Level</label>
            <select value={form.riskLevel} onChange={e => setForm(f => ({...f, riskLevel: e.target.value}))} className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createEmployee.isPending}>
              {createEmployee.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Add Employee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Employees() {
  const { data: employees = [], isLoading } = useEmployees();
  const [showAdd, setShowAdd] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">Track knowledge capture for departing employees</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Employee</Button>
      </div>
      {showAdd && <AddEmployeeDialog onClose={() => setShowAdd(false)} />}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="text-left p-3 font-medium text-muted-foreground">Employee</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Department</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Exit Date</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Tenure</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Session</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Transcript</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Risk</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Coverage</th>
          </tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="p-3"><Link to={`/app/employees/${e.id}`} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{e.avatarInitials || e.name?.split(' ').map((n: string) => n[0]).join('')}</div>
                  <div><p className="font-medium">{e.name}</p><p className="text-xs text-muted-foreground">{e.role}</p></div>
                </Link></td>
                <td className="p-3 text-muted-foreground">{e.department}</td>
                <td className="p-3 text-muted-foreground">{e.exitDate}</td>
                <td className="p-3 text-muted-foreground">{e.tenure}</td>
                <td className="p-3"><StatusBadge status={e.sessionStatus} /></td>
                <td className="p-3"><StatusBadge status={e.transcriptStatus} /></td>
                <td className="p-3"><StatusBadge status={e.riskLevel} /></td>
                <td className="p-3"><div className="flex items-center gap-2"><div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{width:`${e.coverageScore}%`}}/></div><span className="text-xs text-muted-foreground">{e.coverageScore}%</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}