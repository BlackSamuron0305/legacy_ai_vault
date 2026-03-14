// ===== Database Types =====

export interface Expert {
  id: string;
  name: string;
  department: string | null;
  specialization: string | null;
  created_at: string;
  card_count?: number;
}

export interface Interview {
  id: string;
  expert_id: string;
  transcript: string | null;
  summary: string | null;
  duration_seconds: number | null;
  status: 'in_progress' | 'processing' | 'completed' | 'failed';
  elevenlabs_conversation_id: string | null;
  created_at: string;
}

export interface KnowledgeCard {
  id: string;
  interview_id: string;
  expert_id: string;
  topic: string;
  content: string;
  tags: string[];
  importance: 'low' | 'normal' | 'high' | 'critical';
  created_at: string;
  experts?: Expert;
  interviews?: Interview;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: string[];
  created_at: string;
}

// ===== API Types =====

export interface StartInterviewRequest {
  name: string;
  department: string;
  specialization: string;
}

export interface StartInterviewResponse {
  interview_id: string;
  expert_id: string;
  agent_config: {
    agent_id: string;
    system_prompt: string;
    first_message: string;
  };
}

export interface EndInterviewRequest {
  interview_id: string;
  conversation_id?: string;
  transcript?: string;
}

export interface ChatSource {
  id: string;
  topic: string;
  expert_name: string;
  similarity: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  session_id: string;
}

export interface VaultStats {
  total_cards: number;
  total_experts: number;
  total_interviews: number;
  total_departments: number;
}
