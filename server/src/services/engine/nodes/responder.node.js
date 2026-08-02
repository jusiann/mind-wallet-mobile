import { generateText } from '../../gemini.service.js';
import { toTR, pickRandom, levenshtein, findGoalByTitle, buildCategoryButtons } from '../../../utils/engine.util.js';
import {
    NAV_BUTTONS,
    TX_CONFIRM_BUTTONS,
    GOAL_DURATION_BUTTONS,
    GOAL_CONFIRM_BUTTONS,
    GOAL_STATUS_EXTRA_BUTTONS,
    GOAL_CONTRIB_CONFIRM_BUTTONS,
    CANCEL_BUTTONS,
} from '../../../constants/engine.constants.js';


export const responderNode = async (state) => {
    const { intent, input, pendingData, warning, analysisResult, context, actionPayload, response } = state;
    const { activeGoals = [] } = context;

    // If a previous node already set a complete response (e.g. extractor failure), use it
    if (response?.message && response.message !== '' && !response.buttons) {
        return { response: { ...response, buttons: response.buttons ?? NAV_BUTTONS } };
    }

    if (['HELP', 'OUT_OF_SCOPE', 'CHITCHAT', 'CANCEL', 'ACTION_UNKNOWN', 'UNKNOWN'].includes(intent)) {
        let prompt = `Kullanıcının niyeti: ${intent}
Kullanıcının mesajı: "${input || intent}"
Kullanıcının aktif hedefleri: ${activeGoals.map(g => g.title).join(', ') || 'Yok'}

Senin adın Mindy, sen bir finans asistanısın. 
Kullanıcıya samimi, çok kısa (1-3 cümle) ve yönlendirici bir cevap ver. Markdown kullanma.
- Niyet CHITCHAT veya OUT_OF_SCOPE ise: Sadece finansal konularda yardım edebileceğini söyle ve neler yapabildiğini kısaca hatırlat.
- Niyet HELP ise: Neler yapabildiğini (harcama ekleme, analiz, hedef) anlat.
- Niyet CANCEL ise: İşlemi iptal ettiğini ve başka ne yapabileceğini sor.
- Niyet UNKNOWN ise: Anlayamadığını belirtip yönlendir.`;

        let llmMessage = await generateText(prompt, 'Şu an seni tam anlayamadım, finansal konularda yardımcı olabilirim.');

        return {
            response: {
                classification: intent,
                message: llmMessage,
                buttons: [],
            },
        };
    }

    if (intent === 'ACTION_TRANSACTION_START') {
        return {
            response: {
                classification: 'TRANSACTION',
                message: 'Ne kadar harcadın veya ne kadar gelir aldın?\n(Örn: "Markete 250 TL harcadım" veya "15.000 TL maaş yattı")',
                buttons: [{ id: 'start_tx_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } }],
            },
        };
    }

    if (intent === 'ACTION_GOAL_START') {
        return {
            response: {
                classification: 'GOAL_CREATION',
                message: 'Ne için ve ne kadar biriktirmek istiyorsun?\n(Örn: "Tatil için 15.000 TL biriktirmek istiyorum")',
                buttons: [{ id: 'start_goal_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } }],
            },
        };
    }

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

        if (!analysisResult || !analysisResult.hasData) {
            return {
                response: {
                    classification: 'ANALYSIS',
                    message: analysisResult?.message ?? 'Analiz için yeterli harcama verisi bulunamadı.',
                    buttons: NAV_BUTTONS,
                },
            };
        }

        let { deltas = [], detectedSavings = 0, message, subscriptions = [], cashFlow = null } = analysisResult;
        
        if (cashFlow && cashFlow.isWarning) {
            message = `⚠️ Uyarı: Mevcut harcama hızınla (aylık projeksiyon: ${cashFlow.projectedTotal.toLocaleString('tr-TR')} TL) ay sonunu ${cashFlow.deficit.toLocaleString('tr-TR')} TL açıkla eksi bakiyede kapatabilirsin.\n\n` + message;
        }

        if (subscriptions.length > 0) {
            message += `\n\nAyrıca ${subscriptions.map(s => `"${s.name}" (${s.amount} TL)`).join(', ')} gibi düzenli ödemeler tespit ettim. Bunları kullanmıyorsan iptal ederek hedeflerine aktarabilirsin.`;
        }

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

    let fallbackPrompt = `Kullanıcının niyeti: UNKNOWN
Kullanıcının mesajı: "${input || intent}"
Senin adın Mindy, finans asistanısın. Kullanıcının mesajını tam anlayamadın.
Ona ne istediğini sormak ve yönlendirmek için 1-2 cümlelik kısa bir mesaj yaz.`;
    
    let fallbackMessage = await generateText(fallbackPrompt, 'Bu işlemi anlayamadım. İşlem eklemek istersen "Taksi 300 TL" gibi yazabilirsin.');

    return {
        response: {
            classification: 'UNKNOWN',
            message: fallbackMessage,
            buttons: [],
        },
    };
};
