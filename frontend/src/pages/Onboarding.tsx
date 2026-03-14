import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Building2, Users, Settings2, Check, ArrowRight, Plus, X } from "lucide-react";

const steps = ['Workspace', 'Departments', 'Employees', 'Preferences'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [departments, setDepartments] = useState(['Engineering', 'Operations', 'Customer Success']);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 justify-center mb-8">
          <img src="/logo-icon.svg" alt="LegacyAI icon" className="h-8 w-8 shrink-0 dark:invert" />
          <span className="text-sm font-semibold text-foreground">Legacy AI</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border border-border'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card p-8">
          {step === 0 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2"><Building2 className="w-6 h-6" /></div>
              <h2 className="text-lg font-semibold">Set up your workspace</h2>
              <p className="text-sm text-muted-foreground">Tell us about your organization.</p>
              <div>
                <label className="text-sm font-medium">Company name</label>
                <input type="text" defaultValue="Acme Corp" className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium">Company size</label>
                <select className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>50–200</option>
                  <option>200–500</option>
                  <option>500–2000</option>
                  <option>2000+</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Industry</label>
                <select className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Manufacturing</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2"><Users className="w-6 h-6" /></div>
              <h2 className="text-lg font-semibold">Define departments</h2>
              <p className="text-sm text-muted-foreground">Add the departments that will participate in knowledge capture.</p>
              <div className="space-y-2">
                {departments.map((d) => (
                  <div key={d} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/50">
                    <span className="text-sm">{d}</span>
                    <button onClick={() => setDepartments(departments.filter(dep => dep !== d))} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setDepartments([...departments, 'New Department'])}>
                <Plus className="w-4 h-4" /> Add Department
              </Button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2"><Users className="w-6 h-6" /></div>
              <h2 className="text-lg font-semibold">Add employees</h2>
              <p className="text-sm text-muted-foreground">Add employees who need knowledge capture or import later.</p>
              <div className="space-y-3 border border-border rounded-xl p-4 bg-muted/30">
                {['Sarah Jenkins — Engineering', 'Marcus Chen — Operations'].map((e) => (
                  <div key={e} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{e.slice(0,2).toUpperCase()}</div>
                    <span className="text-sm">{e}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm"><Plus className="w-4 h-4" /> Add Employee</Button>
              <p className="text-xs text-muted-foreground">You can also upload a CSV or add employees later from the Employees page.</p>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2"><Settings2 className="w-6 h-6" /></div>
              <h2 className="text-lg font-semibold">Output preferences</h2>
              <p className="text-sm text-muted-foreground">Configure how captured knowledge is structured and exported.</p>
              <div>
                <label className="text-sm font-medium">Report format</label>
                <select className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>Structured Documentation</option>
                  <option>Markdown</option>
                  <option>PDF</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Knowledge categorization</label>
                <select className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>Automatic (AI-suggested)</option>
                  <option>Custom categories</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded border-input" />
                <span className="text-sm">Require human transcript approval before processing</span>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
            {step < 3 ? (
              <Button size="sm" onClick={() => setStep(step + 1)}>Continue <ArrowRight className="w-4 h-4" /></Button>
            ) : (
              <Button size="sm" asChild><Link to="/app">Launch Workspace <ArrowRight className="w-4 h-4" /></Link></Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}