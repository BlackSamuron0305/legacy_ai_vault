import * as fs from 'fs/promises';
import * as path from 'path';
import { log, logError } from '../utils/logger';

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
const REPORTS_DIR = path.join(UPLOADS_DIR, 'reports');
const HTML_PREFIX = 'html';
const PDF_PREFIX = 'pdf';

async function ensureDir(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
}

export async function uploadReportHtml(sessionId: string, htmlContent: string): Promise<string> {
    const dir = path.join(REPORTS_DIR, HTML_PREFIX);
    await ensureDir(dir);
    const filePath = path.join(dir, `${sessionId}.html`);
    await fs.writeFile(filePath, htmlContent, 'utf-8');
    const storagePath = `reports/${HTML_PREFIX}/${sessionId}.html`;
    log('Saved report HTML', { sessionId, storagePath });
    return storagePath;
}

export async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
    const puppeteer = await import('puppeteer');
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    const browser = await puppeteer.default.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0',
        });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        });
        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
}

export async function uploadReportPdf(sessionId: string, pdfBuffer: Buffer): Promise<string> {
    const dir = path.join(REPORTS_DIR, PDF_PREFIX);
    await ensureDir(dir);
    const filePath = path.join(dir, `${sessionId}.pdf`);
    await fs.writeFile(filePath, pdfBuffer);
    const storagePath = `reports/${PDF_PREFIX}/${sessionId}.pdf`;
    log('Saved report PDF', { sessionId, storagePath });
    return storagePath;
}

export interface ReportStorageResult {
    reportHtmlPath: string;
    reportPdfPath: string;
}

export async function uploadReportFiles(sessionId: string, htmlContent: string): Promise<ReportStorageResult> {
    const reportHtmlPath = await uploadReportHtml(sessionId, htmlContent);
    const pdfBuffer = await generatePdfFromHtml(htmlContent);
    const reportPdfPath = await uploadReportPdf(sessionId, pdfBuffer);
    return { reportHtmlPath, reportPdfPath };
}

/**
 * Return direct download URLs for report files (served by Express).
 */
export async function getReportDownloadUrls(reportHtmlPath: string, reportPdfPath: string): Promise<{ htmlUrl: string; pdfUrl: string }> {
    return {
        htmlUrl: `/api/files/${reportHtmlPath}`,
        pdfUrl: `/api/files/${reportPdfPath}`,
    };
}
