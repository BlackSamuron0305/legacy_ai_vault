import { Link, useLocation, Outlet } from "react-router-dom";
import { User, Shield, Building2, Users, Brain, FileCheck, FileText, Bell, Puzzle, Palette } from "lucide-react";

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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Settings</h1>
      <div className="flex gap-8">
        <nav className="w-48 shrink-0 space-y-0.5">
          {settingsNav.map(n => (
            <Link key={n.url} to={n.url} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === n.url ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}><n.icon className="w-4 h-4"/>{n.title}</Link>
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
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
      <h2 className="font-semibold">Profile</h2>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">AR</div>
        <button className="text-sm text-primary hover:underline">Change avatar</button>
      </div>
      {[{l:'Full name',v:'Alex Rivera'},{l:'Job title',v:'HR Operations Manager'},{l:'Department',v:'HR Operations'},{l:'Timezone',v:'America/New_York'}].map(f=>(
        <div key={f.l}><label className="text-sm font-medium">{f.l}</label><input defaultValue={f.v} className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"/></div>
      ))}
      <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Save Changes</button>
    </div>
  );
}

export function SettingsAccount() {
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h2 className="font-semibold">Account</h2>
        <div><label className="text-sm font-medium">Email</label><input defaultValue="alex@company.com" className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"/></div>
        <div><label className="text-sm font-medium">Password</label><input type="password" defaultValue="••••••••" className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"/></div>
        <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Update</button>
      </div>
      <div className="bg-card rounded-2xl border border-destructive/30 shadow-card p-6">
        <h3 className="font-semibold text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mt-1">Permanently delete your account and all associated data.</p>
        <button className="mt-3 h-9 px-4 rounded-lg border border-destructive text-destructive text-sm font-medium hover:bg-destructive/10">Delete Account</button>
      </div>
    </div>
  );
}

export function SettingsWorkspace() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
      <h2 className="font-semibold">Workspace</h2>
      {[{l:'Company name',v:'Acme Corp'},{l:'Workspace URL',v:'acme-corp.legacyai.com'}].map(f=>(
        <div key={f.l}><label className="text-sm font-medium">{f.l}</label><input defaultValue={f.v} className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"/></div>
      ))}
      <div><label className="text-sm font-medium">Departments</label>
        <div className="mt-2 flex flex-wrap gap-2">{['Engineering','Operations','Customer Success','Product','Finance','Data'].map(d=>(
          <span key={d} className="px-3 py-1 rounded-full bg-muted text-sm">{d}</span>
        ))}</div>
      </div>
      <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Save</button>
    </div>
  );
}

export function SettingsTeam() {
  const members = [{n:'Alex Rivera',e:'alex@company.com',r:'Admin',s:'active'},{n:'Jordan Lee',e:'jordan@company.com',r:'Reviewer',s:'active'},{n:'Casey Morgan',e:'casey@company.com',r:'Reviewer',s:'active'},{n:'Taylor Brooks',e:'taylor@company.com',r:'Viewer',s:'invited'}];
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card">
      <div className="p-4 border-b border-border flex justify-between items-center"><h2 className="font-semibold text-sm">Team Members</h2><button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Invite Member</button></div>
      <div className="divide-y divide-border">
        {members.map(m=>(
          <div key={m.e} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{m.n.split(' ').map(w=>w[0]).join('')}</div>
              <div><p className="text-sm font-medium">{m.n}</p><p className="text-xs text-muted-foreground">{m.e}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-muted px-2 py-1 rounded-full">{m.r}</span>
              {m.s === 'invited' && <span className="text-xs text-warning">Invited</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsAI() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
      <h2 className="font-semibold">AI & Interview Settings</h2>
      <p className="text-sm text-muted-foreground">Configure how the AI conducts knowledge capture interviews.</p>
      {[{l:'Interview tone',opts:['Professional','Conversational','Neutral']},{l:'Follow-up depth',opts:['Light (3-5 follow-ups)','Standard (5-10 follow-ups)','Thorough (10-15 follow-ups)']},{l:'Knowledge probing',opts:['Gentle','Moderate','Aggressive']},{l:'Output structure',opts:['Structured categories','Freeform','Topic-based']}].map(s=>(
        <div key={s.l}><label className="text-sm font-medium">{s.l}</label><select className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm">{s.opts.map(o=><option key={o}>{o}</option>)}</select></div>
      ))}
      <div><label className="text-sm font-medium">Session templates</label><p className="text-xs text-muted-foreground mt-1">4 templates configured (Engineering, Operations, CS, Executive)</p></div>
      <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Save Settings</button>
    </div>
  );
}

export function SettingsTranscript() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
      <h2 className="font-semibold">Transcript Review Settings</h2>
      <p className="text-sm text-muted-foreground">Configure the transcript review and approval workflow.</p>
      {[{l:'Require human approval before processing',v:true},{l:'Allow transcript editing',v:true},{l:'Highlight low-confidence segments',v:true},{l:'Notify reviewer when transcript is ready',v:true},{l:'Allow re-record requests',v:true}].map(s=>(
        <div key={s.l} className="flex items-center justify-between py-2">
          <span className="text-sm">{s.l}</span>
          <div className={`w-10 h-6 rounded-full ${s.v ? 'bg-primary' : 'bg-muted'} relative cursor-pointer`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-all ${s.v ? 'right-1' : 'left-1'}`}/></div>
        </div>
      ))}
      <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Save Settings</button>
    </div>
  );
}

export function SettingsOutput() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
      <h2 className="font-semibold">Output Settings</h2>
      {[{l:'Report format',opts:['Structured Documentation','Markdown','PDF']},{l:'Knowledge categorization',opts:['Automatic (AI-suggested)','Custom categories']},{l:'Export format',opts:['Markdown','JSON','PDF','DOCX']},{l:'RAG chunking',opts:['Paragraph-level','Section-level','Block-level']}].map(s=>(
        <div key={s.l}><label className="text-sm font-medium">{s.l}</label><select className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm">{s.opts.map(o=><option key={o}>{o}</option>)}</select></div>
      ))}
      <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Save Settings</button>
    </div>
  );
}

export function SettingsNotifications() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
      <h2 className="font-semibold">Notifications</h2>
      {['Session reminders','Transcript ready for review','Report finalized','Knowledge gap alerts','Weekly digest email','In-app notifications'].map(s=>(
        <div key={s} className="flex items-center justify-between py-2">
          <span className="text-sm">{s}</span>
          <div className="w-10 h-6 rounded-full bg-primary relative cursor-pointer"><div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-card shadow-sm"/></div>
        </div>
      ))}
    </div>
  );
}

export function SettingsIntegrations() {
  const integrations = [{n:'Notion',d:'Sync knowledge to Notion pages',s:false},{n:'Slack',d:'Session notifications in Slack',s:true},{n:'Google Drive',d:'Export reports to Drive',s:false},{n:'Jira',d:'Create action items in Jira',s:false},{n:'Internal RAG Platform',d:'Push embeddings to your AI assistant',s:false},{n:'BambooHR',d:'Sync employee data',s:false}];
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card">
      <div className="p-4 border-b border-border"><h2 className="font-semibold text-sm">Integrations</h2></div>
      <div className="divide-y divide-border">
        {integrations.map(i=>(
          <div key={i.n} className="p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium">{i.n}</p><p className="text-xs text-muted-foreground">{i.d}</p></div>
            <button className={`h-8 px-3 rounded-lg text-xs font-medium ${i.s ? 'bg-success/10 text-success border border-success/20' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{i.s ? 'Connected' : 'Connect'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsAppearance() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
      <h2 className="font-semibold">Appearance</h2>
      {[{l:'Theme',opts:['Light','Dark','System']},{l:'Density',opts:['Comfortable','Compact']},{l:'Date format',opts:['MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD']},{l:'Language',opts:['English','Spanish','French','German']}].map(s=>(
        <div key={s.l}><label className="text-sm font-medium">{s.l}</label><select className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm">{s.opts.map(o=><option key={o}>{o}</option>)}</select></div>
      ))}
    </div>
  );
}