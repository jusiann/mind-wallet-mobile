import { generateJSON } from '../../gemini.service.js';
import {
    NAV_BUTTONS,
    GOAL_DURATION_BUTTONS,
    GOAL_CONFIRM_BUTTONS,
    GOAL_STATUS_EXTRA_BUTTONS,
    GOAL_CONTRIB_CONFIRM_BUTTONS,
} from '../../../constants/engine.constants.js';

// Turkish amount parser and enforce short title from old extractor
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

const NOISE = /\b(için|hedefi?|biriktirmek|istiyorum|biriktir|birikim|tasarruf|etmek|kaydet|oluştur|almak|yapmak|gitmek|satın|tl|lira|₺|hedefe|ekle|yatır|aktar|koy|para|bir|ve|ile|de|da)\b/gi;

function enforceShortTitle(raw) {
    const cleaned = raw.replace(NOISE, ' ').replace(/\s+/g, ' ').trim();
    const words = cleaned.split(' ').filter(Boolean);
    const short = words.slice(0, 3).join(' ');
    if (!short) return '';
    return short.charAt(0).toUpperCase() + short.slice(1);
}

function extractGoalFromInput(input) {
    const fullMatch = input.match(/\d[\d.,]*\s*(?:bin|milyon|milyar)?(?:\s*(?:tl|₺|lira))?/i);
    const amount = fullMatch ? parseTurkishAmount(fullMatch[0]) : 0;
    const raw = (fullMatch ? input.replace(fullMatch[0], '') : input).trim();
    const title = enforceShortTitle(raw);
    if (amount > 0 || title) {
        return { title: title || 'Yeni Hedef', target_amount: amount };
    }
    return null;
}

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}

function findGoalByTitle(input, goals) {
    const lower = input.toLowerCase();
    const subMatch = goals.find((g) => lower.includes(g.title.toLowerCase()));
    if (subMatch) return subMatch;
    return goals.find((g) => levenshtein(lower, g.title.toLowerCase()) <= 2) ?? null;
}

function recoverTitleFromHistory(chatHistory) {
    const lastAssistant = chatHistory.filter((m) => m.role === 'model').slice(-1)[0]?.content ?? '';
    const match = lastAssistant.match(/"([^"]+)" hedefi için ne kadar/i);
    return match?.[1] ?? null;
}

export const goalAgent = async (ctx, input, actionPayload, chatHistory, classification) => {
    const { activeGoals = [] } = ctx;

    // ── set_deadline (deterministik, Gemini yok) ──
    if (actionPayload?.action === 'set_deadline' || classification === 'SET_DEADLINE') {
        const goalData = actionPayload.pendingGoalData;
        if (!goalData) {
            return { message: 'Hedef verisi bulunamadı. Lütfen tekrar dene.', buttons: NAV_BUTTONS };
        }
        const months = actionPayload.months;
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + months);
        const deadlineStr = deadline.toISOString().split('T')[0];
        const goalWithDeadline = { ...goalData, deadline: deadlineStr };

        return {
            classification: 'GOAL_CREATION',
            message: `${goalData.title} için ${goalData.target_amount.toLocaleString('tr-TR')} TL hedef, ${months} aylık süre. Oluşturayım mı?`,
            buttons: GOAL_CONFIRM_BUTTONS(goalWithDeadline),
        };
    }

    // ── start_goal_contribution (hedef listesi göster) ──
    if (classification === 'START_CONTRIBUTION') {
        if (!activeGoals?.length) {
            return {
                classification: 'GOAL_CONTRIBUTION',
                message: 'Henüz aktif hedefin yok. Önce bir hedef oluştur!',
                buttons: [{ id: 'gc_create', label: 'Hedef Oluştur', icon: 'flag-outline', payload: { action: 'start_goal' } }],
            };
        }
        if (activeGoals.length === 1) {
            const g = activeGoals[0];
            return {
                classification: 'GOAL_CONTRIBUTION',
                message: `"${g.title}" hedefine ne kadar eklemek istiyorsun?`,
                buttons: [{ id: 'contrib_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } }],
            };
        }
        return {
            classification: 'GOAL_CONTRIBUTION',
            message: 'Hangi hedefe para eklemek istersin?',
            buttons: [
                ...activeGoals.slice(0, 4).map((g, i) => ({
                    id: `select_goal_${i}`,
                    label: `${g.title}`,
                    icon: 'flag-outline',
                    payload: { action: 'select_goal', goalId: g.id, goalTitle: g.title },
                })),
                { id: 'contrib_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } },
            ],
        };
    }

    // ── select_goal (hedefe para ekleme başlat) ──
    if (classification === 'SELECT_GOAL') {
        const goalTitle = actionPayload?.goalTitle ?? 'Hedef';
        return {
            classification: 'GOAL_CONTRIBUTION',
            message: `"${goalTitle}" hedefine ne kadar eklemek istiyorsun?`,
            buttons: [{ id: 'select_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } }],
        };
    }

    // ── GOAL_STATUS ──
    if (classification === 'GOAL_STATUS') {
        if (!activeGoals?.length) {
            return {
                classification,
                message: 'Henüz aktif hedefin yok. Mindy ile yeni bir hedef oluşturabilirsin!',
                buttons: [{ id: 'gs_create', label: 'Hedef Oluştur', icon: 'flag-outline', payload: { action: 'start_goal' } }],
            };
        }
        const lines = activeGoals.map((g) => {
            const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount));
            const pct = Number(g.progress_pct).toFixed(0);
            return `• ${g.title}: %${pct} tamamlandı — ${Number(remaining).toLocaleString('tr-TR')} TL kaldı`;
        });
        return {
            classification,
            message: `Hedeflerinin durumu:\n\n${lines.join('\n')}`,
            buttons: [...GOAL_STATUS_EXTRA_BUTTONS, ...NAV_BUTTONS.slice(0, 3)],
        };
    }

    // ── GOAL_CREATION ──
    if (classification === 'GOAL_CREATION') {
        let pendingData = null;
        const fast = extractGoalFromInput(input);
        if (fast) {
            let title = fast.title;
            if (title === 'Yeni Hedef') {
                title = recoverTitleFromHistory(chatHistory) ?? 'Yeni Hedef';
            }
            pendingData = { type: 'goal', title, target_amount: fast.target_amount };
        } else {
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
                pendingData = { type: 'goal', title: safeTitle, target_amount };
            }
        }

        if (!pendingData) {
            return {
                classification,
                message: 'Hedef tutarı anlaşılamadı. Örnek: "Tatil için 5.000 TL biriktirmek istiyorum"',
                buttons: NAV_BUTTONS,
            };
        }

        if (!pendingData.target_amount || pendingData.target_amount <= 0) {
            return {
                classification,
                message: `"${pendingData.title}" hedefi için ne kadar biriktirmek istiyorsun?`,
                buttons: [{ id: 'gc_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } }],
            };
        }

        return {
            classification,
            message: `${pendingData.title} için ${pendingData.target_amount.toLocaleString('tr-TR')} TL hedef belirliyoruz. Ne kadar sürede biriktirmek istersin?`,
            buttons: GOAL_DURATION_BUTTONS(pendingData),
        };
    }

    // ── GOAL_CONTRIBUTION ──
    if (classification === 'GOAL_CONTRIBUTION') {
        const amount = parseTurkishAmount(input);
        if (amount <= 0) {
            return {
                classification,
                message: 'Tutar anlaşılamadı. Örnek: "Tatil hedefime 500 TL ekle"',
                buttons: NAV_BUTTONS,
            };
        }

        const matchedGoal = activeGoals.length > 0 ? findGoalByTitle(input, activeGoals) : null;

        if (matchedGoal) {
            return {
                classification,
                message: `${amount.toLocaleString('tr-TR')} TL'yi "${matchedGoal.title}" hedefine ekleyeyim mi?`,
                buttons: GOAL_CONTRIB_CONFIRM_BUTTONS({ goalId: matchedGoal.id, goalTitle: matchedGoal.title, amount }),
            };
        }

        if (activeGoals?.length > 0) {
            return {
                classification,
                message: `${amount.toLocaleString('tr-TR')} TL'yi hangi hedefe eklemek istersin?`,
                buttons: [
                    ...activeGoals.slice(0, 3).map((g, i) => ({
                        id: `contrib_goal_${i}`,
                        label: `${g.title}`,
                        icon: 'flag-outline',
                        payload: { action: 'confirm_goal_contribution', contribution: { goalId: g.id, goalTitle: g.title, amount } },
                    })),
                    { id: 'contrib_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } },
                ],
            };
        }

        return {
            classification,
            message: 'Aktif hedefin yok. Önce bir hedef oluştur!',
            buttons: [{ id: 'gc_create', label: 'Hedef Oluştur', icon: 'flag-outline', payload: { action: 'start_goal' } }],
        };
    }

    return { message: 'Hedef isteği anlaşılamadı.', buttons: NAV_BUTTONS };
};
