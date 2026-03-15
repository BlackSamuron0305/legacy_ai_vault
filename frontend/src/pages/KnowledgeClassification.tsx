import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  AlertTriangle, 
  Users, 
  Clock, 
  Shield, 
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2,
  FileText,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface ClassificationResult {
  report_metadata: {
    employee_role: string;
    department: string;
    total_knowledge_items: number;
    criticality_distribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    urgency_breakdown: {
      immediate: number;
      short_term: number;
      medium_term: number;
      ongoing: number;
    };
    overall_risk_score: number;
    knowledge_coverage_score: number;
  };
  classification_results: Array<{
    topic: string;
    classification_matrix: {
      knowledge_type: string;
      criticality: string;
      urgency: string;
      audience: string;
      risk_level: string;
    };
    dependency_analysis: {
      dependencies: string[];
      dependents: string[];
      single_point_of_failure: boolean;
    };
    transfer_complexity: {
      complexity_score: number;
      time_to_transfer: string;
      required_resources: string[];
    };
    confidence_score: number;
  }>;
  risk_assessment: {
    high_risk_items: Array<{
      topic: string;
      risk_description: string;
      mitigation_required: string;
      impact_if_lost: string;
    }>;
    knowledge_gaps: Array<{
      gap_type: string;
      description: string;
      recommendation: string;
    }>;
  };
  action_recommendations: {
    immediate_actions: Array<{
      action: string;
      priority: string;
      deadline: string;
      responsible: string;
    }>;
    knowledge_transfer_plan: Array<{
      item: string;
      method: string;
      timeline: string;
      resources_needed: string[];
    }>;
  };
  organizational_insights: {
    knowledge_health: string;
    documentation_maturity: string;
    succession_readiness: string;
    key_recommendations: string[];
  };
}

export default function KnowledgeClassification() {
  const { id } = useParams();
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    async function fetchClassification() {
      try {
        setLoading(true);
        setError(null);

        const result = await api.getSessionClassification(id);
        setClassification(result.classification);
      } catch (err: any) {
        setError(err?.message || 'Failed to classify report');
      } finally {
        setLoading(false);
      }
    }

    fetchClassification();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Analyzing and classifying knowledge...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!classification) return null;

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return 'text-red-600';
    if (score >= 0.4) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 0.7) return 'bg-red-50 border-red-200';
    if (score >= 0.4) return 'bg-amber-50 border-amber-200';
    return 'bg-emerald-50 border-emerald-200';
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'HEALTHY': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'AT_RISK': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'CRITICAL': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Shield className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Knowledge Classification</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Risk assessment and organizational intelligence analysis
          </p>
        </div>
        <a href={`/app/sessions/${id}/review`} className="h-8 px-4 border border-border text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/[0.04] transition-colors">
          <FileText className="w-3.5 h-3.5" />
          Back to Report
        </a>
      </div>

      {/* Overall Risk Assessment */}
      <Card className={getRiskBgColor(classification.report_metadata.overall_risk_score)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Overall Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getRiskColor(classification.report_metadata.overall_risk_score)}`}>
                {Math.round(classification.report_metadata.overall_risk_score * 100)}%
              </div>
              <p className="text-[13px] text-muted-foreground">Risk Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">
                {classification.report_metadata.total_knowledge_items}
              </div>
              <p className="text-[13px] text-muted-foreground">Knowledge Items</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-emerald-600">
                {Math.round(classification.report_metadata.knowledge_coverage_score * 100)}%
              </div>
              <p className="text-[13px] text-muted-foreground">Coverage</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                {getHealthIcon(classification.organizational_insights.knowledge_health)}
              </div>
              <p className="text-[13px] text-muted-foreground mt-1">
                {classification.organizational_insights.knowledge_health.replace('_', ' ')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criticality & Urgency Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Criticality Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(classification.report_metadata.criticality_distribution).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    level === 'critical' ? 'destructive' :
                    level === 'high' ? 'default' : 'secondary'
                  } className="capitalize">
                    {level}
                  </Badge>
                  <span className="text-[13px]">{count} items</span>
                </div>
                <Progress 
                  value={(count / classification.report_metadata.total_knowledge_items) * 100} 
                  className="w-20"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Urgency Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(classification.report_metadata.urgency_breakdown).map(([urgency, count]) => (
              <div key={urgency} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    urgency === 'immediate' ? 'destructive' :
                    urgency === 'short_term' ? 'default' : 'secondary'
                  } className="capitalize">
                    {urgency.replace('_', ' ')}
                  </Badge>
                  <span className="text-[13px]">{count} items</span>
                </div>
                <Progress 
                  value={(count / classification.report_metadata.total_knowledge_items) * 100} 
                  className="w-20"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* High Risk Items */}
      {classification.risk_assessment.high_risk_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              High Risk Items ({classification.risk_assessment.high_risk_items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classification.risk_assessment.high_risk_items.map((item, i) => (
              <Alert key={i} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-semibold">{item.topic}</div>
                    <div className="text-[13px]">{item.risk_description}</div>
                    <div className="text-[13px] font-medium">
                      <strong>Impact if lost:</strong> {item.impact_if_lost}
                    </div>
                    <div className="text-[13px]">
                      <strong>Mitigation:</strong> {item.mitigation_required}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Immediate Actions */}
      {classification.action_recommendations.immediate_actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Immediate Actions ({classification.action_recommendations.immediate_actions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classification.action_recommendations.immediate_actions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-4 border border-border">
                <div className="w-8 h-8 bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="font-medium">{action.action}</div>
                  <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Badge variant={action.priority === 'HIGH' ? 'destructive' : 'default'}>
                        {action.priority}
                      </Badge>
                    </span>
                    <span>Due: {action.deadline}</span>
                    <span>Responsible: {action.responsible}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Organizational Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Organizational Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-border">
              {getHealthIcon(classification.organizational_insights.knowledge_health)}
              <div className="mt-2 font-semibold">Knowledge Health</div>
              <div className="text-[13px] text-muted-foreground capitalize">
                {classification.organizational_insights.knowledge_health.replace('_', ' ')}
              </div>
            </div>
            <div className="text-center p-4 border border-border">
              <div className="w-8 h-8 bg-foreground/[0.06] flex items-center justify-center mx-auto mb-2">
                <FileText className="w-4 h-4 text-foreground" />
              </div>
              <div className="mt-2 font-semibold">Documentation Maturity</div>
              <div className="text-[13px] text-muted-foreground capitalize">
                {classification.organizational_insights.documentation_maturity.toLowerCase()}
              </div>
            </div>
            <div className="text-center p-4 border border-border">
              <div className="w-8 h-8 bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 font-semibold">Succession Readiness</div>
              <div className="text-[13px] text-muted-foreground capitalize">
                {classification.organizational_insights.succession_readiness.toLowerCase()}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Key Recommendations</h4>
            <div className="space-y-2">
              {classification.organizational_insights.key_recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-[13px]">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
