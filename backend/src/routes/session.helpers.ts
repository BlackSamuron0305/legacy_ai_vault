import { db } from '../db/drizzle';
import { sessions, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export type ParsedSegment = { timestamp: string; speaker: 'ai' | 'employee'; text: string };

export function parseTranscriptToSegments(transcript: string): ParsedSegment[] {
    if (!transcript?.trim()) return [];
    return transcript
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(AI|Employee):\s*(.+)$/i);
            if (match) {
                return {
                    timestamp: match[1],
                    speaker: (match[2].toLowerCase() === 'ai' ? 'ai' : 'employee') as 'ai' | 'employee',
                    text: match[3],
                };
            }
            const fallback = line.match(/^(Agent|User):\s*(.+)$/i);
            if (fallback) {
                return {
                    timestamp: '--:--:--',
                    speaker: (fallback[1].toLowerCase() === 'agent' ? 'ai' : 'employee') as 'ai' | 'employee',
                    text: fallback[2],
                };
            }
            return { timestamp: '--:--:--', speaker: 'employee' as const, text: line };
        });
}

/** Resolve the caller's workspaceId. Returns null if user is not found. */
export async function getWorkspaceId(userId: string): Promise<string | null> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.workspaceId ?? null;
}

/** Verify session belongs to the caller's workspace. Returns the session or null. */
export async function authorizeSession(sessionId: string, workspaceId: string) {
    const [session] = await db.select().from(sessions)
        .where(and(eq(sessions.id, sessionId), eq(sessions.workspaceId, workspaceId)));
    return session ?? null;
}
