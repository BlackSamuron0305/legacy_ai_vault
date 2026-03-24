import { Link, useLocation, Outlet } from "react-router-dom";
import { User, Shield, Brain, FileCheck, FileText, Bell, Puzzle, Palette, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { SettingsFormSkeleton, SettingsToggleSkeleton } from "@/components/skeletons";
import { api } from "@/lib/api";

const settingsNav = [
  { title: 'Profile', slug: 'profile', desc: 'Name, avatar & personal info', icon: User },
  { title: 'Account', slug: 'account', desc: 'Email, password & danger zone', icon: Shield },
  { title: 'AI & Interview', slug: 'ai', desc: 'Tone, depth & probing behaviour', icon: Brain },
  { title: 'Transcript Review', slug: 'transcript', desc: 'Approval workflow & editing', icon: FileCheck },
  { title: 'Output', slug: 'output', desc: 'Report format, export & chunking', icon: FileText },
  { title: 'Notifications', slug: 'notifications', desc: 'Alerts, digests & in-app notices', icon: Bell },
  { title: 'Integrations', slug: 'integrations', desc: 'Notion, Slack, Jira & more', icon: Puzzle },
  { title: 'Appearance', slug: 'appearance', desc: 'Theme, density & locale', icon: Palette },
];

/* Breadcrumb label from pathname */
function getSectionTitle(pathname: string) {
  const slug = pathname.replace('/app/settings/', '').replace('/app/settings', '');
  return settingsNav.find(n => n.slug === slug)?.title || null;
}

export default function Settings() {
  const location = useLocation();
  const section = getSectionTitle(location.pathname);
  const isIndex = location.pathname === '/app/settings' || location.pathname === '/app/settings/';

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px] mb-6">
        {isIndex ? (
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        ) : (
          <>
            <Link to="/app/settings" className="text-muted-foreground hover:text-foreground transition-colors">Settings</Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            <span className="font-medium text-foreground">{section}</span>
          </>
        )}
      </nav>

      <Outlet />
    </div>
  );
}

/* Index page — settings overview grid */
export function SettingsIndex() {
  return (
    <div className="grid grid-cols-2 gap-px bg-border border border-border">
      {settingsNav.map(n => (
        <Link
          key={n.slug}
          to={`/app/settings/${n.slug}`}
          className="bg-white p-5 flex items-start gap-4 hover:bg-foreground/[0.02] transition-colors group"
        >
          <div className="w-9 h-9 bg-foreground/[0.06] flex items-center justify-center shrink-0">
            <n.icon className="w-4 h-4 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold group-hover:underline">{n.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{n.desc}</div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      ))}
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
        <div><label className="text-[13px] font-medium">Password</label><input type="password" defaultValue="••••••••" disabled className="mt-1 w-full h-9 px-3 border border-border bg-foreground/[0.03] text-[13px] text-muted-foreground cursor-not-allowed"/><p className="text-xs text-muted-foreground mt-1">Password changes are not currently supported.</p></div>
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
  const { settings, loading, saving, saved, update } = useSettings();
  const [local, setLocal] = useState<Record<string, string>>({});

  const fields = [
    { key: 'interviewTone' as const, l: 'Interview tone', opts: ['Professional', 'Conversational', 'Neutral'] },
    { key: 'followUpDepth' as const, l: 'Follow-up depth', opts: ['Light (3-5 follow-ups)', 'Standard (5-10 follow-ups)', 'Thorough (10-15 follow-ups)'] },
    { key: 'knowledgeProbing' as const, l: 'Knowledge probing', opts: ['Gentle', 'Moderate', 'Aggressive'] },
    { key: 'outputStructure' as const, l: 'Output structure', opts: ['Structured categories', 'Freeform', 'Topic-based'] },
  ];

  const getValue = (key: string) => local[key] ?? (settings as any)[key] ?? '';

  const handleSave = () => {
    if (Object.keys(local).length > 0) update(local);
  };

  if (loading) return <SettingsFormSkeleton />;

  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">AI & Interview Settings</h2>
      <p className="text-[13px] text-muted-foreground">Configure how the AI conducts knowledge capture interviews.</p>
      {fields.map(s => (
        <div key={s.key}>
          <label className="text-[13px] font-medium">{s.l}</label>
          <select value={getValue(s.key)} onChange={e => setLocal(prev => ({ ...prev, [s.key]: e.target.value }))} className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20">
            {s.opts.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      ))}
      <div><label className="text-[13px] font-medium">Session templates</label><p className="text-xs text-muted-foreground mt-1">4 templates configured (Engineering, Operations, CS, Executive)</p></div>
      <button onClick={handleSave} disabled={saving} className="h-9 px-4 bg-foreground text-background text-[13px] font-medium disabled:opacity-60 hover:bg-foreground/90 transition-colors">
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

export function SettingsTranscript() {
  const { settings, loading, saving, saved, update } = useSettings();

  const toggles = [
    { key: 'requireApproval' as const, l: 'Require human approval before processing' },
    { key: 'allowEditing' as const, l: 'Allow transcript editing' },
    { key: 'highlightLowConfidence' as const, l: 'Highlight low-confidence segments' },
    { key: 'notifyReviewer' as const, l: 'Notify reviewer when transcript is ready' },
    { key: 'allowReRecord' as const, l: 'Allow re-record requests' },
  ];

  if (loading) return <SettingsToggleSkeleton />;

  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">Transcript Review Settings</h2>
      <p className="text-[13px] text-muted-foreground">Configure the transcript review and approval workflow.</p>
      {toggles.map(s => {
        const v = (settings as any)[s.key] as boolean;
        return (
          <div key={s.key} className="flex items-center justify-between py-2">
            <span className="text-[13px]">{s.l}</span>
            <button type="button" onClick={() => update({ [s.key]: !v })} disabled={saving} className={`w-9 h-5 ${v ? 'bg-foreground' : 'bg-border'} relative cursor-pointer`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white transition-all ${v ? 'right-0.5' : 'left-0.5'}`}/>
            </button>
          </div>
        );
      })}
      {saved && <p className="text-[13px] text-emerald-600">Saved!</p>}
    </div>
  );
}

export function SettingsOutput() {
  const { settings, loading, saving, saved, update } = useSettings();
  const [local, setLocal] = useState<Record<string, string>>({});

  const fields = [
    { key: 'reportFormat' as const, l: 'Report format', opts: ['Structured Documentation', 'Markdown', 'PDF'] },
    { key: 'knowledgeCategorization' as const, l: 'Knowledge categorization', opts: ['Automatic (AI-suggested)', 'Custom categories'] },
    { key: 'exportFormat' as const, l: 'Export format', opts: ['Markdown', 'JSON', 'PDF', 'DOCX'] },
    { key: 'ragChunking' as const, l: 'RAG chunking', opts: ['Paragraph-level', 'Section-level', 'Block-level'] },
  ];

  const getValue = (key: string) => local[key] ?? (settings as any)[key] ?? '';

  const handleSave = () => {
    if (Object.keys(local).length > 0) update(local);
  };

  if (loading) return <SettingsFormSkeleton />;

  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">Output Settings</h2>
      {fields.map(s => (
        <div key={s.key}>
          <label className="text-[13px] font-medium">{s.l}</label>
          <select value={getValue(s.key)} onChange={e => setLocal(prev => ({ ...prev, [s.key]: e.target.value }))} className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20">
            {s.opts.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      ))}
      <button onClick={handleSave} disabled={saving} className="h-9 px-4 bg-foreground text-background text-[13px] font-medium disabled:opacity-60 hover:bg-foreground/90 transition-colors">
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

export function SettingsNotifications() {
  const { settings, loading, saving, saved, update } = useSettings();

  const toggles = [
    { key: 'notifySessionReminders' as const, l: 'Session reminders' },
    { key: 'notifyTranscriptReady' as const, l: 'Transcript ready for review' },
    { key: 'notifyReportFinalized' as const, l: 'Report finalized' },
    { key: 'notifyKnowledgeGaps' as const, l: 'Knowledge gap alerts' },
    { key: 'notifyWeeklyDigest' as const, l: 'Weekly digest email' },
    { key: 'notifyInApp' as const, l: 'In-app notifications' },
  ];

  if (loading) return <SettingsToggleSkeleton />;

  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">Notifications</h2>
      {toggles.map(s => {
        const v = (settings as any)[s.key] as boolean;
        return (
          <div key={s.key} className="flex items-center justify-between py-2">
            <span className="text-[13px]">{s.l}</span>
            <button type="button" onClick={() => update({ [s.key]: !v })} disabled={saving} className={`w-9 h-5 ${v ? 'bg-foreground' : 'bg-border'} relative cursor-pointer`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white transition-all ${v ? 'right-0.5' : 'left-0.5'}`}/>
            </button>
          </div>
        );
      })}
      {saved && <p className="text-[13px] text-emerald-600">Saved!</p>}
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
  const { settings, loading, saving, saved, update } = useSettings();
  const [local, setLocal] = useState<Record<string, string>>({});

  const fields = [
    { key: 'theme' as const, l: 'Theme', opts: ['Light', 'Dark', 'System'] },
    { key: 'density' as const, l: 'Density', opts: ['Comfortable', 'Compact'] },
    { key: 'dateFormat' as const, l: 'Date format', opts: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] },
    { key: 'language' as const, l: 'Language', opts: ['English', 'Spanish', 'French', 'German'] },
  ];

  const getValue = (key: string) => local[key] ?? (settings as any)[key] ?? '';

  const handleSave = () => {
    if (Object.keys(local).length > 0) update(local);
  };

  if (loading) return <SettingsFormSkeleton />;

  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground">Appearance</h2>
      {fields.map(s => (
        <div key={s.key}>
          <label className="text-[13px] font-medium">{s.l}</label>
          <select value={getValue(s.key)} onChange={e => setLocal(prev => ({ ...prev, [s.key]: e.target.value }))} className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20">
            {s.opts.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      ))}
      <button onClick={handleSave} disabled={saving} className="h-9 px-4 bg-foreground text-background text-[13px] font-medium disabled:opacity-60 hover:bg-foreground/90 transition-colors">
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}