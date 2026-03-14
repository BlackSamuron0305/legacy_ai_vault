import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, Key, Trash2, Crown, Eye, FileCheck, Plus, Building2, Globe, UserCheck } from "lucide-react";

interface Member {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarInitials: string;
  createdAt: string;
}

interface ApiKey {
  id: string;
  service: string;
  keyValue: string;
  label: string | null;
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
  companyName: string;
  domain: string | null;
  industry: string | null;
  memberCount: number;
}

const API_SERVICES = [
  { id: 'openai', name: 'OpenAI', desc: 'GPT models for extraction & summarization' },
  { id: 'elevenlabs', name: 'ElevenLabs', desc: 'Conversational AI voice interviews' },
  { id: 'huggingface', name: 'HuggingFace', desc: 'Embedding models & inference' },
  { id: 'supabase', name: 'Supabase', desc: 'Database & authentication' },
  { id: 'anthropic', name: 'Anthropic', desc: 'Claude models for analysis' },
  { id: 'pinecone', name: 'Pinecone', desc: 'Vector database for RAG' },
];

const ROLE_ICONS: Record<string, typeof Crown> = {
  admin: Shield,
  owner: Crown,
  member: UserCheck,
  reviewer: FileCheck,
  viewer: Eye,
};

export default function Admin() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [editDomain, setEditDomain] = useState(false);
  const [domainValue, setDomainValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [m, k, c] = await Promise.all([
        api.getMembers(),
        api.getApiKeys(),
        api.getCompany(),
      ]);
      setMembers(m);
      setApiKeys(k);
      setCompany(c);
      setDomainValue(c.domain || '');
    } catch {
      // User may not be admin
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    await api.updateMemberRole(memberId, newRole);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
  };

  const handleRemoveMember = async (memberId: string) => {
    await api.removeMember(memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleAddKey = async (service: string) => {
    if (!newKeyValue.trim()) return;
    setSaving(true);
    const result = await api.addApiKey({ service, keyValue: newKeyValue.trim() });
    setApiKeys(prev => {
      const exists = prev.findIndex(k => k.service === service);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = result;
        return updated;
      }
      return [...prev, result];
    });
    setAddingKey(null);
    setNewKeyValue('');
    setSaving(false);
  };

  const handleDeleteKey = async (keyId: string) => {
    await api.deleteApiKey(keyId);
    setApiKeys(prev => prev.filter(k => k.id !== keyId));
  };

  const handleSaveDomain = async () => {
    if (!domainValue.trim()) return;
    setSaving(true);
    await api.updateCompany({ domain: domainValue.trim() });
    setCompany(prev => prev ? { ...prev, domain: domainValue.trim() } : prev);
    setEditDomain(false);
    setSaving(false);
  };

  if (user?.role !== 'admin' && user?.role !== 'owner') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white border border-border p-12 text-center">
          <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-semibold text-[15px]">Company Access Required</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Only the company owner can access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight">Company</h1>
          <span className="text-[10px] font-semibold uppercase tracking-wider border border-foreground/25 text-foreground/70 px-1.5 py-0.5 leading-none">Company</span>
        </div>
        <p className="text-[13px] text-muted-foreground mt-1">Manage your company, team members, and API keys</p>
      </div>

      {/* Company Info */}
      <div className="bg-white border border-border">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" /> Company
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[15px] font-semibold">{company?.companyName || company?.name}</div>
              <div className="text-[13px] text-muted-foreground mt-0.5">{company?.memberCount} member{company?.memberCount !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[13px]">Email domain</span>
            </div>
            {editDomain ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={domainValue}
                  onChange={e => setDomainValue(e.target.value)}
                  placeholder="company.com"
                  className="h-8 px-3 border border-border bg-white text-[13px] w-48 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
                <Button size="sm" className="h-8 text-[13px] rounded-none bg-foreground text-background hover:bg-foreground/90" onClick={handleSaveDomain} disabled={saving}>Save</Button>
                <Button size="sm" variant="ghost" className="h-8 text-[13px] rounded-none" onClick={() => setEditDomain(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-muted-foreground font-mono">{company?.domain || 'Not set'}</span>
                <Button size="sm" variant="ghost" className="h-7 text-[11px] rounded-none" onClick={() => setEditDomain(true)}>Edit</Button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">Users who register with a @{company?.domain || 'your-domain.com'} email will automatically join this workspace.</p>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white border border-border">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Team Members
          </h2>
          <span className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="divide-y divide-border">
          {members.map(m => {
            const RoleIcon = ROLE_ICONS[m.role] || Eye;
            return (
              <div key={m.id} className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-foreground/[0.06] flex items-center justify-center text-[11px] font-semibold text-foreground/60">
                    {m.avatarInitials}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium flex items-center gap-2">
                      {m.fullName}
                      {m.id === user?.id && <span className="text-[10px] text-muted-foreground">(you)</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{m.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.id !== user?.id ? (
                    <>
                      <select
                        value={m.role}
                        onChange={e => handleRoleChange(m.id, e.target.value)}
                        className="h-7 px-2 border border-border bg-white text-[11px] focus:outline-none focus:ring-1 focus:ring-foreground/20"
                      >
                        <option value="member">Member</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button onClick={() => handleRemoveMember(m.id)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <RoleIcon className="w-3 h-3" />
                      <span className="capitalize">{m.role}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* API Keys — only visible to platform admin */}
      {user?.role === 'admin' && (
      <div className="bg-white border border-border">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Key className="w-3.5 h-3.5" /> API Keys
          </h2>
        </div>
        <div className="divide-y divide-border">
          {API_SERVICES.map(svc => {
            const existing = apiKeys.find(k => k.service === svc.id);
            const isAdding = addingKey === svc.id;
            return (
              <div key={svc.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium">{svc.name}</div>
                    <div className="text-[11px] text-muted-foreground">{svc.desc}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {existing && !isAdding && (
                      <>
                        <span className="text-[11px] font-mono text-muted-foreground bg-foreground/[0.04] px-2 py-1">{existing.keyValue}</span>
                        <button onClick={() => handleDeleteKey(existing.id)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setAddingKey(svc.id); setNewKeyValue(''); }} className="text-[11px] text-muted-foreground hover:text-foreground">Replace</button>
                      </>
                    )}
                    {!existing && !isAdding && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] rounded-none border-border"
                        onClick={() => { setAddingKey(svc.id); setNewKeyValue(''); }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Key
                      </Button>
                    )}
                  </div>
                </div>
                {isAdding && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="password"
                      value={newKeyValue}
                      onChange={e => setNewKeyValue(e.target.value)}
                      placeholder={`Enter ${svc.name} API key...`}
                      className="flex-1 h-8 px-3 border border-border bg-white text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-foreground/20"
                      autoFocus
                    />
                    <Button size="sm" className="h-8 text-[13px] rounded-none bg-foreground text-background hover:bg-foreground/90" onClick={() => handleAddKey(svc.id)} disabled={saving || !newKeyValue.trim()}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-[13px] rounded-none" onClick={() => { setAddingKey(null); setNewKeyValue(''); }}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}
