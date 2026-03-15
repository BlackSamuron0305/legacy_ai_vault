const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    getToken(): string | null {
        if (!this.token) {
            this.token = localStorage.getItem('auth_token');
        }
        return this.token;
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const token = this.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers,
        });

        if (res.status === 401) {
            this.setToken(null);
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(error.error || 'Request failed');
        }

        return res.json();
    }

    // Auth
    async login(email: string, password: string) {
        const data = await this.request<any>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setToken(data.session.access_token);
        return data;
    }

    async register(email: string, password: string, fullName: string, companyName?: string, domain?: string) {
        const data = await this.request<any>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, fullName, companyName, domain }),
        });
        this.setToken(data.session.access_token);
        return data;
    }

    async joinCompany() {
        return this.request<any>('/auth/join-company', { method: 'POST' });
    }

    async logout() {
        await this.request('/auth/logout', { method: 'POST' }).catch(() => { });
        this.setToken(null);
    }

    async getMe() {
        return this.request<any>('/auth/me');
    }

    async updateProfile(fullName: string) {
        return this.request<any>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({ fullName }),
        });
    }

    async updateWorkspace(companyName: string) {
        return this.request<any>('/auth/workspace', {
            method: 'PUT',
            body: JSON.stringify({ companyName }),
        });
    }

    // Workspace Settings
    async getSettings() {
        return this.request<any>('/settings');
    }

    async updateSettings(settings: Record<string, any>) {
        return this.request<any>('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    }

    // Employees
    async getEmployees() {
        return this.request<any[]>('/employees');
    }

    async getEmployee(id: string) {
        return this.request<any>(`/employees/${id}`);
    }

    async createEmployee(data: any) {
        return this.request<any>('/employees', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateEmployee(id: string, data: any) {
        return this.request<any>(`/employees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Sessions
    async getSessions() {
        return this.request<any[]>('/sessions');
    }

    async getSession(id: string) {
        return this.request<any>(`/sessions/${id}`);
    }

    async createSession(employeeId?: string | null) {
        return this.request<any>('/sessions', {
            method: 'POST',
            body: JSON.stringify(employeeId ? { employeeId } : {}),
        });
    }

    async startSession(id: string) {
        return this.request<any>(`/sessions/${id}/start`, { method: 'POST' });
    }

    async getSessionToken(id: string) {
        return this.request<{ signed_url: string }>(`/sessions/${id}/token`);
    }

    async getSessionClassification(id: string) {
        return this.request<any>(`/sessions/${id}/classification`);
    }

    async endSession(id: string, data: { transcript: string; duration: string; elevenlabsConversationId?: string }) {
        return this.request<any>(`/sessions/${id}/end`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getSessionTranscript(id: string) {
        return this.request<any[]>(`/sessions/${id}/transcript`);
    }

    async putSessionTranscript(id: string, segments: Array<{ speaker: string; text: string; timestamp?: string }>) {
        return this.request<any>(`/sessions/${id}/transcript`, {
            method: 'PUT',
            body: JSON.stringify({ segments }),
        });
    }

    async reprocessSession(id: string) {
        return this.request<any>(`/sessions/${id}/reprocess`, { method: 'POST' });
    }

    async getSessionReportHtml(id: string): Promise<string> {
        const token = this.getToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/sessions/${id}/report/html`, { headers });
        if (!res.ok) throw new Error('Report not available');
        return res.text();
    }

    async generateSessionPdf(id: string) {
        return this.request<{ reportPdfPath: string; reportHtmlPath: string }>(`/sessions/${id}/report/generate-pdf`, { method: 'POST' });
    }

    async getSessionReportUrls(id: string) {
        return this.request<{ htmlUrl: string; pdfUrl: string | null }>(`/sessions/${id}/report/urls`);
    }

    async getSessionTopics(id: string) {
        return this.request<any[]>(`/sessions/${id}/topics`);
    }

    async approveTranscript(id: string) {
        return this.request<any>(`/sessions/${id}/transcript/approve`, { method: 'PUT' });
    }

    async getProcessingStatus(id: string) {
        return this.request<any>(`/sessions/${id}/processing`);
    }

    // Knowledge
    async getKnowledgeCategories() {
        return this.request<any[]>('/knowledge/categories');
    }

    async getKnowledgeCards() {
        return this.request<any[]>('/knowledge/cards');
    }

    async getKnowledgeStats() {
        return this.request<any>('/knowledge/stats');
    }

    async getCategoryDetail(categoryName: string) {
        return this.request<any>(`/knowledge/${encodeURIComponent(categoryName)}`);
    }

    async chatWithCategory(categoryName: string, question: string, history?: any[]) {
        return this.request<any>(`/knowledge/${encodeURIComponent(categoryName)}/chat`, {
            method: 'POST',
            body: JSON.stringify({ question, history }),
        });
    }

    async searchKnowledge(query: string) {
        return this.request<any[]>('/knowledge/search', {
            method: 'POST',
            body: JSON.stringify({ query }),
        });
    }

    async getKnowledgeDocuments() {
        return this.request<any[]>('/knowledge/documents');
    }

    async uploadKnowledgeDocument(file: File, category?: string) {
        const token = this.getToken();
        const formData = new FormData();
        formData.append('file', file);
        if (category) formData.append('category', category);

        const res = await fetch(`${API_URL}/knowledge/documents`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(error.error || 'Upload failed');
        }

        return res.json();
    }

    // Reports
    async getReports() {
        return this.request<any[]>('/reports');
    }

    async getReport(id: string) {
        return this.request<any>(`/reports/${id}`);
    }

    async createReport(data: any) {
        return this.request<any>('/reports', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateReport(id: string, data: any) {
        return this.request<any>(`/reports/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Analytics
    async getAnalyticsCoverage() {
        return this.request<any[]>('/analytics/coverage');
    }

    async getAnalyticsGaps() {
        return this.request<any[]>('/analytics/gaps');
    }

    async getAnalyticsSummary() {
        return this.request<any>('/analytics/summary');
    }

    // Activity
    async getActivityFeed() {
        return this.request<any[]>('/activity');
    }

    // Chat (RAG)
    async askChat(question: string, sessionId?: string) {
        return this.request<any>('/chat/ask', {
            method: 'POST',
            body: JSON.stringify({ question, sessionId }),
        });
    }

    async getChatHistory(sessionId: string) {
        return this.request<any[]>(`/chat/history/${sessionId}`);
    }

    // Admin — Company
    async getCompany() {
        return this.request<any>('/admin/company');
    }

    async getAllCompanies() {
        return this.request<any[]>('/admin/companies');
    }

    async updateCompany(data: { companyName?: string; domain?: string; industry?: string }) {
        return this.request<any>('/admin/company', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Team — any authenticated user
    async getTeam() {
        return this.request<any[]>('/admin/team');
    }

    // Admin — Members
    async getMembers() {
        return this.request<any[]>('/admin/members');
    }

    async updateMemberRole(id: string, role: string) {
        return this.request<any>(`/admin/members/${id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role }),
        });
    }

    async removeMember(id: string) {
        return this.request<any>(`/admin/members/${id}`, { method: 'DELETE' });
    }

    // Admin — API Keys
    async getApiKeys() {
        return this.request<any[]>('/admin/api-keys');
    }

    async addApiKey(data: { service: string; keyValue: string; label?: string }) {
        return this.request<any>('/admin/api-keys', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteApiKey(id: string) {
        return this.request<any>(`/admin/api-keys/${id}`, { method: 'DELETE' });
    }
}

export const api = new ApiClient();
