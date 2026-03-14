import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Building2, Users, Settings2, Check, ArrowRight, Plus, X } from "lucide-react";

const steps = ['Workspace', 'Departments', 'Employees', 'Preferences'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [departments, setDepartments] = useState(['Engineering', 'Operations', 'Customer Success']);

  return (
    <div className="min-h-screen bg-foreground/[0.02] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 justify-center mb-8">
          <img src="/logo-icon.svg" alt="LegacyAI icon" className="h-8 w-8 shrink-0 dark:invert" />
          <span className="text-[13px] font-semibold text-foreground">Legacy AI</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 flex items-center justify-center text-xs font-medium ${
                i <= step ? 'bg-foreground text-background' : 'bg-foreground/[0.06] text-muted-foreground border border-border'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-foreground' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-border p-8">
          {step === 0 && (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-foreground/[0.06] flex items-center justify-center text-foreground mb-2"><Building2 className="w-6 h-6" /></div>
              <h2 className="text-lg font-semibold">Set up your workspace</h2>
              <p className="text-[13px] text-muted-foreground">Tell us about your organization.</p>
              <div>
                <label className="text-[13px] font-medium">Company name</label>
                <input type="text" defaultValue="Acme Corp" className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20" />
              </div>
              <div>
                <label className="text-[13px] font-medium">Company size</label>
                <select className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20">
                  <option>50–200</option>
                  <option>200–500</option>
                  <option>500–2000</option>
                  <option>2000+</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] font-medium">Industry</label>
                <select className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20">
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
              <div className="w-12 h-12 bg-foreground/[0.06] flex items-center justify-center text-foreground mb-2"><Users className="w-6 h-6" /></div>
              <h2 className="text-lg font-semibold">Define departments</h2>
              <p className="text-[13px] text-muted-foreground">Add the departments that will participate in knowledge capture.</p>
              <div className="space-y-2">
                {departments.map((d) => (
                  <div key={d} className="flex items-center justify-between px-3 py-2 border border-border bg-foreground/[0.03]">
                    <span className="text-[13px]">{d}</span>
                    <button onClick={() => setDepartments(departments.filter(dep => dep !== d))} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <button className="h-8 px-3 border border-border text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/[0.04] transition-colors" onClick={() => setDepartments([...departments, 'New Department'])}>
                <Plus className="w-3.5 h-3.5" /> Add Department
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-foreground/[0.06] flex items-center justify-center text-foreground mb-2"><Users className="w-6 h-6" /></div>
              <h2 className="text-lg font-semibold">Add employees</h2>
              <p className="text-[13px] text-muted-foreground">Add employees who need knowledge capture or import later.</p>
              <div className="space-y-3 border border-border p-4 bg-foreground/[0.03]">
                {['Sarah Jenkins — Engineering', 'Marcus Chen — Operations'].map((e) => (
                  <div key={e} className="flex items-center gap-3 px-3 py-2 bg-white border border-border">
                    <div className="w-7 h-7 bg-foreground/[0.06] text-foreground text-xs font-semibold flex items-center justify-center">{e.slice(0,2).toUpperCase()}</div>
                    <span className="text-[13px]">{e}</span>
                  </div>
                ))}
              </div>
              <button className="h-8 px-3 border border-border text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/[0.04] transition-colors"><Plus className="w-3.5 h-3.5" /> Add Employee</button>
              <p className="text-xs text-muted-foreground">You can also upload a CSV or add employees later from the Employees page.</p>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-foreground/[0.06] flex items-center justify-center text-foreground mb-2"><Settings2 className="w-6 h-6" /></div>
              <h2 className="text-lg font-semibold">Output preferences</h2>
              <p className="text-[13px] text-muted-foreground">Configure how captured knowledge is structured and exported.</p>
              <div>
                <label className="text-[13px] font-medium">Report format</label>
                <select className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20">
                  <option>Structured Documentation</option>
                  <option>Markdown</option>
                  <option>PDF</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] font-medium">Knowledge categorization</label>
                <select className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20">
                  <option>Automatic (AI-suggested)</option>
                  <option>Custom categories</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="border-border" />
                <span className="text-[13px]">Require human transcript approval before processing</span>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <button className="h-8 px-3 text-[13px] text-muted-foreground font-medium hover:text-foreground transition-colors disabled:opacity-40" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</button>
            {step < 3 ? (
              <button className="h-8 px-4 bg-foreground text-background text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/90 transition-colors" onClick={() => setStep(step + 1)}>Continue <ArrowRight className="w-3.5 h-3.5" /></button>
            ) : (
              <Link to="/app" className="h-8 px-4 bg-foreground text-background text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/90 transition-colors">Launch Workspace <ArrowRight className="w-3.5 h-3.5" /></Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}