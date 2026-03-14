import { pgTable, uuid, text, integer, timestamp, customType } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Custom type for pgvector
const vector = customType<{ data: number[]; dpiverInput: string }>({
    dataType() {
        return 'vector(1536)';
    },
    toDriver(value: number[]): string {
        return `[${value.join(',')}]`;
    },
});

// ===== EXPERTS =====
export const experts = pgTable('experts', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    department: text('department'),
    specialization: text('specialization'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const expertsRelations = relations(experts, ({ many }) => ({
    interviews: many(interviews),
    knowledgeCards: many(knowledgeCards),
}));

// ===== INTERVIEWS =====
export const interviews = pgTable('interviews', {
    id: uuid('id').defaultRandom().primaryKey(),
    expertId: uuid('expert_id').references(() => experts.id, { onDelete: 'cascade' }),
    transcript: text('transcript'),
    summary: text('summary'),
    durationSeconds: integer('duration_seconds'),
    status: text('status').default('in_progress'),
    elevenlabsConversationId: text('elevenlabs_conversation_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
    expert: one(experts, {
        fields: [interviews.expertId],
        references: [experts.id],
    }),
    knowledgeCards: many(knowledgeCards),
}));

// ===== KNOWLEDGE CARDS =====
export const knowledgeCards = pgTable('knowledge_cards', {
    id: uuid('id').defaultRandom().primaryKey(),
    interviewId: uuid('interview_id').references(() => interviews.id, { onDelete: 'cascade' }),
    expertId: uuid('expert_id').references(() => experts.id, { onDelete: 'cascade' }),
    topic: text('topic').notNull(),
    content: text('content').notNull(),
    tags: text('tags').array().default([]),
    importance: text('importance').default('normal'),
    embedding: vector('embedding'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const knowledgeCardsRelations = relations(knowledgeCards, ({ one }) => ({
    expert: one(experts, {
        fields: [knowledgeCards.expertId],
        references: [experts.id],
    }),
    interview: one(interviews, {
        fields: [knowledgeCards.interviewId],
        references: [interviews.id],
    }),
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
