import { generateText } from '../../gemini.service.js';

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

// CANCEL — iptal / vazgeçme
const CANCEL_FAST = /^\s*(?:iptal|vazgeç|bırak|boşver(?:dim)?|gerek\s*yok)\s*[!.?]*$/i;

// TIPS — tasarruf tavsiyesi
const TIPS_FAST = /(?:tasarruf\s*(?:tav|öner|ipuc)|tavsiye\s*ver|öneri\s*ver|ipucu|nasıl\s*tasarruf|para\s*biriktir(?:me)?\s*(?:tav|öner|yol))/i;

// Amount presence detector
const AMOUNT_PRESENT = /\d[\d.,]*\s*(?:bin|milyon|milyar)?(?:\s*(?:tl|₺|lira))?/i;

// ═══════════════════════════════════════════════════════════════
//  Tier 2 — LLM classification fallback (with OUT_OF_SCOPE)
// ═══════════════════════════════════════════════════════════════

const classifyWithLLM = async (input, chatHistory) => {
    const recentCtx = chatHistory
        .slice(-4)
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

    const contextBlock = recentCtx ? `\nPrevious conversation context:\n${recentCtx}\n` : '';

    const prompt = `Classify the user message into exactly one category. Write only the category name, nothing else.

Categories:
- TRANSACTION: Recording a new expense or income ("I spent X TRY", "earned X TRY", salary received, etc.)
- GOAL_CREATION: Creating a new financial savings goal ("I want to save X TRY for Y", "create a goal", etc.)
- GOAL_CONTRIBUTION: Adding money to an existing goal ("add X TRY to my Y goal", "put X into goal", etc.)
- GOAL_STATUS: Asking about goal progress ("how are my goals?", "how much saved?", etc.)
- ANALYSIS: Spending analysis, budget review, monthly summary, category breakdown
- TIPS: Saving tips, financial advice, budget optimization suggestions
- CHITCHAT: Greetings, thanks, small talk directly about the assistant
- OUT_OF_SCOPE: Anything NOT related to personal finance, budgeting, saving, or financial goals (weather, sports, programming, cooking, politics, general knowledge, math problems, etc.)
${contextBlock}
Message: "${input}"`;

    try {
        const raw = await generateText(prompt, 'OUT_OF_SCOPE');
        const upper = raw.trim().toUpperCase().replace(/[^A-Z_]/g, '');
        if (upper.includes('GOAL_CONTRIBUTION')) return 'GOAL_CONTRIBUTION';
        if (upper.includes('GOAL_CREATION')) return 'GOAL_CREATION';
        if (upper.includes('GOAL_STATUS')) return 'GOAL_STATUS';
        if (upper.includes('TRANSACTION')) return 'TRANSACTION';
        if (upper.includes('TIPS')) return 'TIPS';
        if (upper.includes('CHITCHAT')) return 'CHITCHAT';
        if (upper.includes('OUT_OF_SCOPE')) return 'OUT_OF_SCOPE';
        if (upper.includes('ANALYSIS')) return 'ANALYSIS';
        return 'OUT_OF_SCOPE';
    } catch {
        return 'OUT_OF_SCOPE';
    }
};

// ═══════════════════════════════════════════════════════════════
//  Intent Node — LangGraph Node Function
// ═══════════════════════════════════════════════════════════════

export const intentNode = async (state) => {
    const { input, chatHistory, actionPayload } = state;

    // ── Action payload routing (button taps) ──
    if (actionPayload) {
        const action = actionPayload.action;
        if (['start_transaction'].includes(action)) return { intent: 'ACTION_TRANSACTION_START' };
        if (['start_goal'].includes(action)) return { intent: 'ACTION_GOAL_START' };
        if (['reduce_category', 'route_savings', 'start_analysis', 'back_to_analysis'].includes(action)) return { intent: 'ACTION_ANALYSIS' };
        if (['get_tips'].includes(action)) return { intent: 'ACTION_TIPS' };
        if (['set_deadline'].includes(action)) return { intent: 'ACTION_SET_DEADLINE' };
        if (['start_goal_contribution'].includes(action)) return { intent: 'ACTION_GOAL_CONTRIBUTION_START' };
        if (['select_goal'].includes(action)) return { intent: 'ACTION_SELECT_GOAL' };
        return { intent: 'ACTION_UNKNOWN' };
    }

    // ── Tier 1: Regex fast-path (no Gemini call) ──
    if (CANCEL_FAST.test(input)) return { intent: 'CANCEL' };
    if (CHITCHAT_FAST.test(input)) return { intent: 'CHITCHAT' };
    if (TIPS_FAST.test(input) && !AMOUNT_PRESENT.test(input)) return { intent: 'TIPS' };
    if (GOAL_STATUS_FAST.test(input)) return { intent: 'GOAL_STATUS' };
    if (GOAL_CONTRIB_FAST.test(input) && AMOUNT_PRESENT.test(input)) return { intent: 'GOAL_CONTRIBUTION' };
    if (GOAL_CONTRIB_WITH_AMOUNT.test(input)) return { intent: 'GOAL_CONTRIBUTION' };
    if (GOAL_CREATE_FAST.test(input)) return { intent: 'GOAL_CREATION' };
    if (TX_FAST.test(input)) return { intent: 'TRANSACTION' };
    if (TX_AMOUNT.test(input) || TX_AMOUNT_REV.test(input)) return { intent: 'TRANSACTION' };
    if (ANALYSIS_FAST.test(input)) return { intent: 'ANALYSIS' };

    // ── Tier 1.5: Context-aware amount disambiguation ──
    if (AMOUNT_PRESENT.test(input)) {
        const lastAssistant = chatHistory.filter((m) => m.role === 'model').slice(-1)[0]?.content ?? '';
        
        // Goal creation context
        if (/hedef.*oluştur|biriktirmek|hedefi için|tutarını söyle/i.test(lastAssistant)) {
            return { intent: 'GOAL_CREATION' };
        }
        
        // Transaction context
        if (/harcad|gelir|kazand|kaydedelim|işlem ekle|ne harcadın|tutarını yaz|kaydedeyim mi/i.test(lastAssistant)) {
            return { intent: 'TRANSACTION' };
        }
        
        // Goal contribution context
        if (/hangi hedefe|hedefe eklemek|hedefine ne kadar/i.test(lastAssistant)) {
            return { intent: 'GOAL_CONTRIBUTION' };
        }
    }

    // ── Tier 2: LLM classification (with OUT_OF_SCOPE) ──
    const intent = await classifyWithLLM(input, chatHistory);
    return { intent };
};
