import { supabase } from '../db/supabase';
import { log, logError } from '../utils/logger';

const REPORTS_BUCKET = 'reports';
const HTML_PREFIX = 'html';
const PDF_PREFIX = 'pdf';

export async function ensureReportsBucket(): Promise<void> {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        logError('Failed to list storage buckets', listError);
        throw listError;
    }
    if (buckets?.some((b) => b.name === REPORTS_BUCKET)) {
        return;
    }
    const { error: createError } = await supabase.storage.createBucket(REPORTS_BUCKET, {
        public: false,
    });
    if (createError) {
        logError('Failed to create reports bucket', createError);
        throw createError;
    }
    log('Created storage bucket', { bucket: REPORTS_BUCKET });
}

export async function uploadReportHtml(sessionId: string, htmlContent: string): Promise<string> {
    await ensureReportsBucket();
    const path = `${HTML_PREFIX}/${sessionId}.html`;
    const { error } = await supabase.storage.from(REPORTS_BUCKET).upload(path, htmlContent, {
        contentType: 'text/html',
        upsert: true,
    });
    if (error) {
        logError('Failed to upload report HTML', { sessionId, path, error });
        throw error;
    }
    log('Uploaded report HTML', { sessionId, path });
    return path;
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
    await ensureReportsBucket();
    const path = `${PDF_PREFIX}/${sessionId}.pdf`;
    const { error } = await supabase.storage.from(REPORTS_BUCKET).upload(path, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
    });
    if (error) {
        logError('Failed to upload report PDF', { sessionId, path, error });
        throw error;
    }
    log('Uploaded report PDF', { sessionId, path });
    return path;
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

const SIGNED_URL_EXPIRY_SECONDS = 3600;

export async function getReportSignedUrls(reportHtmlPath: string, reportPdfPath: string): Promise<{ htmlUrl: string; pdfUrl: string }> {
    const { data: htmlData, error: htmlError } = await supabase.storage
        .from(REPORTS_BUCKET)
        .createSignedUrl(reportHtmlPath, SIGNED_URL_EXPIRY_SECONDS);
    if (htmlError || !htmlData?.signedUrl) {
        throw htmlError || new Error('Failed to create signed URL for HTML');
    }
    const { data: pdfData, error: pdfError } = await supabase.storage
        .from(REPORTS_BUCKET)
        .createSignedUrl(reportPdfPath, SIGNED_URL_EXPIRY_SECONDS);
    if (pdfError || !pdfData?.signedUrl) {
        throw pdfError || new Error('Failed to create signed URL for PDF');
    }
    return { htmlUrl: htmlData.signedUrl, pdfUrl: pdfData.signedUrl };
}
