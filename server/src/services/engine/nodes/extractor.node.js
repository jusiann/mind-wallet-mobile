import { generateJSON } from '../../gemini.service.js';

// ═══════════════════════════════════════════════════════════════
//  Turkish amount parser (from old goal.agent.js)
// ═══════════════════════════════════════════════════════════════

const MULTIPLIERS = { bin: 1_000, milyon: 1_000_000, milyar: 1_000_000_000 };
const AMOUNT_RE = /(\d[\d.,]*)\s*(bin|milyon|milyar)?(?:\s*(?:tl|₺|lira))?/i;

function parseTurkishAmount(text) {
    const m = text.match(AMOUNT_RE);
    if (!m) return 0;
    const numStr = m[1].replace(/\.(?=\d{3}(?:[.,]|$))/g, '').replace(',', '.');
    const base = parseFloat(numStr);
    if (isNaN(base) || base <= 0) return 0;
    return base * (m[2] ? (MULTIPLIERS[m[2].toLowerCase()] ?? 1) : 1);
}

// ═══════════════════════════════════════════════════════════════
//  Goal title enforcer (from old goal.agent.js)
// ═══════════════════════════════════════════════════════════════

const NOISE = /\b(için|hedefi?|biriktirmek|istiyorum|biriktir|birikim|tasarruf|etmek|kaydet|oluştur|almak|yapmak|gitmek|satın|tl|lira|₺|hedefe|ekle|yatır|aktar|koy|para|bir|ve|ile|de|da)\b/gi;

function enforceShortTitle(raw) {
    const cleaned = raw.replace(NOISE, ' ').replace(/\s+/g, ' ').trim();
    const words = cleaned.split(' ').filter(Boolean);
    const short = words.slice(0, 3).join(' ');
    if (!short) return '';
    return short.charAt(0).toUpperCase() + short.slice(1);
}

function recoverTitleFromHistory(chatHistory) {
    const lastAssistant = chatHistory.filter((m) => m.role === 'model').slice(-1)[0]?.content ?? '';
    const match = lastAssistant.match(/"([^"]+)" hedefi için ne kadar/i);
    return match?.[1] ?? null;
}

function recoverGoalFromHistory(chatHistory, activeGoals) {
    const lastAssistant = chatHistory.filter((m) => m.role === 'model').slice(-1)[0]?.content ?? '';
    const match = lastAssistant.match(/"([^"]+)" hedefine ne kadar/i);
    if (match && activeGoals) {
        const title = match[1];
        return activeGoals.find(g => g.title === title) || null;
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════
//  Fast extraction (regex-based, no Gemini)
// ═══════════════════════════════════════════════════════════════

function fastExtractGoal(input) {
    const fullMatch = input.match(/\d[\d.,]*\s*(?:bin|milyon|milyar)?(?:\s*(?:tl|₺|lira))?/i);
    const amount = fullMatch ? parseTurkishAmount(fullMatch[0]) : 0;
    const raw = (fullMatch ? input.replace(fullMatch[0], '') : input).trim();
    const title = enforceShortTitle(raw);
    if (amount > 0 || title) {
        return { title: title || 'Yeni Hedef', target_amount: amount };
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════
//  Extractor Node — LangGraph Node Function
// ═══════════════════════════════════════════════════════════════

export const extractorNode = async (state) => {
    const { input, intent, context, chatHistory } = state;
    const { categories } = context;

    // ── TRANSACTION extraction ──
    if (intent === 'TRANSACTION') {
        const categoryNames = categories.map((c) => c.name).join(', ');

        const prompt = `Extract transaction details from the user message.
Available categories: ${categoryNames || 'Food, Transportation, Entertainment, Shopping, Bills, Health, Other'}
Message: "${input}"
Respond in the following JSON format (write nothing else):
{
    "amount": <numeric TRY amount>,
    "type": "EXPENSE" or "INCOME",
    "category": "<closest match from available categories>",
    "description": "<short description in Turkish, max 100 characters>"
}
Rules:
- amount: number only, not a string
- type: spending/expense → "EXPENSE", income/earnings → "INCOME"
- category: must be one of the available categories
- description: must be in Turkish
- If no amount in the message, return amount: 0`;

        let result = await generateJSON(prompt, null);

        // Fallback: If Gemini fails, try to extract amount locally
        if (!result || typeof result.amount !== 'number' || result.amount <= 0) {
            const amount = parseTurkishAmount(input);
            if (amount > 0) {
                let type = 'EXPENSE';
                if (/(gelir|maaş|yattı|kazand|geldi)/i.test(input)) {
                    type = 'INCOME';
                }
                result = {
                    amount,
                    type,
                    category: 'Diğer',
                    description: input.slice(0, 100)
                };
            }
        }

        if (!result || typeof result.amount !== 'number' || result.amount <= 0) {
            return {
                pendingData: null,
                response: {
                    classification: 'TRANSACTION',
                    message: 'İşlem tutarı anlaşılamadı. Örnek: "Markete 150 TL harcadım"',
                    buttons: null, // responder will add NAV_BUTTONS
                },
            };
        }

        return {
            pendingData: {
                type: 'transaction',
                amount: result.amount,
                transactionType: result.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
                category: result.category ?? 'Other',
                description: result.description ?? input.slice(0, 100),
                timestamp: new Date().toISOString(),
            },
        };
    }

    // ── GOAL_CREATION extraction ──
    if (intent === 'GOAL_CREATION') {
        // Try fast extraction first (no Gemini call)
        const fast = fastExtractGoal(input);
        if (fast) {
            let title = fast.title;
            if (title === 'Yeni Hedef') {
                title = recoverTitleFromHistory(chatHistory) ?? 'Yeni Hedef';
            }
            return { pendingData: { type: 'goal', title, target_amount: fast.target_amount } };
        }

        // Fallback: Gemini extraction
        const prompt = `Extract goal details from the user message.
Message: "${input}"
Respond in the following JSON format (write nothing else):
{
    "title": "<1-3 kelimelik kısa başlık, sadece ana konu — örn: 'Motorsiklet', 'Tatil'>",
    "target_amount": <numeric TRY target amount>
}
Rules:
- title: 1-3 kelime MAXIMUM, sadece tasarruf edilmek istenen şeyin adı, Türkçe, başlık formatında
- target_amount: number only
- If no amount in the message, return target_amount: 0`;

        const result = await generateJSON(prompt, null);
        if (result) {
            const rawTitle = typeof result.title === 'string' ? result.title : '';
            let safeTitle = enforceShortTitle(rawTitle) || 'Yeni Hedef';
            if (safeTitle === 'Yeni Hedef') {
                safeTitle = recoverTitleFromHistory(chatHistory) ?? 'Yeni Hedef';
            }
            const target_amount = typeof result.target_amount === 'number' && result.target_amount > 0 ? result.target_amount : 0;
            return { pendingData: { type: 'goal', title: safeTitle, target_amount } };
        }

        return { pendingData: null };
    }

    // ── GOAL_CONTRIBUTION extraction ──
    if (intent === 'GOAL_CONTRIBUTION') {
        const amount = parseTurkishAmount(input);
        if (amount <= 0) {
            return { pendingData: null };
        }
        
        const matchedGoal = recoverGoalFromHistory(chatHistory, context.activeGoals || []);
        if (matchedGoal) {
            return { pendingData: { type: 'goal_contribution', amount, goalId: matchedGoal.id, goalTitle: matchedGoal.title } };
        }
        
        return { pendingData: { type: 'goal_contribution', amount } };
    }

    return {};
};

// Export helpers for use in other nodes
export { parseTurkishAmount, enforceShortTitle, recoverTitleFromHistory, recoverGoalFromHistory };
