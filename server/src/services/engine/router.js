import { transactionAgent } from './agents/transaction.agent.js';
import { goalAgent } from './agents/goal.agent.js';
import { analysisAgent } from './agents/analysis.agent.js';
import { chatAgent } from './agents/chat.agent.js';
import { generateText } from '../gemini.service.js';

// ═══════════════════════════════════════════════════════════════
//  Tier 1 — Regex fast-path (Gemini çağrılmaz, <1ms)
// ═══════════════════════════════════════════════════════════════

// TRANSACTION — harcama / gelir kaydı
const TX_FAST = /(?:işlem\s*ekle|harcama\s*ekle|para\s*harcad|gelir\s*ekle|yeni\s*işlem|maaş\s*yattı|maaşım|fatura\s*öde|ödedim)/i;
const TX_AMOUNT = /\d[\d.,]*\s*(?:bin|milyon|milyar)?\s*(?:tl|₺|lira)\s*(?:harcad|verdim|ödedim|aldım|yattı|kazandım|geldi)/i;
const TX_AMOUNT_REV = /(?:harcad|verdim|ödedim|aldım|yattı|kazandım|geldi).*\d[\d.,]*\s*(?:bin|milyon|milyar)?\s*(?:tl|₺|lira)?/i;

// GOAL_CREATION — yeni hedef oluşturma
const GOAL_CREATE_FAST = /(?:hedef\s*oluştur|hedef\s*ekle|biriktirmek\s*istiyorum|yeni\s*hedef|tasarruf\s*hedefi|için.*biriktir)/i;

// GOAL_CONTRIBUTION — mevcut hedefe para ekleme
const GOAL_CONTRIB_FAST = /(?:hedef(?:im)?(?:e|ine|ne)|hedefe)\s*(?:ekle|yatır|aktar|koy|para)|(?:birikimine|birikim(?:e|ine))\s*(?:ekle|yatır|aktar)/i;
const GOAL_CONTRIB_WITH_AMOUNT = /\d[\d.,]*\s*(?:bin|milyon|milyar)?\s*(?:tl|₺|lira)?\s*(?:hedef|ekle|yatır|aktar|koy|kaydet)/i;

// GOAL_STATUS — hedef durum sorgulama
const GOAL_STATUS_FAST = /(?:hedef(?:im|lerim)?\s*(?:nasıl|ne\s*durumda|ne\s*kadar|kaçta|durum)|ne\s*kadar\s*biriktir|hedefe?\s*(?:ne\s*kadar\s*)?kaldı)/i;

// ANALYSIS — bütçe / harcama analizi
const ANALYSIS_FAST = /(?:analiz|nasıl\s*gidiy|tasarruf\s*(?:öner|tavsiye)|bütçe(?:\s*analiz)?|bu\s*ay|aylık\s*(?:durum|özet|rapor)|harcamalar(?:ım)?\s*(?:nasıl|göster|analiz)|ne\s*kadar\s*harca|özet\s*göster|mali\s*durum)/i;

// CHITCHAT — selamlama / teşekkür
const CHITCHAT_FAST = /^\s*(?:selam|merhaba|hey|iyi\s*(?:günler|akşamlar|sabahlar|geceler)|günaydın|nasılsın|naber|ne\s*haber|teşekkür(?:ler)?|sağ\s*ol|eyvallah|görüşürüz|hoşça\s*kal|tamam|anladım|ok|tamamdır|peki)\s*[!.?]*$/i;

// TIPS — tasarruf tavsiyesi
const TIPS_FAST = /(?:tasarruf\s*(?:tav|öner|ipuc)|tavsiye\s*ver|öneri\s*ver|ipucu|nasıl\s*tasarruf|para\s*biriktir(?:me)?\s*(?:tav|öner|yol))/i;

// Amount presence detector
const AMOUNT_PRESENT = /\d[\d.,]*\s*(?:bin|milyon|milyar)?(?:\s*(?:tl|₺|lira))?/i;

// ═══════════════════════════════════════════════════════════════
//  Tier 2 — Context-aware keyword scoring + LLM fallback
// ═══════════════════════════════════════════════════════════════

const determineIntent = async (input, chatHistory) => {
    // --- Tier 1: Regex fast-path ---
    if (CHITCHAT_FAST.test(input)) return 'CHITCHAT';
    if (TIPS_FAST.test(input) && !AMOUNT_PRESENT.test(input)) return 'TIPS';
    if (GOAL_STATUS_FAST.test(input)) return 'GOAL_STATUS';
    if (GOAL_CONTRIB_FAST.test(input) && AMOUNT_PRESENT.test(input)) return 'GOAL_CONTRIBUTION';
    if (GOAL_CONTRIB_WITH_AMOUNT.test(input)) return 'GOAL_CONTRIBUTION';
    if (GOAL_CREATE_FAST.test(input)) return 'GOAL_CREATION';
    if (TX_FAST.test(input)) return 'TRANSACTION';
    if (TX_AMOUNT.test(input) || TX_AMOUNT_REV.test(input)) return 'TRANSACTION';
    if (ANALYSIS_FAST.test(input)) return 'ANALYSIS';

    // --- Tier 1.5: Context-aware amount disambiguation ---
    if (AMOUNT_PRESENT.test(input)) {
        const lastAssistant = chatHistory.filter((m) => m.role === 'model').slice(-1)[0]?.content ?? '';
        if (/adını.*tutarını|tutarını.*yaz|hedef.*oluştur|hedefi için ne kadar|ne için.*biriktirmek/i.test(lastAssistant)) return 'GOAL_CREATION';
        if (/işlemi.*eklemek|hangi işlem|harcama.*yaz|ne kadar harcad|ne aldın/i.test(lastAssistant)) return 'TRANSACTION';
        if (/hangi hedefe|hedefe eklemek/i.test(lastAssistant)) return 'GOAL_CONTRIBUTION';
    }

    // --- Tier 2: LLM classification fallback ---
    const recentCtx = chatHistory
        .slice(-4)
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

    const contextBlock = recentCtx ? `\nPrevious conversation context:\n${recentCtx}\n` : '';

    const prompt = `Classify the user message. Write only one of these: "ANALYSIS", "TRANSACTION", "GOAL_CREATION", "GOAL_CONTRIBUTION", "TIPS", nothing else.
                    ANALYSIS: Spending analysis, budget review, savings advice, general questions, category reduction requests.
                    TRANSACTION: Attempts to record a new expense or income ("I spent X TRY", "I earned X TRY", etc.).
                    GOAL_CREATION: Requests to create a new financial goal ("I want to save X TRY for Y", "create a goal", etc.).
                    GOAL_CONTRIBUTION: Requests to directly add money to an existing goal ("add X TRY to my Y goal", "put X TRY into goal", etc.).
                    TIPS: Requests for saving tips, financial advice, or budget optimization suggestions.
                    ${contextBlock}
                    Message: "${input}"`;

    try {
        const raw = await generateText(prompt, 'ANALYSIS');
        const upper = raw.trim().toUpperCase();
        if (upper.includes('GOAL_CONTRIBUTION')) return 'GOAL_CONTRIBUTION';
        if (upper.includes('GOAL_CREATION')) return 'GOAL_CREATION';
        if (upper.includes('TRANSACTION')) return 'TRANSACTION';
        if (upper.includes('TIPS')) return 'TIPS';
        return 'ANALYSIS';
    } catch {
        return 'ANALYSIS';
    }
};

export const smartRouter = async (ctx, input, actionPayload, chatHistory) => {
    // If action is passed, route to appropriate agent based on action
    if (actionPayload) {
        const action = actionPayload.action;
        if (['start_transaction'].includes(action)) return chatAgent(ctx, input, actionPayload, chatHistory, 'TRANSACTION_START');
        if (['start_goal'].includes(action)) return chatAgent(ctx, input, actionPayload, chatHistory, 'GOAL_START');
        if (['reduce_category', 'route_savings', 'start_analysis', 'back_to_analysis'].includes(action)) {
            return analysisAgent(ctx, input, actionPayload, chatHistory);
        }
        if (['get_tips'].includes(action)) return chatAgent(ctx, input, actionPayload, chatHistory, 'GET_TIPS');
        if (['set_deadline'].includes(action)) return goalAgent(ctx, input, actionPayload, chatHistory, 'SET_DEADLINE');
        if (['start_goal_contribution'].includes(action)) return goalAgent(ctx, input, actionPayload, chatHistory, 'START_CONTRIBUTION');
        if (['select_goal'].includes(action)) return goalAgent(ctx, input, actionPayload, chatHistory, 'SELECT_GOAL');
    }

    // Determine intent from natural language
    const intent = await determineIntent(input, chatHistory);

    if (intent === 'TRANSACTION') {
        return transactionAgent(ctx, input, chatHistory);
    } else if (intent === 'GOAL_CREATION' || intent === 'GOAL_CONTRIBUTION' || intent === 'GOAL_STATUS') {
        return goalAgent(ctx, input, null, chatHistory, intent);
    } else if (intent === 'ANALYSIS') {
        return analysisAgent(ctx, input, null, chatHistory);
    } else if (intent === 'CHITCHAT') {
        return chatAgent(ctx, input, null, chatHistory, 'CHITCHAT');
    } else if (intent === 'TIPS') {
        return chatAgent(ctx, input, null, chatHistory, 'GET_TIPS');
    }

    return chatAgent(ctx, input, null, chatHistory, 'UNKNOWN');
};
