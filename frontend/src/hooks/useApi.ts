import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// ===== EMPLOYEES =====
export function useEmployees() {
    return useQuery({ queryKey: ['employees'], queryFn: () => api.getEmployees() });
}

export function useEmployee(id: string) {
    return useQuery({ queryKey: ['employees', id], queryFn: () => api.getEmployee(id), enabled: !!id });
}

export function useCreateEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.createEmployee(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    });
}

export function useUpdateEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.updateEmployee(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    });
}

// ===== SESSIONS =====
export function useSessions() {
    return useQuery({ queryKey: ['sessions'], queryFn: () => api.getSessions() });
}

export function useSession(id: string) {
    return useQuery({ queryKey: ['sessions', id], queryFn: () => api.getSession(id), enabled: !!id });
}

export function useCreateSession() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (employeeId: string) => api.createSession(employeeId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
    });
}

export function useStartSession() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.startSession(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
    });
}

export function useEndSession() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.endSession(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
    });
}

export function useSessionTranscript(id: string) {
    return useQuery({ queryKey: ['sessions', id, 'transcript'], queryFn: () => api.getSessionTranscript(id), enabled: !!id });
}

export function useSessionTopics(id: string) {
    return useQuery({ queryKey: ['sessions', id, 'topics'], queryFn: () => api.getSessionTopics(id), enabled: !!id });
}

export function useApproveTranscript() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.approveTranscript(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
    });
}

export function useProcessingStatus(id: string) {
    return useQuery({
        queryKey: ['sessions', id, 'processing'],
        queryFn: () => api.getProcessingStatus(id),
        enabled: !!id,
        refetchInterval: 3000, // poll every 3 seconds
    });
}

// ===== KNOWLEDGE =====
export function useKnowledgeCategories() {
    return useQuery({ queryKey: ['knowledge', 'categories'], queryFn: () => api.getKnowledgeCategories() });
}

export function useKnowledgeCards() {
    return useQuery({ queryKey: ['knowledge', 'cards'], queryFn: () => api.getKnowledgeCards() });
}

export function useKnowledgeStats() {
    return useQuery({ queryKey: ['knowledge', 'stats'], queryFn: () => api.getKnowledgeStats() });
}

export function useCategoryDetail(name: string) {
    return useQuery({
        queryKey: ['knowledge', 'category', name],
        queryFn: () => api.getCategoryDetail(name),
        enabled: !!name,
    });
}

export function useCategoryChat() {
    return useMutation({
        mutationFn: ({ categoryName, question, history }: { categoryName: string; question: string; history?: any[] }) =>
            api.chatWithCategory(categoryName, question, history),
    });
}

// ===== REPORTS =====
export function useReports() {
    return useQuery({ queryKey: ['reports'], queryFn: () => api.getReports() });
}

export function useReport(id: string) {
    return useQuery({ queryKey: ['reports', id], queryFn: () => api.getReport(id), enabled: !!id });
}

export function useCreateReport() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.createReport(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
    });
}

// ===== ANALYTICS =====
export function useAnalyticsCoverage() {
    return useQuery({ queryKey: ['analytics', 'coverage'], queryFn: () => api.getAnalyticsCoverage() });
}

export function useAnalyticsGaps() {
    return useQuery({ queryKey: ['analytics', 'gaps'], queryFn: () => api.getAnalyticsGaps() });
}

export function useAnalyticsSummary() {
    return useQuery({ queryKey: ['analytics', 'summary'], queryFn: () => api.getAnalyticsSummary() });
}

// ===== ACTIVITY =====
export function useActivityFeed() {
    return useQuery({ queryKey: ['activity'], queryFn: () => api.getActivityFeed(), refetchInterval: 30000 });
}

// ===== CHAT =====
export function useAskChat() {
    return useMutation({
        mutationFn: ({ question, sessionId }: { question: string; sessionId?: string }) =>
            api.askChat(question, sessionId),
    });
}

export function useChatHistory(sessionId: string) {
    return useQuery({
        queryKey: ['chat', sessionId],
        queryFn: () => api.getChatHistory(sessionId),
        enabled: !!sessionId,
    });
}
