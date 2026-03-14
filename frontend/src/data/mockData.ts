export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  avatar: string;
  exitDate: string;
  tenure: string;
  sessionStatus: 'not_started' | 'scheduled' | 'in_progress' | 'completed';
  transcriptStatus: 'none' | 'generated' | 'under_review' | 'approved';
  coverageScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface Session {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  department: string;
  status: 'scheduled' | 'in_progress' | 'awaiting_review' | 'awaiting_approval' | 'processing' | 'finalized';
  lastActivity: string;
  coverageScore: number;
  transcriptStatus: 'pending' | 'generated' | 'reviewed' | 'approved';
  reportStatus: 'pending' | 'generating' | 'draft' | 'finalized';
  duration: string;
  topicsExtracted: number;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  completeness: number;
  sourceSessions: number;
  status: 'draft' | 'reviewed' | 'finalized';
}

export interface Report {
  id: string;
  title: string;
  employee: string;
  type: string;
  lastUpdated: string;
  status: 'draft' | 'reviewed' | 'finalized';
  exportStatus: 'pending' | 'ready' | 'exported';
}

export const employees: Employee[] = [
  { id: '1', name: 'Sarah Jenkins', role: 'Senior Staff Engineer', department: 'Engineering', email: 'sarah.jenkins@company.com', avatar: 'SJ', exitDate: '2026-04-15', tenure: '8 years', sessionStatus: 'completed', transcriptStatus: 'approved', coverageScore: 92, riskLevel: 'critical' },
  { id: '2', name: 'Marcus Chen', role: 'VP of Operations', department: 'Operations', email: 'marcus.chen@company.com', avatar: 'MC', exitDate: '2026-03-28', tenure: '6 years', sessionStatus: 'in_progress', transcriptStatus: 'under_review', coverageScore: 64, riskLevel: 'critical' },
  { id: '3', name: 'Elena Rodriguez', role: 'Customer Success Lead', department: 'Customer Success', email: 'elena.rodriguez@company.com', avatar: 'ER', exitDate: '2026-04-05', tenure: '4 years', sessionStatus: 'completed', transcriptStatus: 'approved', coverageScore: 88, riskLevel: 'high' },
  { id: '4', name: 'David Park', role: 'Security Architect', department: 'Engineering', email: 'david.park@company.com', avatar: 'DP', exitDate: '2026-05-01', tenure: '5 years', sessionStatus: 'scheduled', transcriptStatus: 'none', coverageScore: 0, riskLevel: 'critical' },
  { id: '5', name: 'Lisa Thompson', role: 'Product Manager', department: 'Product', email: 'lisa.thompson@company.com', avatar: 'LT', exitDate: '2026-04-20', tenure: '3 years', sessionStatus: 'not_started', transcriptStatus: 'none', coverageScore: 0, riskLevel: 'high' },
  { id: '6', name: 'James Wilson', role: 'DevOps Lead', department: 'Engineering', email: 'james.wilson@company.com', avatar: 'JW', exitDate: '2026-04-10', tenure: '7 years', sessionStatus: 'completed', transcriptStatus: 'generated', coverageScore: 45, riskLevel: 'high' },
  { id: '7', name: 'Anna Kowalski', role: 'Data Engineering Manager', department: 'Data', email: 'anna.k@company.com', avatar: 'AK', exitDate: '2026-05-15', tenure: '5 years', sessionStatus: 'not_started', transcriptStatus: 'none', coverageScore: 0, riskLevel: 'medium' },
  { id: '8', name: 'Robert Kim', role: 'Finance Director', department: 'Finance', email: 'robert.kim@company.com', avatar: 'RK', exitDate: '2026-06-01', tenure: '9 years', sessionStatus: 'scheduled', transcriptStatus: 'none', coverageScore: 0, riskLevel: 'high' },
];

export const sessions: Session[] = [
  { id: 's1', employeeId: '1', employeeName: 'Sarah Jenkins', employeeRole: 'Senior Staff Engineer', department: 'Engineering', status: 'finalized', lastActivity: '2026-03-10', coverageScore: 92, transcriptStatus: 'approved', reportStatus: 'finalized', duration: '1h 24m', topicsExtracted: 18 },
  { id: 's2', employeeId: '2', employeeName: 'Marcus Chen', employeeRole: 'VP of Operations', department: 'Operations', status: 'awaiting_approval', lastActivity: '2026-03-13', coverageScore: 64, transcriptStatus: 'generated', reportStatus: 'pending', duration: '58m', topicsExtracted: 12 },
  { id: 's3', employeeId: '3', employeeName: 'Elena Rodriguez', employeeRole: 'Customer Success Lead', department: 'Customer Success', status: 'finalized', lastActivity: '2026-03-08', coverageScore: 88, transcriptStatus: 'approved', reportStatus: 'finalized', duration: '1h 12m', topicsExtracted: 15 },
  { id: 's4', employeeId: '4', employeeName: 'David Park', employeeRole: 'Security Architect', department: 'Engineering', status: 'scheduled', lastActivity: '2026-03-14', coverageScore: 0, transcriptStatus: 'pending', reportStatus: 'pending', duration: '—', topicsExtracted: 0 },
  { id: 's5', employeeId: '6', employeeName: 'James Wilson', employeeRole: 'DevOps Lead', department: 'Engineering', status: 'awaiting_review', lastActivity: '2026-03-12', coverageScore: 45, transcriptStatus: 'generated', reportStatus: 'pending', duration: '47m', topicsExtracted: 8 },
  { id: 's6', employeeId: '1', employeeName: 'Sarah Jenkins', employeeRole: 'Senior Staff Engineer', department: 'Engineering', status: 'finalized', lastActivity: '2026-03-06', coverageScore: 85, transcriptStatus: 'approved', reportStatus: 'finalized', duration: '1h 05m', topicsExtracted: 14 },
];

export const knowledgeCategories: KnowledgeCategory[] = [
  { id: 'k1', name: 'Critical Workflows', icon: 'workflow', count: 24, completeness: 87, sourceSessions: 4, status: 'finalized' },
  { id: 'k2', name: 'Vendor Relationships', icon: 'handshake', count: 12, completeness: 72, sourceSessions: 3, status: 'reviewed' },
  { id: 'k3', name: 'Infrastructure & Systems', icon: 'server', count: 31, completeness: 91, sourceSessions: 5, status: 'finalized' },
  { id: 'k4', name: 'Incident Response', icon: 'alert', count: 18, completeness: 65, sourceSessions: 3, status: 'draft' },
  { id: 'k5', name: 'People & Stakeholders', icon: 'users', count: 15, completeness: 78, sourceSessions: 4, status: 'reviewed' },
  { id: 'k6', name: 'Historical Decisions', icon: 'history', count: 22, completeness: 58, sourceSessions: 3, status: 'draft' },
  { id: 'k7', name: 'Edge Cases & Exceptions', icon: 'warning', count: 9, completeness: 82, sourceSessions: 2, status: 'reviewed' },
  { id: 'k8', name: 'Best Practices', icon: 'star', count: 19, completeness: 94, sourceSessions: 4, status: 'finalized' },
  { id: 'k9', name: 'Customer Context', icon: 'user', count: 14, completeness: 69, sourceSessions: 2, status: 'draft' },
  { id: 'k10', name: 'Security Protocols', icon: 'shield', count: 8, completeness: 45, sourceSessions: 1, status: 'draft' },
];

export const reports: Report[] = [
  { id: 'r1', title: 'Engineering Lead Offboarding — Sarah Jenkins', employee: 'Sarah Jenkins', type: 'Handover Report', lastUpdated: '2026-03-10', status: 'finalized', exportStatus: 'exported' },
  { id: 'r2', title: 'Operations Knowledge Summary — Marcus Chen', employee: 'Marcus Chen', type: 'Knowledge Summary', lastUpdated: '2026-03-13', status: 'draft', exportStatus: 'pending' },
  { id: 'r3', title: 'Customer Success Handover — Elena Rodriguez', employee: 'Elena Rodriguez', type: 'Handover Report', lastUpdated: '2026-03-08', status: 'finalized', exportStatus: 'ready' },
  { id: 'r4', title: 'DevOps Infrastructure Guide — James Wilson', employee: 'James Wilson', type: 'Category Report', lastUpdated: '2026-03-12', status: 'draft', exportStatus: 'pending' },
  { id: 'r5', title: 'Q1 2026 Knowledge Capture Summary', employee: 'Multiple', type: 'Team Summary', lastUpdated: '2026-03-11', status: 'reviewed', exportStatus: 'ready' },
];

export const transcriptSegments = [
  { timestamp: '00:00:12', speaker: 'ai', text: "Welcome, Sarah. Let's start with your engineering leadership responsibilities. Can you walk me through the critical systems your team maintains?" },
  { timestamp: '00:00:45', speaker: 'employee', text: "Sure. The main ones are the CI/CD pipeline, the production deployment system, and the nightly batch processing infrastructure. The CI/CD pipeline runs on Jenkins-Master-01, and it has a known memory leak that we've been managing manually for about two years." },
  { timestamp: '00:01:32', speaker: 'ai', text: "That's important context. Can you explain the manual process for managing the Jenkins memory leak? Who needs to know about this?" },
  { timestamp: '00:01:58', speaker: 'employee', text: "Every Tuesday and Thursday, someone on the team needs to SSH into the production jump box and run the restart_sync.sh script. But—and this is critical—you have to check the S3 bucket size first. If it's over 500GB, you need to run the cleanup script before restarting, or the whole pipeline will hang." },
  { timestamp: '00:02:45', speaker: 'ai', text: "You mentioned the 'Nightly Batch' often fails on Tuesdays. Can you walk me through the manual restart process and who needs to be notified?" },
  { timestamp: '00:03:12', speaker: 'employee', text: "Right, so the Tuesday failure is usually due to the upstream vendor sync from Acme Corp. Their data feed comes in late on Mondays because of timezone issues. When the batch fails, you need to notify the data team lead—currently that's Anna Kowalski—and the on-call engineer. Don't restart the batch until Anna confirms the upstream data is complete." },
  { timestamp: '00:04:01', speaker: 'ai', text: "This vendor dependency seems critical. Are there other vendors with similar timing issues that the team should be aware of?" },
  { timestamp: '00:04:28', speaker: 'employee', text: "Yes, two others. DataFlow Inc sends their API updates every first Monday of the month, and if you miss the 6am window, you have to manually trigger the sync. And CloudMetrics—they changed their authentication flow six months ago, and we had to create a custom adapter. That adapter code is in a private repo that only I and James have access to." },
  { timestamp: '00:05:15', speaker: 'ai', text: "Let's make sure we capture the access details. Who else should have access to these critical repositories, and are there any documented procedures for granting access?" },
  { timestamp: '00:05:42', speaker: 'employee', text: "That's actually a gap we never addressed. The CloudMetrics adapter repo should be transferred to the team's shared GitHub organization. I'd recommend giving access to David Park and whoever replaces me. The credentials for the adapter are stored in our Vault instance under /prod/cloudmetrics/adapter." },
  { timestamp: '00:06:30', speaker: 'ai', text: "Excellent. Now let's talk about incident response. What happens when there's a production incident outside of business hours?" },
  { timestamp: '00:06:55', speaker: 'employee', text: "The on-call engineer gets paged through PagerDuty. But there are certain incidents—specifically anything touching the payment processing pipeline—where you absolutely must escalate to me, or after I leave, to the VP of Engineering directly. Don't follow the standard escalation path for payment issues. We learned this the hard way after the incident in October 2024." },
];

export const extractedTopics = [
  { name: 'CI/CD Pipeline', confidence: 0.98, category: 'Infrastructure & Systems' },
  { name: 'Jenkins Memory Leak', confidence: 0.95, category: 'Critical Workflows' },
  { name: 'Vendor: Acme Corp', confidence: 0.92, category: 'Vendor Relationships' },
  { name: 'Nightly Batch Process', confidence: 0.97, category: 'Critical Workflows' },
  { name: 'Incident Escalation', confidence: 0.89, category: 'Incident Response' },
  { name: 'Vendor: DataFlow Inc', confidence: 0.88, category: 'Vendor Relationships' },
  { name: 'Vendor: CloudMetrics', confidence: 0.94, category: 'Vendor Relationships' },
  { name: 'Payment Pipeline', confidence: 0.96, category: 'Critical Workflows' },
  { name: 'Access Management', confidence: 0.85, category: 'Security Protocols' },
  { name: 'On-Call Procedures', confidence: 0.91, category: 'Incident Response' },
  { name: 'Manual Workarounds', confidence: 0.93, category: 'Edge Cases & Exceptions' },
  { name: 'Production Deployment', confidence: 0.90, category: 'Infrastructure & Systems' },
];

export const activityFeed = [
  { id: 'a1', type: 'session_completed', message: 'Knowledge capture session completed for Sarah Jenkins', time: '2 hours ago' },
  { id: 'a2', type: 'transcript_ready', message: 'Transcript ready for review — Marcus Chen session', time: '4 hours ago' },
  { id: 'a3', type: 'report_finalized', message: 'Handover report finalized for Elena Rodriguez', time: '1 day ago' },
  { id: 'a4', type: 'session_scheduled', message: 'Session scheduled with David Park for March 18', time: '1 day ago' },
  { id: 'a5', type: 'export_ready', message: 'RAG export package ready — Engineering Knowledge Pack', time: '2 days ago' },
  { id: 'a6', type: 'knowledge_gap', message: 'Critical knowledge gap detected: Security Protocols (45% coverage)', time: '2 days ago' },
  { id: 'a7', type: 'approval', message: 'Transcript approved for processing — Sarah Jenkins Session 2', time: '3 days ago' },
];

export const demoScenarios = [
  {
    id: 'd1',
    title: 'Senior Engineer Leaving After 8 Years',
    description: 'Sarah Jenkins, Senior Staff Engineer, is leaving after 8 years. She holds critical knowledge about CI/CD infrastructure, vendor relationships, incident response procedures, and undocumented manual processes.',
    employee: 'Sarah Jenkins',
    role: 'Senior Staff Engineer',
    department: 'Engineering',
    tenure: '8 years',
    expectedCategories: ['CI/CD Pipeline', 'Vendor Management', 'Incident Response', 'Manual Workarounds', 'Access Management'],
    expectedOutputs: ['Handover Report', 'Infrastructure Guide', 'Vendor Relationship Summary', 'Incident Playbook'],
    riskLevel: 'critical' as const,
  },
  {
    id: 'd2',
    title: 'Customer Success Lead Handover',
    description: 'Elena Rodriguez, Customer Success Lead, manages relationships with 47 enterprise accounts. She has deep context on customer histories, escalation patterns, and renewal strategies that are not documented anywhere.',
    employee: 'Elena Rodriguez',
    role: 'Customer Success Lead',
    department: 'Customer Success',
    tenure: '4 years',
    expectedCategories: ['Customer Relationships', 'Escalation Procedures', 'Renewal Strategies', 'Account History'],
    expectedOutputs: ['Customer Handover Pack', 'Account Context Summary', 'Escalation Guide'],
    riskLevel: 'high' as const,
  },
  {
    id: 'd3',
    title: 'Operations Manager Offboarding',
    description: 'Marcus Chen, VP of Operations, oversees all operational processes including vendor procurement, compliance workflows, and budget management. Many processes exist only in his head.',
    employee: 'Marcus Chen',
    role: 'VP of Operations',
    department: 'Operations',
    tenure: '6 years',
    expectedCategories: ['Procurement Process', 'Compliance Workflows', 'Budget Management', 'Vendor Relationships'],
    expectedOutputs: ['Operations Playbook', 'Vendor Management Guide', 'Compliance Checklist'],
    riskLevel: 'critical' as const,
  },
  {
    id: 'd4',
    title: 'Executive / Founder Transition',
    description: 'Simulated scenario of a founding CTO transitioning out. Covers strategic decisions, technical debt rationale, architecture evolution, and key stakeholder relationships built over a decade.',
    employee: 'Simulated CTO',
    role: 'Chief Technology Officer',
    department: 'Executive',
    tenure: '10 years',
    expectedCategories: ['Strategic Decisions', 'Technical Debt', 'Architecture History', 'Key Relationships', 'Vision & Roadmap'],
    expectedOutputs: ['Strategic Context Document', 'Architecture Decision Records', 'Stakeholder Map', 'Technical Debt Inventory'],
    riskLevel: 'critical' as const,
  },
];

export const teamMembers = [
  { id: 't1', name: 'Alex Rivera', email: 'alex@company.com', role: 'Admin', department: 'HR Operations', avatar: 'AR', status: 'active' },
  { id: 't2', name: 'Jordan Lee', email: 'jordan@company.com', role: 'Reviewer', department: 'Engineering', avatar: 'JL', status: 'active' },
  { id: 't3', name: 'Casey Morgan', email: 'casey@company.com', role: 'Reviewer', department: 'Customer Success', avatar: 'CM', status: 'active' },
  { id: 't4', name: 'Taylor Brooks', email: 'taylor@company.com', role: 'Viewer', department: 'Finance', avatar: 'TB', status: 'invited' },
];