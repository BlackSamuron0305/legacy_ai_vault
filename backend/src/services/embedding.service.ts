import OpenAI from 'openai';
import { log, logError } from '../utils/logger';

const openai = new OpenAI();

/**
 * Generate embedding vector for a text using OpenAI ada-002.
 */
export async function createEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        logError('Failed to create embedding', error);
        throw error;
    }
}

/**
 * Generate embeddings for multiple texts in batch.
 */
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: texts,
        });
        return response.data.map(d => d.embedding);
    } catch (error) {
        logError('Failed to create batch embeddings', error);
        throw error;
    }
}
