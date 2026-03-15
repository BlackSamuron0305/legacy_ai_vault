import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, Key, Trash2, Crown, Eye, FileCheck, Plus, Building2, Globe, UserCheck } from "lucide-react";

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

interface CompanyOverview {
  id: string;
  companyName: string;
  domain: string | null;
  memberCount: number;
  owner: { id: string; fullName: string; email: string } | null;
  createdAt: string;
}

const API_SERVICES = [
  { id: 'openai', name: 'OpenAI', desc: 'GPT models for extraction & summarization' },
  { id: 'elevenlabs', name: 'ElevenLabs', desc: 'Conversational AI voice interviews' },
  { id: 'huggingface', name: 'HuggingFace', desc: 'Embedding models & inference' },
  { id: 'supabase', name: 'Supabase', desc: 'Database & authentication' },
  { id: 'anthropic', name: 'Anthropic', desc: 'Claude models for analysis' },
  { id: 'pinecone', name: 'Pinecone', desc: 'Vector database for RAG' },
];

// ===== OWNER VIEW: Company Settings =====
function OwnerView() {
  const { user, refreshUser } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDomain, setEditDomain] = useState(false);
  const [domainValue, setDomainValue] = useState('');
  const [editName, setEditName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  useEffect(() => {
    api.getCompany()
      .then(c => { setCompany(c); setDomainValue(c.domain || ''); setNameValue(c.companyName || c.name || ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveDomain = async () => {
    if (!domainValue.trim()) return;
    setSaving(true);
    await api.updateCompany({ domain: domainValue.trim() });
    setCompany(prev => prev ? { ...prev, domain: domainValue.trim() } : prev);
    setEditDomain(false);
    setSaving(false);
    await refreshUser();
  };

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSaving(true);
    await api.updateCompany({ companyName: nameValue.trim() });
    setCompany(prev => prev ? { ...prev, companyName: nameValue.trim(), name: nameValue.trim() } : prev);
    setEditName(false);
    setSaving(false);
    await refreshUser();
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight">Company</h1>
          <span className="text-[10px] font-semibold uppercase tracking-wider border border-foreground/25 text-foreground/70 px-1.5 py-0.5 leading-none">Owner</span>
        </div>
        <p className="text-[13px] text-muted-foreground mt-1">Manage your company settings</p>
      </div>

      <div className="bg-white border border-border">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" /> Company Info
          </h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Company Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[13px]">Company name</span>
            </div>
            {editName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  placeholder="Company name"
                  className="h-8 px-3 border border-border bg-white text-[13px] w-48 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
                <Button size="sm" className="h-8 text-[13px] rounded-none bg-foreground text-background hover:bg-foreground/90" onClick={handleSaveName} disabled={saving}>Save</Button>
                <Button size="sm" variant="ghost" className="h-8 text-[13px] rounded-none" onClick={() => setEditName(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">{company?.companyName || company?.name}</span>
                <Button size="sm" variant="ghost" className="h-7 text-[11px] rounded-none" onClick={() => setEditName(true)}>Edit</Button>
              </div>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Email Domain */}
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

          <div className="h-px bg-border" />

          {/* Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[13px]">Team size</span>
            </div>
            <span className="text-[13px] font-medium">{company?.memberCount} member{company?.memberCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== ADMIN VIEW: All Companies + API Keys =====
function AdminView() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyOverview[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getAllCompanies(),
      api.getApiKeys().catch(() => [] as ApiKey[]),
    ])
      .then(([c, k]) => { setCompanies(c); setApiKeys(k); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
          <span className="text-[10px] font-semibold uppercase tracking-wider border border-foreground/25 text-foreground/70 px-1.5 py-0.5 leading-none">Platform</span>
        </div>
        <p className="text-[13px] text-muted-foreground mt-1">Platform overview — all registered companies</p>
      </div>

      {/* All Companies */}
      <div className="bg-white border border-border">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" /> Companies
          </h2>
          <span className="text-xs text-muted-foreground">{companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}</span>
        </div>
        <div className="divide-y divide-border">
          {companies.map(c => (
            <div key={c.id} className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-foreground/[0.06] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-foreground/50" />
                </div>
                <div>
                  <div className="text-[13px] font-medium">{c.companyName}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    {c.domain && <span className="font-mono">@{c.domain}</span>}
                    <span>·</span>
                    <span>{c.memberCount} member{c.memberCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {c.owner ? (
                  <div>
                    <div className="text-[12px] font-medium flex items-center gap-1.5 justify-end">
                      <Crown className="w-3 h-3 text-foreground/40" />
                      {c.owner.fullName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{c.owner.email}</div>
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground">No owner</span>
                )}
              </div>
            </div>
          ))}
          {companies.length === 0 && (
            <div className="px-5 py-8 text-center text-[13px] text-muted-foreground">
              No companies registered yet.
            </div>
          )}
        </div>
      </div>

      {/* API Keys */}
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
    </div>
  );
}

// ===== MAIN EXPORT =====
export default function Admin() {
  const { user } = useAuth();

  if (user?.role === 'admin') return <AdminView />;
  if (user?.role === 'owner') return <OwnerView />;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white border border-border p-12 text-center">
        <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <h2 className="font-semibold text-[15px]">Access Restricted</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Only company owners and platform admins can access this page.</p>
      </div>
    </div>
  );
}
