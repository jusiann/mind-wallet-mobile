import { transactionAgent } from './agents/transaction.agent.js';
import { goalAgent } from './agents/goal.agent.js';
import { analysisAgent } from './agents/analysis.agent.js';
import { chatAgent } from './agents/chat.agent.js';
import { generateText } from '../gemini.service.js';

const GOAL_STATUS_PATTERN = /hedef/i;
const GOAL_STATUS_CONTEXT = /kald|durum|ilerleme|ne kadar|kaçta|tamamland|yüzde|bitti|bitiyor|nasıl/i;
const AMOUNT_PRESENT = /\d[\d.,]*\s*(?:bin|milyon|milyar)?(?:\s*(?:tl|₺|lira))?/i;
const ANALYSIS_FAST = /analiz|nasıl gidiy|tasarruf.*öner|öner.*tasarruf|bütçe|bu ay|aylık|harcama.*göster|ne kadar harca/i;
const CHITCHAT_PATTERN = /^[\s]*(?:selam|merhaba|hey|iyi\s*(?:günler|akşamlar|sabahlar|geceler)|günaydın|nasılsın|naber|ne\s*haber|teşekkür(?:ler)?|sağ\s*ol|eyvallah|görüşürüz|hoşça\s*kal)[\s!.]*$/i;
const GOAL_CONTRIBUTION_PATTERN = /(?:hedef(?:im)?(?:e|ine|ne)|hedefe).*\d|(?:\d[\d.,]*).*(?:hedef(?:im)?(?:e|ine|ne)|hedefe)|\d[\d.,]*\s*(?:tl|₺|lira)?.*(?:ekle|yatır|aktar|koy|kaydet).*hedef|hedef.*(?:ekle|yatır|aktar|koy).*\d/i;

const determineIntent = async (input, chatHistory) => {
    if (CHITCHAT_PATTERN.test(input)) return 'CHITCHAT';
    if (GOAL_STATUS_PATTERN.test(input) && GOAL_STATUS_CONTEXT.test(input)) return 'GOAL_STATUS';
    if (GOAL_CONTRIBUTION_PATTERN.test(input) && AMOUNT_PRESENT.test(input)) return 'GOAL_CONTRIBUTION';
    if (ANALYSIS_FAST.test(input) && !AMOUNT_PRESENT.test(input)) return 'ANALYSIS';

    if (AMOUNT_PRESENT.test(input)) {
        const lastAssistant = chatHistory.filter((m) => m.role === 'model').slice(-1)[0]?.content ?? '';
        if (/adını.*tutarını|tutarını.*yaz|hedef.*oluştur/i.test(lastAssistant)) return 'GOAL_CREATION';
        if (/işlemi.*eklemek|hangi işlem|harcama.*yaz/i.test(lastAssistant)) return 'TRANSACTION';
    }

    const recentCtx = chatHistory
        .slice(-2)
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

    const contextBlock = recentCtx ? `\nPrevious conversation context:\n${recentCtx}\n` : '';

    const prompt = `Classify the user message. Write only "ANALYSIS", "TRANSACTION", "GOAL_CREATION", or "GOAL_CONTRIBUTION", nothing else.
                    ANALYSIS: Spending analysis, budget review, savings advice, general questions, category reduction requests.
                    TRANSACTION: Attempts to record a new expense or income ("I spent X TRY", "I earned X TRY", etc.).
                    GOAL_CREATION: Requests to create a new financial goal ("I want to save X TRY for Y", "create a goal", etc.).
                    GOAL_CONTRIBUTION: Requests to directly add money to an existing goal ("add X TRY to my Y goal", "put X TRY into goal", etc.).
                    ${contextBlock}
                    Message: "${input}"`;

    try {
        const raw = await generateText(prompt, 'ANALYSIS');
        const upper = raw.trim().toUpperCase();
        if (upper.includes('GOAL_CONTRIBUTION')) return 'GOAL_CONTRIBUTION';
        if (upper.includes('TRANSACTION')) return 'TRANSACTION';
        if (upper.includes('GOAL_CREATION')) return 'GOAL_CREATION';
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
    }

    return chatAgent(ctx, input, null, chatHistory, 'UNKNOWN');
};
