import { log, logError, logWarn } from '../utils/logger';

export interface MakeWebhookPayload {
    sessionId: string;
    employeeId: string | null;
    report: string;
    transcript: string;
    generatedAt: string;
}

/**
 * POST the generated report to a Make.com webhook for downstream automation.
 * Fails silently — caller should wrap in try/catch so it never blocks the
 * main processing pipeline.
 */
export async function sendToMakeWebhook(payload: MakeWebhookPayload): Promise<void> {
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;

    if (!webhookUrl) {
        logWarn('MAKE_WEBHOOK_URL not configured, skipping webhook', {
            sessionId: payload.sessionId,
        });
        return;
    }

    log('Sending report to Make webhook', {
        sessionId: payload.sessionId,
        reportLength: payload.report.length,
    });

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(
            `Make webhook returned ${response.status}: ${body || response.statusText}`,
        );
    }

    log('Make webhook accepted', {
        sessionId: payload.sessionId,
        status: response.status,
    });
}
