import { pgTable, uuid, text, integer, timestamp, customType, real, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Custom type for pgvector
const vector = customType<{ data: number[]; driverInput: string }>({
    dataType() {
        return 'vector(1536)';
    },
    toDriver(value: number[]): string {
        return `[${value.join(',')}]`;
    },
});

// ===== WORKSPACES =====
export const workspaces = pgTable('workspaces', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    companyName: text('company_name'),
    industry: text('industry'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ===== USERS (linked to Supabase Auth) =====
export const users = pgTable('users', {
    id: uuid('id').primaryKey(), // = supabase auth.users.id
    email: text('email').notNull(),
    fullName: text('full_name').notNull(),
    role: text('role').default('viewer'), // admin, reviewer, viewer
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    avatarInitials: text('avatar_initials'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const usersRelations = relations(users, ({ one }) => ({
    workspace: one(workspaces, { fields: [users.workspaceId], references: [workspaces.id] }),
}));

// ===== EMPLOYEES (departing experts) =====
export const employees = pgTable('employees', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    role: text('role'),
    department: text('department'),
    email: text('email'),
    avatarInitials: text('avatar_initials'),
    exitDate: text('exit_date'),
    tenure: text('tenure'),
    sessionStatus: text('session_status').default('not_started'), // not_started, scheduled, in_progress, completed
    transcriptStatus: text('transcript_status').default('none'), // none, generated, under_review, approved
    coverageScore: real('coverage_score').default(0),
    riskLevel: text('risk_level').default('medium'), // low, medium, high, critical
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const employeesRelations = relations(employees, ({ many, one }) => ({
    sessions: many(sessions),
    workspace: one(workspaces, { fields: [employees.workspaceId], references: [workspaces.id] }),
}));

// ===== SESSIONS (interview sessions) =====
export const sessions = pgTable('sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }),
    status: text('status').default('scheduled'), // scheduled, in_progress, awaiting_review, awaiting_approval, processing, finalized
    lastActivity: timestamp('last_activity', { withTimezone: true }).defaultNow(),
    coverageScore: real('coverage_score').default(0),
    transcriptStatus: text('transcript_status').default('pending'), // pending, generated, reviewed, approved
    reportStatus: text('report_status').default('pending'), // pending, generating, draft, finalized
    duration: text('duration'),
    topicsExtracted: integer('topics_extracted').default(0),
    transcript: text('transcript'),
    summary: text('summary'),
    elevenlabsConversationId: text('elevenlabs_conversation_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
    employee: one(employees, { fields: [sessions.employeeId], references: [employees.id] }),
    workspace: one(workspaces, { fields: [sessions.workspaceId], references: [workspaces.id] }),
    knowledgeCards: many(knowledgeCards),
    transcriptSegments: many(transcriptSegments),
}));

// ===== TRANSCRIPT SEGMENTS =====
export const transcriptSegments = pgTable('transcript_segments', {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
    timestamp: text('timestamp').notNull(),
    speaker: text('speaker').notNull(), // ai, employee
    text: text('text').notNull(),
    orderIndex: integer('order_index').default(0),
});

export const transcriptSegmentsRelations = relations(transcriptSegments, ({ one }) => ({
    session: one(sessions, { fields: [transcriptSegments.sessionId], references: [sessions.id] }),
}));

// ===== KNOWLEDGE CARDS =====
export const knowledgeCards = pgTable('knowledge_cards', {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }),
    topic: text('topic').notNull(),
    content: text('content').notNull(),
    category: text('category'), // matches knowledgeCategories
    tags: text('tags').array().default([]),
    importance: text('importance').default('normal'),
    confidence: real('confidence').default(0),
    embedding: vector('embedding'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const knowledgeCardsRelations = relations(knowledgeCards, ({ one }) => ({
    employee: one(employees, { fields: [knowledgeCards.employeeId], references: [employees.id] }),
    session: one(sessions, { fields: [knowledgeCards.sessionId], references: [sessions.id] }),
}));

// ===== KNOWLEDGE CATEGORIES =====
export const knowledgeCategories = pgTable('knowledge_categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon').default('folder'),
    status: text('status').default('draft'), // draft, reviewed, finalized
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ===== REPORTS =====
export const reports = pgTable('reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'set null' }),
    employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    type: text('type').default('Handover Report'), // Handover Report, Knowledge Summary, Category Report, Team Summary
    content: text('content'),
    status: text('status').default('draft'), // draft, reviewed, finalized
    exportStatus: text('export_status').default('pending'), // pending, ready, exported
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const reportsRelations = relations(reports, ({ one }) => ({
    session: one(sessions, { fields: [reports.sessionId], references: [sessions.id] }),
    employee: one(employees, { fields: [reports.employeeId], references: [employees.id] }),
    workspace: one(workspaces, { fields: [reports.workspaceId], references: [workspaces.id] }),
}));

// ===== CHAT MESSAGES =====
export const chatMessages = pgTable('chat_messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').notNull(),
    role: text('role').notNull(),
    content: text('content').notNull(),
    sources: uuid('sources').array().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ===== ACTIVITY FEED =====
export const activities = pgTable('activities', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // session_completed, transcript_ready, report_finalized, etc.
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
