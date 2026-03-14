import { useState } from "react";
import { Link } from "react-router-dom";
import { useEmployees, useCreateEmployee } from "@/hooks/useApi";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, X } from "lucide-react";
import { EmployeesSkeleton } from "@/components/skeletons";

function AddEmployeeDialog({ onClose }: { onClose: () => void }) {
  const createEmployee = useCreateEmployee();
  const [form, setForm] = useState({ name: '', role: '', department: '', email: '', exitDate: '', tenure: '', riskLevel: 'medium' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEmployee.mutateAsync(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white border border-border w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Add Employee</h2>
          <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[13px] font-medium">Full Name *</label>
            <input type="text" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20" placeholder="Sarah Jenkins" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium">Role *</label>
              <input type="text" required value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20" placeholder="Senior Engineer" />
            </div>
            <div>
              <label className="text-[13px] font-medium">Department *</label>
              <input type="text" required value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20" placeholder="Engineering" />
            </div>
          </div>
          <div>
            <label className="text-[13px] font-medium">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20" placeholder="sarah@company.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium">Exit Date</label>
              <input type="date" value={form.exitDate} onChange={e => setForm(f => ({...f, exitDate: e.target.value}))} className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20" />
            </div>
            <div>
              <label className="text-[13px] font-medium">Tenure</label>
              <input type="text" value={form.tenure} onChange={e => setForm(f => ({...f, tenure: e.target.value}))} className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20" placeholder="5 years" />
            </div>
          </div>
          <div>
            <label className="text-[13px] font-medium">Risk Level</label>
            <select value={form.riskLevel} onChange={e => setForm(f => ({...f, riskLevel: e.target.value}))} className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-9 px-4 border border-border text-[13px] font-medium hover:bg-foreground/[0.04] transition-colors">Cancel</button>
            <button type="submit" disabled={createEmployee.isPending} className="h-9 px-4 bg-foreground text-background text-[13px] font-medium disabled:opacity-60 hover:bg-foreground/90 transition-colors">
              {createEmployee.isPending ? 'Creating...' : 'Add Employee'}
            </button>
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
    return <EmployeesSkeleton />;
  }
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Employees</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Track knowledge capture for departing employees</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-[13px] font-medium hover:bg-foreground/90 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Employee
        </button>
      </div>
      {showAdd && <AddEmployeeDialog onClose={() => setShowAdd(false)} />}
      <div className="bg-white border border-border overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-border">
            <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Employee</th>
            <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Department</th>
            <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Exit Date</th>
            <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Tenure</th>
            <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Session</th>
            <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Transcript</th>
            <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Risk</th>
            <th className="text-left px-5 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Coverage</th>
          </tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-foreground/[0.02] transition-colors">
                <td className="px-5 py-3"><Link to={`/app/employees/${e.id}`} className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-foreground text-background text-xs font-semibold flex items-center justify-center">{e.avatarInitials || e.name?.split(' ').map((n: string) => n[0]).join('')}</div>
                  <div><p className="font-medium">{e.name}</p><p className="text-xs text-muted-foreground">{e.role}</p></div>
                </Link></td>
                <td className="px-5 py-3 text-muted-foreground">{e.department}</td>
                <td className="px-5 py-3 text-muted-foreground">{e.exitDate}</td>
                <td className="px-5 py-3 text-muted-foreground">{e.tenure}</td>
                <td className="px-5 py-3"><StatusBadge status={e.sessionStatus} /></td>
                <td className="px-5 py-3"><StatusBadge status={e.transcriptStatus} /></td>
                <td className="px-5 py-3"><StatusBadge status={e.riskLevel} /></td>
                <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-14 h-1 bg-border overflow-hidden"><div className="h-full bg-foreground" style={{width:`${e.coverageScore}%`}}/></div><span className="text-xs text-muted-foreground">{e.coverageScore}%</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}