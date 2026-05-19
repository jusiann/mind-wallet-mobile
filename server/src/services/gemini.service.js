import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_TIMEOUT_MS = 30_000;

export const getModel = () =>
    genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? 'gemini-3-flash-preview' });

const getJsonModel = () =>
    genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL ?? 'gemini-3-flash-preview',
        generationConfig: { responseMimeType: 'application/json' },
    });

const withTimeout = (promise, ms = GEMINI_TIMEOUT_MS) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Gemini request timed out')), ms),
        ),
    ]);

const withRetry = async (fn, retries = 3, baseDelayMs = 500) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            const isRetryable = err.status === 429 || err.status === 503 || err.message?.includes('timed out');
            if (!isRetryable || i === retries - 1) throw err;
            await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
        }
    }
};

export const generateJSON = async (prompt, fallback = null) => {
    const model = getJsonModel();
    const result = await withRetry(() => withTimeout(model.generateContent(prompt)));
    const text = result.response.text().replace(/```json|```/g, '').trim();
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try { 
                return JSON.parse(match[0]); 
            } catch { }
        }
        return fallback;
    }
};

export const generateText = async (prompt, fallback = null) => {
    const model = getModel();
    const result = await withRetry(() => withTimeout(model.generateContent(prompt)));
    const text = result.response.text().trim();
    return text || fallback;
};
