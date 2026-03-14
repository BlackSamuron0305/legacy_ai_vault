import { logError } from '../utils/logger';
import { createHfEmbeddings } from './hf.service';

/**
 * Generate embedding vector for a text using Hugging Face Router embeddings.
 */
export async function createEmbedding(text: string): Promise<number[]> {
    try {
        const vectors = await createHfEmbeddings(text);
        return vectors[0];
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
        return createHfEmbeddings(texts);
    } catch (error) {
        logError('Failed to create batch embeddings', error);
        throw error;
    }
}
