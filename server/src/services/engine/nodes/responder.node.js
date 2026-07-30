import { toTR } from '../categoryMap.js';
import {
    NAV_BUTTONS,
    TX_CONFIRM_BUTTONS,
    GOAL_DURATION_BUTTONS,
    GOAL_CONFIRM_BUTTONS,
    GOAL_STATUS_EXTRA_BUTTONS,
    GOAL_CONTRIB_CONFIRM_BUTTONS,
    CANCEL_BUTTONS,
} from '../../../constants/engine.constants.js';

// ═══════════════════════════════════════════════════════════════
//  Quick Reply Rotation — anti-repeat random selection
// ═══════════════════════════════════════════════════════════════

let _lastPicks = {};

function pickRandom(key, variants) {
    if (variants.length <= 1) return variants[0];
    const lastIdx = _lastPicks[key] ?? -1;
    let idx;
    do {
        idx = Math.floor(Math.random() * variants.length);
    } while (idx === lastIdx && variants.length > 1);
    _lastPicks[key] = idx;
    return variants[idx];
}

// ── Message Variants ──

const CHITCHAT_MESSAGES = [
    'Merhaba! Ben Mindy, senin finansal asistanın. Sana nasıl yardımcı olabilirim?',
    'Selam! Bugün bütçen hakkında konuşmak ister misin? 💰',
    'Hoş geldin! Harcamalarını analiz edeyim mi, yoksa başka bir konuda yardımcı olayım mı?',
];

const OUT_OF_SCOPE_MESSAGES = [
    'Üzgünüm, ben Mind Wallet\'ın finansal asistanı Mindy\'yim! 🏦\nBütçe analizi, işlem kaydı ve tasarruf hedefleri konularında yardımcı olabilirim.\n\nSana nasıl yardımcı olabilirim?',
    'Bu konuda yardımcı olamıyorum ama finansal konularda buradayım! 💡\nHarcamalarını analiz etmek, hedef oluşturmak veya tasarruf tavsiyeleri almak ister misin?',
    'Benim uzmanlık alanım kişisel finans. 📊\nBütçen hakkında sohbet edelim mi? İşlem kaydı veya hedef takibi yapabilirim.',
];

const TX_START_MESSAGES = [
    'Tabii! Ne kadar harcadın veya ne kadar gelir aldın?\n(Örn: "Markete 250 TL harcadım" veya "15.000 TL maaş yattı")',
    'Hemen kaydedelim! Harcama veya gelir tutarını yaz.\n(Örn: "Kafe 80 TL" veya "Freelance 5.000 TL gelir")',
    'Yeni işlem ekleyelim! Ne harcadın veya ne kazandın?\n(Örn: "Market alışverişi 320 TL" veya "Maaş 25.000 TL")',
];

const GOAL_START_MESSAGES = [
    'Harika! Ne için ve ne kadar biriktirmek istiyorsun?\n(Örn: "Tatil için 15.000 TL biriktirmek istiyorum")',
    'Yeni bir hedef oluşturalım! Neyin için ne kadar biriktirmek istiyorsun?\n(Örn: "Araba için 100.000 TL")',
    'Hedef belirleyelim! Bana hedefinin adını ve tutarını söyle.\n(Örn: "Acil durum fonu 20.000 TL")',
];

const UNKNOWN_ACTION_MESSAGES = [
    'Bu işlemi anlayamadım. Ne yapmak istersin?',
    'Bunu tam çözemedim. Sana nasıl yardımcı olabilirim?',
    'Anlamadım, bir daha açıklar mısın? İşte yapabileceklerim:',
];

const FALLBACK_MESSAGES = [
    'Bu işlemi anlayamadım. Ne yapmak istersin?',
    'Tam anlayamadım. Aşağıdaki seçeneklerden birini dene!',
    'Bunu çözemedim ama şunlardan biriyle yardımcı olabilirim:',
];

// ═══════════════════════════════════════════════════════════════
//  Goal title matching (from old goal.agent.js)
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
//  Category button builder
// ═══════════════════════════════════════════════════════════════

function buildCategoryButtons(categoryDeltas = []) {
    return categoryDeltas.map((d, i) => {
        const label = `${toTR(d.name)} (+${Number(d.delta).toLocaleString('tr-TR')} TL)`;
        return {
            id: `cat_${i}`,
            label,
            payload: { action: 'reduce_category', category: d.name, amount: d.currentSpent, delta: d.delta },
        };
    });
}

// ═══════════════════════════════════════════════════════════════
//  Responder Node — LangGraph Node Function (No Gemini call)
//  Pure logic: builds { message, buttons, classification }
// ═══════════════════════════════════════════════════════════════

export const responderNode = async (state) => {
    const { intent, input, pendingData, warning, analysisResult, context, actionPayload, response } = state;
    const { activeGoals = [] } = context;

    // If a previous node already set a complete response (e.g. extractor failure), use it
    if (response?.message && response.message !== '' && !response.buttons) {
        return { response: { ...response, buttons: response.buttons ?? NAV_BUTTONS } };
    }

    // ═══════════════════════════════════════════════════════
    //  OUT_OF_SCOPE — Finansal olmayan mesajlar
    // ═══════════════════════════════════════════════════════
    if (intent === 'OUT_OF_SCOPE') {
        return {
            response: {
                classification: 'OUT_OF_SCOPE',
                message: pickRandom('oos', OUT_OF_SCOPE_MESSAGES),
                buttons: [
                    { id: 'oos_analyze', label: 'Bütçe Analizi', icon: 'pie-chart-outline', payload: { action: 'start_analysis' } },
                    { id: 'oos_tx',      label: 'İşlem Ekle',     icon: 'wallet-outline',    payload: { action: 'start_transaction' } },
                    { id: 'oos_goals',   label: 'Hedef Oluştur',  icon: 'flag-outline',      payload: { action: 'start_goal' } },
                    { id: 'oos_tips',    label: 'Tavsiyeler',      icon: 'bulb-outline',      payload: { action: 'get_tips' } },
                ],
            },
        };
    }

    // ═══════════════════════════════════════════════════════
    //  CHITCHAT — Selamlama / teşekkür
    // ═══════════════════════════════════════════════════════
    if (intent === 'CHITCHAT') {
        return {
            response: {
                classification: 'CHITCHAT',
                message: pickRandom('chitchat', CHITCHAT_MESSAGES),
                buttons: [
                    { id: 'ch_analyze', label: 'Bütçe Analizi', icon: 'pie-chart-outline', payload: { action: 'start_analysis' } },
                    { id: 'ch_tx',      label: 'İşlem Ekle',     icon: 'wallet-outline',    payload: { action: 'start_transaction' } },
                    { id: 'ch_goals',   label: 'Hedef Oluştur',  icon: 'flag-outline',      payload: { action: 'start_goal' } },
                    { id: 'ch_tips',    label: 'Tavsiyeler',      icon: 'bulb-outline',      payload: { action: 'get_tips' } },
                ],
            },
        };
    }

    // ═══════════════════════════════════════════════════════
    //  CANCEL — İptal mesajı
    // ═══════════════════════════════════════════════════════
    if (intent === 'CANCEL') {
        return {
            response: {
                classification: 'UNKNOWN',
                message: pickRandom('cancel_intent', [
                    'İptal edildi. Başka ne yapabilirim?',
                    'Tamam, iptal ettim. Sana başka nasıl yardımcı olabilirim?',
                    'İptal edildi! Başka bir işlem yapmak ister misin?'
                ]),
                buttons: NAV_BUTTONS,
            },
        };
    }

    // ═══════════════════════════════════════════════════════
    //  ACTION: Transaction/Goal Start prompts
    // ═══════════════════════════════════════════════════════
    if (intent === 'ACTION_TRANSACTION_START') {
        return {
            response: {
                classification: 'TRANSACTION',
                message: pickRandom('tx_start', TX_START_MESSAGES),
                buttons: [{ id: 'start_tx_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } }],
            },
        };
    }

    if (intent === 'ACTION_GOAL_START') {
        return {
            response: {
                classification: 'GOAL_CREATION',
                message: pickRandom('goal_start', GOAL_START_MESSAGES),
                buttons: [{ id: 'start_goal_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } }],
            },
        };
    }

    if (intent === 'ACTION_UNKNOWN') {
        return {
            response: {
                classification: 'UNKNOWN',
                message: pickRandom('unknown_action', UNKNOWN_ACTION_MESSAGES),
                buttons: NAV_BUTTONS,
            },
        };
    }

    // ═══════════════════════════════════════════════════════
    //  TRANSACTION — Confirm with optional warning
    // ═══════════════════════════════════════════════════════
    if (intent === 'TRANSACTION') {
        if (!pendingData || pendingData.type !== 'transaction') {
            return {
                response: {
                    classification: 'TRANSACTION',
                    message: 'İşlem tutarı anlaşılamadı. Örnek: "Markete 150 TL harcadım"',
                    buttons: NAV_BUTTONS,
                },
            };
        }

        const categoryLabel = toTR(pendingData.category);
        const typeLabel = pendingData.transactionType === 'INCOME' ? 'gelir' : 'gider';
        let msg = warning
            ? `Uyarı: ${warning}\n\n${pendingData.amount.toLocaleString('tr-TR')} TL tutarındaki ${categoryLabel} ${typeLabel}ini yine de kaydedeyim mi?`
            : `${pendingData.amount.toLocaleString('tr-TR')} TL tutarındaki ${categoryLabel} ${typeLabel}ini kaydedeyim mi?`;

        if (pendingData.description && pendingData.description !== input) {
            msg += ` (${pendingData.description})`;
        }

        return {
            response: {
                classification: 'TRANSACTION',
                message: msg,
                warning,
                buttons: TX_CONFIRM_BUTTONS(pendingData),
            },
        };
    }

    // ═══════════════════════════════════════════════════════
    //  GOAL_CREATION — Duration selection or amount prompt
    // ═══════════════════════════════════════════════════════
    if (intent === 'GOAL_CREATION') {
        if (!pendingData) {
            return {
                response: {
                    classification: 'GOAL_CREATION',
                    message: 'Hedef tutarı anlaşılamadı. Örnek: "Tatil için 5.000 TL biriktirmek istiyorum"',
                    buttons: NAV_BUTTONS,
                },
            };
        }

        if (!pendingData.target_amount || pendingData.target_amount <= 0) {
            return {
                response: {
                    classification: 'GOAL_CREATION',
                    message: `"${pendingData.title}" hedefi için ne kadar biriktirmek istiyorsun?`,
                    buttons: [{ id: 'gc_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } }],
                },
            };
        }

        return {
            response: {
                classification: 'GOAL_CREATION',
                message: `${pendingData.title} için ${pendingData.target_amount.toLocaleString('tr-TR')} TL hedef belirliyoruz. Ne kadar sürede biriktirmek istersin?`,
                buttons: GOAL_DURATION_BUTTONS(pendingData),
            },
        };
    }

    // ═══════════════════════════════════════════════════════
    //  ACTION: SET_DEADLINE — Goal deadline confirmation
    // ═══════════════════════════════════════════════════════
    if (intent === 'ACTION_SET_DEADLINE') {
        const goalData = actionPayload?.pendingGoalData;
        if (!goalData) {
            return { response: { message: 'Hedef verisi bulunamadı. Lütfen tekrar dene.', buttons: NAV_BUTTONS } };
        }
        const months = actionPayload.months;
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + months);
        const deadlineStr = deadline.toISOString().split('T')[0];
        const goalWithDeadline = { ...goalData, deadline: deadlineStr };

        return {
            response: {
                classification: 'GOAL_CREATION',
                message: `${goalData.title} için ${goalData.target_amount.toLocaleString('tr-TR')} TL hedef, ${months} aylık süre. Oluşturayım mı?`,
                buttons: GOAL_CONFIRM_BUTTONS(goalWithDeadline),
            },
        };
    }

    // ═══════════════════════════════════════════════════════
    //  GOAL_CONTRIBUTION — Amount prompt + goal selection
    // ═══════════════════════════════════════════════════════
    if (intent === 'GOAL_CONTRIBUTION') {
        if (!pendingData || pendingData.type !== 'goal_contribution') {
            return {
                response: {
                    classification: 'GOAL_CONTRIBUTION',
                    message: 'Tutar anlaşılamadı. Örnek: "Tatil hedefime 500 TL ekle"',
                    buttons: NAV_BUTTONS,
                },
            };
        }

        const amount = pendingData.amount;
        
        let matchedGoal = null;
        if (pendingData.goalId && pendingData.goalTitle) {
            matchedGoal = { id: pendingData.goalId, title: pendingData.goalTitle };
        } else if (activeGoals.length > 0) {
            matchedGoal = findGoalByTitle(input, activeGoals);
        }

        if (matchedGoal) {
            return {
                response: {
                    classification: 'GOAL_CONTRIBUTION',
                    message: `${amount.toLocaleString('tr-TR')} TL'yi "${matchedGoal.title}" hedefine ekleyeyim mi?`,
                    buttons: GOAL_CONTRIB_CONFIRM_BUTTONS({ goalId: matchedGoal.id, goalTitle: matchedGoal.title, amount }),
                },
            };
        }

        if (activeGoals.length > 0) {
            return {
                response: {
                    classification: 'GOAL_CONTRIBUTION',
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
                },
            };
        }

        return {
            response: {
                classification: 'GOAL_CONTRIBUTION',
                message: 'Aktif hedefin yok. Önce bir hedef oluştur!',
                buttons: [{ id: 'gc_create', label: 'Hedef Oluştur', icon: 'flag-outline', payload: { action: 'start_goal' } }],
            },
        };
    }

    // ═══════════════════════════════════════════════════════
    //  ACTION: GOAL_CONTRIBUTION_START — Goal list
    // ═══════════════════════════════════════════════════════
    if (intent === 'ACTION_GOAL_CONTRIBUTION_START') {
        if (!activeGoals?.length) {
            return {
                response: {
                    classification: 'GOAL_CONTRIBUTION',
                    message: 'Henüz aktif hedefin yok. Önce bir hedef oluştur!',
                    buttons: [{ id: 'gc_create', label: 'Hedef Oluştur', icon: 'flag-outline', payload: { action: 'start_goal' } }],
                },
            };
        }
        if (activeGoals.length === 1) {
            const g = activeGoals[0];
            return {
                response: {
                    classification: 'GOAL_CONTRIBUTION',
                    message: `"${g.title}" hedefine ne kadar eklemek istiyorsun?`,
                    buttons: [{ id: 'contrib_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } }],
                },
            };
        }
        return {
            response: {
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
            },
        };
    }

    // ═══════════════════════════════════════════════════════
    //  ACTION: SELECT_GOAL
    // ═══════════════════════════════════════════════════════
    if (intent === 'ACTION_SELECT_GOAL') {
        const goalTitle = actionPayload?.goalTitle ?? 'Hedef';
        return {
            response: {
                classification: 'GOAL_CONTRIBUTION',
                message: `"${goalTitle}" hedefine ne kadar eklemek istiyorsun?`,
                buttons: [{ id: 'select_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } }],
            },
        };
    }

    // ═══════════════════════════════════════════════════════
    //  GOAL_STATUS — Show goal progress
    // ═══════════════════════════════════════════════════════
    if (intent === 'GOAL_STATUS') {
        if (!activeGoals?.length) {
            return {
                response: {
                    classification: 'GOAL_STATUS',
                    message: 'Henüz aktif hedefin yok. Mindy ile yeni bir hedef oluşturabilirsin!',
                    buttons: [{ id: 'gs_create', label: 'Hedef Oluştur', icon: 'flag-outline', payload: { action: 'start_goal' } }],
                },
            };
        }
        const lines = activeGoals.map((g) => {
            const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount));
            const pct = Number(g.progress_pct).toFixed(0);
            return `• ${g.title}: %${pct} tamamlandı — ${Number(remaining).toLocaleString('tr-TR')} TL kaldı`;
        });
        return {
            response: {
                classification: 'GOAL_STATUS',
                message: `Hedeflerinin durumu:\n\n${lines.join('\n')}`,
                buttons: [...GOAL_STATUS_EXTRA_BUTTONS, ...NAV_BUTTONS.slice(0, 3)],
            },
        };
    }

    // ═══════════════════════════════════════════════════════
    //  ANALYSIS / ACTION_ANALYSIS — Analysis results
    // ═══════════════════════════════════════════════════════
    if (intent === 'ANALYSIS' || intent === 'ACTION_ANALYSIS') {
        // Handle action payloads for analysis sub-flows
        if (actionPayload?.action === 'route_savings') {
            const amount = actionPayload.amount ?? analysisResult?.detectedSavings ?? 0;
            const cat = actionPayload.category ?? null;

            if (activeGoals?.length > 1) {
                return {
                    response: {
                        classification: 'ANALYSIS',
                        message: `${amount > 0 ? `${Number(amount).toLocaleString('tr-TR')} TL tasarruf taahhüdünü` : 'Tasarruf taahhüdünü'} hangi hedefe yönlendirmek istersin?`,
                        buttons: [
                            ...activeGoals.slice(0, 3).map((g, i) => ({
                                id: `route_goal_${i}`,
                                label: `${g.title}`,
                                icon: 'flag-outline',
                                payload: { action: 'confirm_pledge', pledge: { goalId: g.id, goalTitle: g.title, amount, category: cat, categorySpent: actionPayload.categorySpent ?? 0 } },
                            })),
                            { id: 'route_cancel', label: 'Sonra', icon: 'time-outline', payload: { action: 'cancel' } },
                        ],
                    },
                };
            }

            const targetGoal = activeGoals?.[0];
            if (targetGoal) {
                return {
                    response: {
                        classification: 'ANALYSIS',
                        message: `${amount > 0 ? `${Number(amount).toLocaleString('tr-TR')} TL` : 'Tasarruf taahhüdü'} "${targetGoal.title}" hedefine söz olarak eklensin mi?\n\nBu ay bu kategoride gerçekten daha az harcarsan, tutarı hedefe aktaracağım.`,
                        buttons: [
                            { id: 'route_yes', label: 'Evet, söz ver', icon: 'checkmark-circle-outline', payload: { action: 'confirm_pledge', pledge: { goalId: targetGoal.id, goalTitle: targetGoal.title, amount, category: cat, categorySpent: actionPayload.categorySpent ?? 0 } } },
                            { id: 'route_no', label: 'Sonra', icon: 'time-outline', payload: { action: 'cancel' } },
                        ],
                    },
                };
            }

            return {
                response: {
                    classification: 'ANALYSIS',
                    message: 'Aktif hedefin yok. Önce bir hedef oluştur!',
                    buttons: [{ id: 'gc_create', label: 'Hedef Oluştur', icon: 'flag-outline', payload: { action: 'start_goal' } }],
                },
            };
        }

        if (actionPayload?.action === 'reduce_category') {
            const cat = actionPayload.category;
            const hasGoals = activeGoals?.length > 0;
            const totalSpent = actionPayload.amount ?? 0;
            const delta = actionPayload.delta ?? 0;
            const half = Math.round(delta / 2);

            const spentStr = Number(totalSpent).toLocaleString('tr-TR');
            const deltaStr = Number(delta).toLocaleString('tr-TR');
            const halfStr = Number(half).toLocaleString('tr-TR');
            const catTR = toTR(cat);

            let msg = delta > 0
                ? `${catTR} harcaman bu ay geçen aya göre ${deltaStr} TL fazla (toplam ${spentStr} TL). Ne kadarını tasarruf etmek istersin?`
                : `${catTR} kategorisinde bu ay ${spentStr} TL harcadın. Ne yapmak istersin?`;

            const savingsButtons = delta > 0 && hasGoals
                ? [
                    { id: 'tip_route_all', label: `Tamamını (${deltaStr} TL)`, icon: 'cash-outline', payload: { action: 'route_savings', category: cat, amount: delta, categorySpent: totalSpent } },
                    ...(half > 0 ? [{ id: 'tip_route_half', label: `Yarısını (${halfStr} TL)`, icon: 'cash-outline', payload: { action: 'route_savings', category: cat, amount: half, categorySpent: totalSpent } }] : []),
                ]
                : [];

            return {
                response: {
                    classification: 'ANALYSIS',
                    message: msg,
                    buttons: [
                        { id: 'tip_budget', label: 'İpuçları ver', icon: 'bulb-outline', payload: { action: 'get_tips', category: cat } },
                        ...savingsButtons,
                        { id: 'tip_back', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } },
                    ],
                },
            };
        }

        // Default Analysis Response
        if (!analysisResult || !analysisResult.hasData) {
            return {
                response: {
                    classification: 'ANALYSIS',
                    message: analysisResult?.message ?? 'Analiz için yeterli harcama verisi bulunamadı.',
                    buttons: NAV_BUTTONS,
                },
            };
        }

        const { deltas = [], detectedSavings = 0, message } = analysisResult;
        const catButtons = buildCategoryButtons(deltas);
        const hasGoals = activeGoals?.length > 0;
        const hasSavings = detectedSavings > 0;

        if (/tasarruf/i.test(input ?? '')) {
            const buttons = [];
            if (hasGoals && hasSavings) {
                buttons.push({ id: 'route_savings_main', label: `${Number(detectedSavings).toLocaleString('tr-TR')} TL → Söz Ver`, icon: 'cash-outline', payload: { action: 'route_savings', amount: detectedSavings } });
            }
            if (catButtons[0]) buttons.push(catButtons[0]);
            if (catButtons[1]) buttons.push(catButtons[1]);
            return { response: { classification: 'ANALYSIS', message, buttons: buttons.length ? buttons : NAV_BUTTONS } };
        }

        if (/nasıl gidiy|bu ay/i.test(input ?? '')) {
            const buttons = [...catButtons.slice(0, 2)];
            if (hasGoals && hasSavings) {
                buttons.push({ id: 'route_savings_status', label: `${Number(detectedSavings).toLocaleString('tr-TR')} TL Tasarruf Sözü`, icon: 'cash-outline', payload: { action: 'route_savings', amount: detectedSavings } });
            } else {
                buttons.push({ id: 'status_end', label: 'Tamam', icon: 'checkmark-circle-outline', payload: { action: 'done' } });
            }
            return { response: { classification: 'ANALYSIS', message, buttons: buttons.length ? buttons : NAV_BUTTONS } };
        }

        return {
            response: {
                classification: 'ANALYSIS',
                message,
                buttons: catButtons.length ? catButtons : NAV_BUTTONS,
                detectedSavings,
            },
        };
    }

    // ═══════════════════════════════════════════════════════
    //  Fallback
    // ═══════════════════════════════════════════════════════
    return {
        response: {
            classification: 'UNKNOWN',
            message: pickRandom('fallback', FALLBACK_MESSAGES),
            buttons: NAV_BUTTONS,
        },
    };
};
