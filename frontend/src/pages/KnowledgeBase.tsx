import { Link } from "react-router-dom";
import { useKnowledgeCategories } from "@/hooks/useApi";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BookOpen, Workflow, Handshake, Server, AlertTriangle, Users, History, Star, User, Shield, Loader2 } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  workflow: <Workflow className="w-5 h-5" />,
  handshake: <Handshake className="w-5 h-5" />,
  server: <Server className="w-5 h-5" />,
  alert: <AlertTriangle className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  history: <History className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
  user: <User className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
};

export default function KnowledgeBase() {
  const { data: knowledgeCategories = [], isLoading } = useKnowledgeCategories();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Knowledge Base</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Captured institutional knowledge organized by category</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {knowledgeCategories.map((cat) => (
          <Link
            key={cat.id}
            to={`/app/knowledge/${cat.id}`}
            className="bg-white border border-border p-5 hover:border-foreground/20 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 bg-foreground/[0.06] flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                {iconMap[cat.icon] || <BookOpen className="w-4 h-4" />}
              </div>
              <StatusBadge status={cat.status} />
            </div>
            <h3 className="font-semibold text-[13px] mt-3">{cat.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{cat.count} knowledge blocks · {cat.sourceSessions} sessions</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1 bg-border overflow-hidden">
                <div className="h-full bg-foreground" style={{ width: `${cat.completeness}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{cat.completeness}%</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}