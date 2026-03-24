import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useKnowledgeCategories, useKnowledgeDocuments } from "@/hooks/useApi";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BookOpen, Workflow, Handshake, Server, AlertTriangle, Users, History, Star, User, Shield, Upload, Loader2 } from "lucide-react";
import { KnowledgeBaseSkeleton } from "@/components/skeletons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
  const { data: documents = [] } = useKnowledgeDocuments();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("Uploaded");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleUpload = async (file: File) => {
    if (!file || uploading) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown', 'text/plain'];
    if (!allowed.includes(file.type)) {
      toast.error('Invalid file type', { description: 'Use PDF, DOCX, Markdown, or plain text.' });
      return;
    }
    setUploading(true);
    try {
      await api.uploadKnowledgeDocument(file, uploadCategory || undefined);
      toast.success('Uploaded', { description: `${file.name} is being processed.` });
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'categories'] });
      setUploadOpen(false);
      if (uploadCategory && uploadCategory !== 'Uploaded') {
        navigate(`/app/knowledge/${encodeURIComponent(uploadCategory)}`);
      }
    } catch (e: any) {
      toast.error('Upload failed', { description: e?.message || 'Please try again.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return <KnowledgeBaseSkeleton />;
  }
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Knowledge Base</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Captured institutional knowledge organized by category</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="bg-white border border-dashed border-border p-5 hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all flex flex-col items-center justify-center min-h-[140px] text-muted-foreground"
        >
          <Upload className="w-8 h-8 mb-2" />
          <span className="text-[13px] font-medium">Upload documents</span>
          <span className="text-xs mt-0.5">PDF, DOCX, MD, TXT</span>
        </button>
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

      {/* Recent uploads / ingest status */}
      <div className="bg-white border border-border mt-4">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Recent uploads</h2>
          <span className="text-xs text-muted-foreground">{documents.length} documents</span>
        </div>
        {documents.length === 0 ? (
          <div className="p-5 text-[13px] text-muted-foreground">No documents uploaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-border bg-foreground/[0.02]">
                <tr>
                  <th className="px-5 py-2.5 font-medium">File</th>
                  <th className="px-5 py-2.5 font-medium">Category</th>
                  <th className="px-5 py-2.5 font-medium">Size</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d: any) => (
                  <tr key={d.id} className="border-b border-border/70 last:border-b-0">
                    <td className="px-5 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-medium truncate max-w-[220px]">{d.filename}</span>
                        <span className="text-xs text-muted-foreground">{d.mimeType}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-xs text-muted-foreground">{d.category || "Uploaded"}</td>
                    <td className="px-5 py-2.5 text-xs text-muted-foreground">
                      {typeof d.sizeBytes === "number" ? `${(d.sizeBytes / 1024).toFixed(1)} KB` : "—"}
                    </td>
                    <td className="px-5 py-2.5">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-5 py-2.5 text-xs text-muted-foreground max-w-[260px] truncate" title={d.error || ""}>
                      {d.status === "failed" ? (d.error || "Ingest failed") : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-medium text-foreground">Category</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="mt-1 w-full h-9 px-3 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20"
              >
                <option value="Uploaded">Uploaded</option>
                {knowledgeCategories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div
              className={`border-2 border-dashed p-6 text-center transition-colors ${dragOver ? 'border-foreground/30 bg-foreground/[0.04]' : 'border-border'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f) handleUpload(f); }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.md,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
              />
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-[13px] text-muted-foreground">Drop a file or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Max 20MB</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Select file'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}