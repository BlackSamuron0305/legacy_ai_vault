/**
 * Split text into chunks for embedding generation.
 * Each chunk stays under maxTokens (rough estimation: 1 token ≈ 4 chars).
 */
export function chunkText(text: string, maxChars: number = 2000, overlap: number = 200): string[] {
    if (text.length <= maxChars) return [text];

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        let end = start + maxChars;

        // Try to break at sentence boundary
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            const lastNewline = text.lastIndexOf('\n', end);
            const breakPoint = Math.max(lastPeriod, lastNewline);
            if (breakPoint > start + maxChars / 2) {
                end = breakPoint + 1;
            }
        }

        chunks.push(text.slice(start, end).trim());
        start = end - overlap;
    }

    return chunks.filter(c => c.length > 0);
}
