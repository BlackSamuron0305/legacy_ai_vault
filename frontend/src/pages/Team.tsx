import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Crown, UserCheck, FileCheck, Eye, Shield, Trash2 } from "lucide-react";

interface Member {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarInitials: string;
  createdAt: string;
}

const ROLE_ICONS: Record<string, typeof Crown> = {
  admin: Shield,
  owner: Crown,
  member: UserCheck,
  reviewer: FileCheck,
  viewer: Eye,
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  owner: 'Owner',
  member: 'Member',
  reviewer: 'Reviewer',
  viewer: 'Viewer',
};

export default function Team() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const canManage = user?.role === 'owner' || user?.role === 'admin';

  useEffect(() => {
    api.getTeam()
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    await api.updateMemberRole(memberId, newRole);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
  };

  const handleRemoveMember = async (memberId: string) => {
    await api.removeMember(memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Team</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {user?.companyName ? `Members of ${user.companyName}` : 'Your workspace team'}
        </p>
      </div>

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
                  {canManage && m.id !== user?.id && m.role !== 'owner' && m.role !== 'admin' ? (
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
                      <span className="capitalize">{ROLE_LABELS[m.role] || m.role}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {members.length === 0 && (
            <div className="px-5 py-8 text-center text-[13px] text-muted-foreground">
              No team members found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
