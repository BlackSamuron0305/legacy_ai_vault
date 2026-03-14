import { Link } from "react-router-dom";
import { knowledgeCategories } from "@/data/mockData";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BookOpen, Workflow, Handshake, Server, AlertTriangle, Users, History, Star, User, Shield } from "lucide-react";

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
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
        <p className="text-sm text-muted-foreground mt-1">Captured institutional knowledge organized by category</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {knowledgeCategories.map((cat) => (
          <Link
            key={cat.id}
            to={`/app/knowledge/${cat.id}`}
            className="bg-card rounded-2xl border border-border shadow-card p-5 hover:shadow-elevated transition-all hover:border-primary/20 group"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {iconMap[cat.icon] || <BookOpen className="w-5 h-5" />}
              </div>
              <StatusBadge status={cat.status} />
            </div>
            <h3 className="font-semibold mt-3">{cat.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{cat.count} knowledge blocks · {cat.sourceSessions} sessions</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${cat.completeness}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{cat.completeness}%</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}