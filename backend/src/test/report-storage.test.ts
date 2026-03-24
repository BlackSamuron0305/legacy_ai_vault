import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

// We need to mock puppeteer since it won't be available in tests
vi.mock('puppeteer', () => ({
    default: {
        launch: vi.fn().mockResolvedValue({
            newPage: vi.fn().mockResolvedValue({
                setContent: vi.fn().mockResolvedValue(undefined),
                pdf: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 test')),
            }),
            close: vi.fn().mockResolvedValue(undefined),
        }),
    },
}));

import {
    uploadReportHtml,
    uploadReportPdf,
    getReportDownloadUrls,
} from '../services/report-storage.service';

const TEST_DIR = path.join(process.env.UPLOADS_DIR || '/tmp/test-uploads', 'reports');

describe('report-storage.service', () => {
    beforeEach(async () => {
        await fs.mkdir(TEST_DIR, { recursive: true });
    });

    afterEach(async () => {
        try {
            await fs.rm(TEST_DIR, { recursive: true, force: true });
        } catch { /* ignore */ }
    });

    describe('uploadReportHtml', () => {
        it('should save HTML file and return storage path', async () => {
            const sessionId = 'test-session-123';
            const html = '<html><body>Test Report</body></html>';
            const result = await uploadReportHtml(sessionId, html);

            expect(result).toBe(`reports/html/${sessionId}.html`);

            // Verify file was written
            const filePath = path.join(TEST_DIR, 'html', `${sessionId}.html`);
            const content = await fs.readFile(filePath, 'utf-8');
            expect(content).toBe(html);
        });

        it('should overwrite existing file', async () => {
            const sessionId = 'overwrite-test';
            await uploadReportHtml(sessionId, 'first');
            await uploadReportHtml(sessionId, 'second');

            const filePath = path.join(TEST_DIR, 'html', `${sessionId}.html`);
            const content = await fs.readFile(filePath, 'utf-8');
            expect(content).toBe('second');
        });
    });

    describe('uploadReportPdf', () => {
        it('should save PDF buffer and return storage path', async () => {
            const sessionId = 'test-pdf-456';
            const pdfBuffer = Buffer.from('%PDF-1.4 test content');
            const result = await uploadReportPdf(sessionId, pdfBuffer);

            expect(result).toBe(`reports/pdf/${sessionId}.pdf`);

            const filePath = path.join(TEST_DIR, 'pdf', `${sessionId}.pdf`);
            const content = await fs.readFile(filePath);
            expect(content.equals(pdfBuffer)).toBe(true);
        });
    });

    describe('getReportDownloadUrls', () => {
        it('should return API-relative URLs', async () => {
            const result = await getReportDownloadUrls('reports/html/sess1.html', 'reports/pdf/sess1.pdf');
            expect(result.htmlUrl).toBe('/api/files/reports/html/sess1.html');
            expect(result.pdfUrl).toBe('/api/files/reports/pdf/sess1.pdf');
        });
    });
});
