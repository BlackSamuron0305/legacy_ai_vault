import { logError } from '../utils/logger';

type ChatMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

const HF_ROUTER_BASE_URL = 'https://router.huggingface.co/v1';
const DEFAULT_CHAT_MODEL = 'Qwen/Qwen2.5-72B-Instruct';
const DEFAULT_EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const TARGET_EMBEDDING_DIM = 1536;

function getHfToken(): string {
    const token = process.env.HUGGINGFACE_API_TOKEN;
    if (!token) {
        throw new Error('Missing HUGGINGFACE_API_TOKEN in environment variables');
    }
    return token;
}

async function parseJsonResponse(response: Response): Promise<any> {
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Hugging Face API error: ${response.status} ${body}`);
    }

    return response.json();
}

function normalizeEmbedding(vec: number[]): number[] {
    if (vec.length === TARGET_EMBEDDING_DIM) {
        return vec;
    }
    if (vec.length > TARGET_EMBEDDING_DIM) {
        return vec.slice(0, TARGET_EMBEDDING_DIM);
    }
    return [...vec, ...new Array(TARGET_EMBEDDING_DIM - vec.length).fill(0)];
}

export async function createHfChatCompletion(params: {
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    model?: string;
    responseFormat?: { type: 'json_object' };
}): Promise<string> {
    const token = getHfToken();

    const response = await fetch(`${HF_ROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: params.model ?? DEFAULT_CHAT_MODEL,
            messages: params.messages,
            temperature: params.temperature ?? 0.3,
            max_tokens: params.maxTokens ?? 1200,
            ...(params.responseFormat ? { response_format: params.responseFormat } : {}),
        }),
    });

    const data = await parseJsonResponse(response);
    return data?.choices?.[0]?.message?.content || '';
}

export async function createHfEmbeddings(input: string | string[]): Promise<number[][]> {
    const token = getHfToken();
    const response = await fetch(`${HF_ROUTER_BASE_URL}/embeddings`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: DEFAULT_EMBEDDING_MODEL,
            input,
        }),
    });

    const data = await parseJsonResponse(response);

    if (!Array.isArray(data?.data)) {
        logError('Unexpected embeddings response format', data);
        throw new Error('Unexpected embeddings response format from Hugging Face');
    }

    return data.data.map((row: any) => normalizeEmbedding(row.embedding as number[]));
}
