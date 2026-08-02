import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_TIMEOUT_MS = 30_000;

// ═══════════════════════════════════════════════════════════════
//  System Instruction — shared across all calls to reduce prompt tokens
// ═══════════════════════════════════════════════════════════════

const SYSTEM_INSTRUCTION = `Sen Mind Wallet uygulamasının finansal yapay zeka asistanısın. Adın Mindy.
Kurallar:
- Her zaman Türkçe yanıt ver
- Kısa ve öz ol (max 3-5 cümle)
- Samimi ama profesyonel bir ton kullan
- Sadece kişisel finans, bütçe, tasarruf ve harcama konularında yardımcı ol
- Markdown veya özel formatlama kullanma, düz metin yaz`;

export const getModel = () =>
    genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL ?? 'gemini-3-flash-preview',
        systemInstruction: SYSTEM_INSTRUCTION,
    });

const getJsonModel = () =>
    genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL ?? 'gemini-3-flash-preview',
        generationConfig: { responseMimeType: 'application/json' },
        systemInstruction: SYSTEM_INSTRUCTION,
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

// ═══════════════════════════════════════════════════════════════
//  Prompt-level response cache (short TTL, intent classification)
// ═══════════════════════════════════════════════════════════════

const promptCache = new Map();
const PROMPT_CACHE_TTL_MS = 60_000;
const PROMPT_CACHE_MAX_SIZE = 50;

function getCachedResponse(prompt) {
    const entry = promptCache.get(prompt);
    if (entry && (Date.now() - entry.ts) < PROMPT_CACHE_TTL_MS) {
        promptCache.delete(prompt);
        promptCache.set(prompt, entry);
        return entry.value;
    }
    if (entry) promptCache.delete(prompt);
    return null;
}

function setCachedResponse(prompt, value) {
    if (promptCache.size >= PROMPT_CACHE_MAX_SIZE) {
        const firstKey = promptCache.keys().next().value;
        promptCache.delete(firstKey);
    }
    promptCache.set(prompt, { value, ts: Date.now() });
}

// ═══════════════════════════════════════════════════════════════
//  Public API
// ═══════════════════════════════════════════════════════════════

export const generateJSON = async (prompt, fallback = null) => {
    try {
        const model = getJsonModel();
        const result = await withRetry(() => withTimeout(model.generateContent(prompt)));
        const text = result.response.text().replace(/```json|```/g, '').trim();
        if (!text) return fallback;
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
    } catch (error) {
        console.error('[GEMINI] Error generating JSON:', error.message);
        return fallback;
    }
};

export const generateText = async (prompt, fallback = null) => {
    try {
        // Check cache first (useful for repeated classification prompts)
        const cached = getCachedResponse(prompt);
        if (cached !== null) return cached;

        const model = getModel();
        const result = await withRetry(() => withTimeout(model.generateContent(prompt)));
        const text = result.response.text().trim();
        const finalText = text || fallback;

        // Cache the response
        setCachedResponse(prompt, finalText);

        return finalText;
    } catch (error) {
        console.error('[GEMINI] Error generating text:', error.message);
        return fallback;
    }
};
