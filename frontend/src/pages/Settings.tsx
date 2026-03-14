import { Link, useLocation, Outlet } from "react-router-dom";
import { User, Shield, Building2, Users, Brain, FileCheck, FileText, Bell, Puzzle, Palette } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

const settingsNav = [
  { title: 'Profile', url: '/app/settings', icon: User },
  { title: 'Account', url: '/app/settings/account', icon: Shield },
  { title: 'Workspace', url: '/app/settings/workspace', icon: Building2 },
  { title: 'Team', url: '/app/settings/team', icon: Users },
  { title: 'AI & Interview', url: '/app/settings/ai', icon: Brain },
  { title: 'Transcript Review', url: '/app/settings/transcript', icon: FileCheck },
  { title: 'Output', url: '/app/settings/output', icon: FileText },
  { title: 'Notifications', url: '/app/settings/notifications', icon: Bell },
  { title: 'Integrations', url: '/app/settings/integrations', icon: Puzzle },
  { title: 'Appearance', url: '/app/settings/appearance', icon: Palette },
];

export default function Settings() {
  const location = useLocation();
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold tracking-tight mb-6">Settings</h1>
      <div className="flex gap-8">
        <nav className="w-48 shrink-0 space-y-px">
          {settingsNav.map(n => (
            <Link key={n.url} to={n.url} className={`flex items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors ${
              location.pathname === n.url ? 'text-foreground bg-foreground/[0.06]' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
            }`}><n.icon className="w-3.5 h-3.5"/>{n.title}</Link>
          ))}
        </nav>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function SettingsProfile() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile(fullName);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">Profile</h2>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-foreground text-background flex items-center justify-center text-lg font-semibold">{user?.avatarInitials || '?'}</div>
      </div>
      <div>
        <label className="text-[13px] font-medium">Full name</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20"/>
      </div>
      <div>
        <label className="text-[13px] font-medium">Email</label>
        <input defaultValue={user?.email || ''} disabled className="mt-1 w-full h-9 px-3 border border-border bg-foreground/[0.03] text-[13px] text-muted-foreground cursor-not-allowed"/>
      </div>
      <div>
        <label className="text-[13px] font-medium">Role</label>
        <input defaultValue={user?.role || ''} disabled className="mt-1 w-full h-9 px-3 border border-border bg-foreground/[0.03] text-[13px] text-muted-foreground cursor-not-allowed capitalize"/>
      </div>
      <button onClick={handleSave} disabled={saving} className="h-9 px-4 bg-foreground text-background text-[13px] font-medium disabled:opacity-60 hover:bg-foreground/90 transition-colors">
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}

export function SettingsAccount() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <div className="bg-white border border-border p-6 space-y-4">
        <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">Account</h2>
        <div><label className="text-[13px] font-medium">Email</label><input defaultValue={user?.email || ''} disabled className="mt-1 w-full h-9 px-3 border border-border bg-foreground/[0.03] text-[13px] text-muted-foreground cursor-not-allowed"/></div>
        <div><label className="text-[13px] font-medium">Password</label><input type="password" defaultValue="••••••••" disabled className="mt-1 w-full h-9 px-3 border border-border bg-foreground/[0.03] text-[13px] text-muted-foreground cursor-not-allowed"/><p className="text-xs text-muted-foreground mt-1">Password is managed via Supabase Auth.</p></div>
      </div>
      <div className="bg-white border border-red-200 p-6">
        <h3 className="font-semibold text-[13px] text-red-600">Danger Zone</h3>
        <p className="text-[13px] text-muted-foreground mt-1">Permanently delete your account and all associated data.</p>
        <button className="mt-3 h-8 px-4 border border-red-300 text-red-600 text-[13px] font-medium hover:bg-red-50 transition-colors">Delete Account</button>
      </div>
    </div>
  );
}

export function SettingsWorkspace() {
  const { user, refreshUser } = useAuth();
  const [companyName, setCompanyName] = useState(user?.companyName || user?.workspaceName || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateWorkspace(companyName);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">Workspace</h2>
      <div>
        <label className="text-[13px] font-medium">Company name</label>
        <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20"/>
      </div>
      <button onClick={handleSave} disabled={saving} className="h-9 px-4 bg-foreground text-background text-[13px] font-medium disabled:opacity-60 hover:bg-foreground/90 transition-colors">
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
      </button>
    </div>
  );
}

export function SettingsTeam() {
  const members = [{n:'Alex Rivera',e:'alex@company.com',r:'Admin',s:'active'},{n:'Jordan Lee',e:'jordan@company.com',r:'Reviewer',s:'active'},{n:'Casey Morgan',e:'casey@company.com',r:'Reviewer',s:'active'},{n:'Taylor Brooks',e:'taylor@company.com',r:'Viewer',s:'invited'}];
  return (
    <div className="bg-white border border-border">
      <div className="px-5 py-3.5 border-b border-border flex justify-between items-center"><h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Team Members</h2><button className="h-8 px-4 bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90 transition-colors">Invite Member</button></div>
      <div className="divide-y divide-border">
        {members.map(m=>(
          <div key={m.e} className="px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-foreground text-background text-xs font-semibold flex items-center justify-center">{m.n.split(' ').map(w=>w[0]).join('')}</div>
              <div><p className="text-[13px] font-medium">{m.n}</p><p className="text-xs text-muted-foreground">{m.e}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs border border-border px-2 py-0.5">{m.r}</span>
              {m.s === 'invited' && <span className="text-xs text-amber-600">Invited</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsAI() {
  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">AI & Interview Settings</h2>
      <p className="text-[13px] text-muted-foreground">Configure how the AI conducts knowledge capture interviews.</p>
      {[{l:'Interview tone',opts:['Professional','Conversational','Neutral']},{l:'Follow-up depth',opts:['Light (3-5 follow-ups)','Standard (5-10 follow-ups)','Thorough (10-15 follow-ups)']},{l:'Knowledge probing',opts:['Gentle','Moderate','Aggressive']},{l:'Output structure',opts:['Structured categories','Freeform','Topic-based']}].map(s=>(
        <div key={s.l}><label className="text-[13px] font-medium">{s.l}</label><select className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20">{s.opts.map(o=><option key={o}>{o}</option>)}</select></div>
      ))}
      <div><label className="text-[13px] font-medium">Session templates</label><p className="text-xs text-muted-foreground mt-1">4 templates configured (Engineering, Operations, CS, Executive)</p></div>
      <button className="h-9 px-4 bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90 transition-colors">Save Settings</button>
    </div>
  );
}

export function SettingsTranscript() {
  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">Transcript Review Settings</h2>
      <p className="text-[13px] text-muted-foreground">Configure the transcript review and approval workflow.</p>
      {[{l:'Require human approval before processing',v:true},{l:'Allow transcript editing',v:true},{l:'Highlight low-confidence segments',v:true},{l:'Notify reviewer when transcript is ready',v:true},{l:'Allow re-record requests',v:true}].map(s=>(
        <div key={s.l} className="flex items-center justify-between py-2">
          <span className="text-[13px]">{s.l}</span>
          <div className={`w-9 h-5 ${s.v ? 'bg-foreground' : 'bg-border'} relative cursor-pointer`}><div className={`absolute top-0.5 w-4 h-4 bg-white transition-all ${s.v ? 'right-0.5' : 'left-0.5'}`}/></div>
        </div>
      ))}
      <button className="h-9 px-4 bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90 transition-colors">Save Settings</button>
    </div>
  );
}

export function SettingsOutput() {
  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">Output Settings</h2>
      {[{l:'Report format',opts:['Structured Documentation','Markdown','PDF']},{l:'Knowledge categorization',opts:['Automatic (AI-suggested)','Custom categories']},{l:'Export format',opts:['Markdown','JSON','PDF','DOCX']},{l:'RAG chunking',opts:['Paragraph-level','Section-level','Block-level']}].map(s=>(
        <div key={s.l}><label className="text-[13px] font-medium">{s.l}</label><select className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20">{s.opts.map(o=><option key={o}>{o}</option>)}</select></div>
      ))}
      <button className="h-9 px-4 bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90 transition-colors">Save Settings</button>
    </div>
  );
}

export function SettingsNotifications() {
  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">Notifications</h2>
      {['Session reminders','Transcript ready for review','Report finalized','Knowledge gap alerts','Weekly digest email','In-app notifications'].map(s=>(
        <div key={s} className="flex items-center justify-between py-2">
          <span className="text-[13px]">{s}</span>
          <div className="w-9 h-5 bg-foreground relative cursor-pointer"><div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white"/></div>
        </div>
      ))}
    </div>
  );
}

export function SettingsIntegrations() {
  const integrations = [{n:'Notion',d:'Sync knowledge to Notion pages',s:false},{n:'Slack',d:'Session notifications in Slack',s:true},{n:'Google Drive',d:'Export reports to Drive',s:false},{n:'Jira',d:'Create action items in Jira',s:false},{n:'Internal RAG Platform',d:'Push embeddings to your AI assistant',s:false},{n:'BambooHR',d:'Sync employee data',s:false}];
  return (
    <div className="bg-white border border-border">
      <div className="px-5 py-3.5 border-b border-border"><h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Integrations</h2></div>
      <div className="divide-y divide-border">
        {integrations.map(i=>(
          <div key={i.n} className="px-5 py-3.5 flex items-center justify-between">
            <div><p className="text-[13px] font-medium">{i.n}</p><p className="text-xs text-muted-foreground">{i.d}</p></div>
            <button className={`h-7 px-3 text-xs font-medium ${i.s ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'border border-border text-muted-foreground hover:text-foreground'}`}>{i.s ? 'Connected' : 'Connect'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsAppearance() {
  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">Appearance</h2>
      {[{l:'Theme',opts:['Light','Dark','System']},{l:'Density',opts:['Comfortable','Compact']},{l:'Date format',opts:['MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD']},{l:'Language',opts:['English','Spanish','French','German']}].map(s=>(
        <div key={s.l}><label className="text-[13px] font-medium">{s.l}</label><select className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20">{s.opts.map(o=><option key={o}>{o}</option>)}</select></div>
      ))}
    </div>
  );
}