import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface WorkspaceSettings {
  interviewTone: string;
  followUpDepth: string;
  knowledgeProbing: string;
  outputStructure: string;
  requireApproval: boolean;
  allowEditing: boolean;
  highlightLowConfidence: boolean;
  notifyReviewer: boolean;
  allowReRecord: boolean;
  reportFormat: string;
  knowledgeCategorization: string;
  exportFormat: string;
  ragChunking: string;
  notifySessionReminders: boolean;
  notifyTranscriptReady: boolean;
  notifyReportFinalized: boolean;
  notifyKnowledgeGaps: boolean;
  notifyWeeklyDigest: boolean;
  notifyInApp: boolean;
  theme: string;
  density: string;
  dateFormat: string;
  language: string;
}

const defaults: WorkspaceSettings = {
  interviewTone: 'Professional',
  followUpDepth: 'Standard (5-10 follow-ups)',
  knowledgeProbing: 'Moderate',
  outputStructure: 'Structured categories',
  requireApproval: true,
  allowEditing: true,
  highlightLowConfidence: true,
  notifyReviewer: true,
  allowReRecord: true,
  reportFormat: 'Structured Documentation',
  knowledgeCategorization: 'Automatic (AI-suggested)',
  exportFormat: 'Markdown',
  ragChunking: 'Paragraph-level',
  notifySessionReminders: true,
  notifyTranscriptReady: true,
  notifyReportFinalized: true,
  notifyKnowledgeGaps: true,
  notifyWeeklyDigest: true,
  notifyInApp: true,
  theme: 'Light',
  density: 'Comfortable',
  dateFormat: 'DD/MM/YYYY',
  language: 'English',
};

export function useSettings() {
  const [settings, setSettings] = useState<WorkspaceSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((data) => setSettings({ ...defaults, ...data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = useCallback(async (partial: Partial<WorkspaceSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
    setSaving(true);
    try {
      const data = await api.updateSettings(partial);
      setSettings(prev => ({ ...prev, ...data }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, saved, update, setSettings };
}
