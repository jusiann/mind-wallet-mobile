import { toTR } from '../categoryMap.js';
import { generateText } from '../../gemini.service.js';

const END_BUTTONS = [
    {
        id: "end_analyze",
        label: "Aylık Özet",
        payload: { action: "start_analysis" },
    },
    {
        id: "end_transaction",
        label: "İşlem Ekle",
        payload: { action: "start_transaction" },
    },
    { id: "end_goal", label: "Hedef Oluştur", payload: { action: "start_goal" } },
    { id: "end_done", label: "Hayır, teşekkürler", payload: { action: "done" } },
];


export const responderNode = async (state) => {
    const {
        classification,
        pendingData,
        warning,
        wastefulCategories,
        detectedSavings,
        optimizedRoute,
        buttonPayload,
        message,
        activeGoals,
        categoryDeltas = [],
    } = state;

    if (classification === "CHITCHAT") {
        return {
            message:
                "Merhaba! Harcamalarını analiz etmemi, işlem kaydetmemi veya hedeflerini kontrol etmemi ister misin?",
            buttons: [
                {
                    id: "ch_analyze",
                    label: "Aylık Özet",
                    payload: { action: "start_analysis" },
                },
                {
                    id: "ch_goals",
                    label: "Hedeflerim",
                    payload: { action: "start_goal" },
                },
                {
                    id: "ch_tx",
                    label: "İşlem Ekle",
                    payload: { action: "start_transaction" },
                },
            ],
        };
    }

    if (buttonPayload?.action === "start_goal") {
        return {
            message:
                'Yeni bir hedef oluşturmak için hedefinin adını ve tutarını yaz.\n(Örn: "Tatil için 15.000 TL biriktirmek istiyorum")',
            buttons: [
                {
                    id: "start_goal_cancel",
                    label: "İptal",
                    payload: { action: "cancel" },
                },
            ],
        };
    }

    if (buttonPayload?.action === "start_transaction") {
        return {
            message:
                'Hangi işlemi eklemek istediğini yaz.\n(Örn: "Markete 250 TL harcadım" veya "Maaşım 15.000 TL yattı")',
            buttons: [
                {
                    id: "start_tx_cancel",
                    label: "İptal",
                    payload: { action: "cancel" },
                },
            ],
        };
    }

    if (classification === "GOAL_STATUS") {
        if (!activeGoals?.length) {
            return {
                message:
                    "Henüz aktif hedefin yok. Mindy ile yeni bir hedef oluşturabilirsin!",
                buttons: [
                    {
                        id: "gs_create",
                        label: "Hedef Oluştur",
                        payload: { action: "start_goal" },
                    },
                ],
            };
        }
        const lines = activeGoals.map((g) => {
            const remaining = Math.max(
                0,
                Number(g.target_amount) - Number(g.current_amount),
            );
            const pct = Number(g.progress_pct).toFixed(0);
            return `• ${g.title}: %${pct} tamamlandı — ${Number(remaining).toLocaleString("tr-TR")} TL kaldı`;
        });
        return {
            message: `Hedeflerinin durumu:\n\n${lines.join("\n")}`,
            buttons: END_BUTTONS,
        };
    }

    if (classification === "TRANSACTION") {
        if (!pendingData || pendingData.type !== "transaction")
            return {
                message: message || "İşlem detayları anlaşılamadı. Lütfen tekrar dene.",
                buttons: END_BUTTONS,
            };

        const { amount, transactionType, category, description } = pendingData;
        const categoryLabel = toTR(category);
        const typeLabel = transactionType === "INCOME" ? "gelir" : "gider";

        let msg = warning
            ? `${warning}\n\n${amount.toLocaleString("tr-TR")} TL tutarındaki ${categoryLabel} ${typeLabel}ini yine de kaydedeyim mi?`
            : `${amount.toLocaleString("tr-TR")} TL tutarındaki ${categoryLabel} ${typeLabel}ini kaydedeyim mi?`;

        if (description && description !== state.currentInput)
            msg += ` (${description})`;

        return {
            message: msg,
            buttons: [
                {
                    id: "confirm_yes",
                    label: "Evet, kaydet",
                    payload: { action: "confirm_transaction", transaction: pendingData },
                },
                { id: "confirm_no", label: "İptal", payload: { action: "cancel" } },
            ],
        };
    }

    // ── GOAL_CONTRIBUTION: doğrudan hedefe para ekleme ──────────────────────
    if (classification === "GOAL_CONTRIBUTION") {
        if (!pendingData || pendingData.type !== "goal_contribution")
            return {
                message: message || "Hedef katkısı anlaşılamadı. Lütfen tekrar dene.",
                buttons: END_BUTTONS,
            };

        const { amount, goalId, goalTitle } = pendingData;

        // Hedef bulunamadıysa kullanıcıdan seçmesini iste
        if (!goalId && activeGoals?.length > 0) {
            return {
                message: `${amount.toLocaleString("tr-TR")} TL'yi hangi hedefe eklemek istersin?`,
                buttons: [
                    ...activeGoals.slice(0, 3).map((g, i) => ({
                        id: `contrib_goal_${i}`,
                        label: g.title,
                        payload: {
                            action: "confirm_goal_contribution",
                            contribution: { goalId: g.id, goalTitle: g.title, amount },
                        },
                    })),
                    { id: "contrib_cancel", label: "İptal", payload: { action: "cancel" } },
                ],
            };
        }

        if (!goalId) {
            return {
                message: "Aktif hedefin yok. Önce bir hedef oluştur.",
                buttons: [
                    { id: "gc_create", label: "Hedef Oluştur", payload: { action: "start_goal" } },
                ],
            };
        }

        return {
            message: `${amount.toLocaleString("tr-TR")} TL'yi "${goalTitle}" hedefine ekleyeyim mi?`,
            buttons: [
                {
                    id: "contrib_yes",
                    label: "Evet, ekle",
                    payload: {
                        action: "confirm_goal_contribution",
                        contribution: { goalId, goalTitle, amount },
                    },
                },
                { id: "contrib_no", label: "İptal", payload: { action: "cancel" } },
            ],
        };
    }

    if (buttonPayload?.action === "set_deadline") {
        const goalData =
            buttonPayload.pendingGoalData ??
            (pendingData?.type === "goal" ? pendingData : null);

        if (!goalData)
            return {
                message: "Hedef verisi bulunamadı. Lütfen tekrar dene.",
                buttons: END_BUTTONS,
            };

        const months = buttonPayload.months;
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + months);
        const deadlineStr = deadline.toISOString().split("T")[0];
        const goalWithDeadline = { ...goalData, deadline: deadlineStr };

        return {
            message: `${goalData.target_amount.toLocaleString("tr-TR")} TL hedef, ${months} aylık süre (${deadlineStr}). Oluşturayım mı?`,
            buttons: [
                {
                    id: "goal_confirm",
                    label: "Evet, oluştur",
                    payload: { action: "confirm_goal", goal: goalWithDeadline },
                },
                { id: "goal_cancel", label: "İptal", payload: { action: "cancel" } },
            ],
        };
    }

    if (classification === "GOAL_CREATION") {
        if (!pendingData || pendingData.type !== "goal")
            return {
                message: message || "Hedef detayları anlaşılamadı. Lütfen tekrar dene.",
                buttons: END_BUTTONS,
            };

        // Tutar girilmemişse sor
        if (!pendingData.target_amount || pendingData.target_amount <= 0) {
            return {
                message: `"${pendingData.title}" hedefi için ne kadar biriktirmek istiyorsun?`,
                buttons: [
                    { id: "gc_cancel", label: "İptal", payload: { action: "cancel" } },
                ],
            };
        }

        return {
            message: `${pendingData.title} için ${pendingData.target_amount.toLocaleString("tr-TR")} TL hedef belirliyoruz. Ne kadar sürede biriktirmek istersin?`,
            buttons: [
                {
                    id: "dl_3m",
                    label: "3 ay",
                    payload: {
                        action: "set_deadline",
                        months: 3,
                        pendingGoalData: pendingData,
                    },
                },
                {
                    id: "dl_6m",
                    label: "6 ay",
                    payload: {
                        action: "set_deadline",
                        months: 6,
                        pendingGoalData: pendingData,
                    },
                },
                {
                    id: "dl_1y",
                    label: "1 yıl",
                    payload: {
                        action: "set_deadline",
                        months: 12,
                        pendingGoalData: pendingData,
                    },
                },
                {
                    id: "dl_2y",
                    label: "2 yıl",
                    payload: {
                        action: "set_deadline",
                        months: 24,
                        pendingGoalData: pendingData,
                    },
                },
            ],
        };
    }

    if (buttonPayload?.action === "reduce_category") {
        const cat = buttonPayload.category;
        const hasGoals = activeGoals?.length > 0;
        const totalSpent = buttonPayload.amount ?? 0;
        const delta = buttonPayload.delta ?? 0;
        const half = Math.round(delta / 2);

        const spentStr = Number(totalSpent).toLocaleString("tr-TR");
        const deltaStr = Number(delta).toLocaleString("tr-TR");
        const halfStr = Number(half).toLocaleString("tr-TR");

        const catTR = toTR(cat);

        let msg;
        if (delta > 0) {
            msg = `${catTR} harcaman bu ay geçen aya göre ${deltaStr} TL fazla (toplam ${spentStr} TL). Ne kadarını tasarruf etmek istersin?`;
        } else {
            msg = `${catTR} kategorisinde bu ay ${spentStr} TL harcadın. Ne yapmak istersin?`;
        }

        const savingsButtons = delta > 0 && hasGoals
            ? [
                {
                    id: "tip_route_all",
                    label: `Tamamını (${deltaStr} TL)`,
                    payload: { action: "route_savings", category: cat, amount: delta, categorySpent: totalSpent },
                },
                ...(half > 0 ? [{
                    id: "tip_route_half",
                    label: `Yarısını (${halfStr} TL)`,
                    payload: { action: "route_savings", category: cat, amount: half, categorySpent: totalSpent },
                }] : []),
            ]
            : [];

        return {
            message: msg,
            buttons: [
                {
                    id: "tip_budget",
                    label: "İpuçları ver",
                    payload: { action: "get_tips", category: cat },
                },
                ...savingsButtons,
                {
                    id: "tip_back",
                    label: "Geri dön",
                    payload: { action: "back_to_analysis" },
                },
            ],
        };
    }

    if (buttonPayload?.action === "get_tips") {
        const cat = buttonPayload.category ?? "";
        const catTR = toTR(cat);

        const catTxs = (state.pastTransactions ?? [])
            .filter((t) => t.type === "EXPENSE" && t.category_name?.toLowerCase() === cat.toLowerCase())
            .slice(0, 15);
        const totalSpent = catTxs.reduce((sum, t) => sum + Number(t.amount), 0);

        const txSummary = catTxs.length > 0
            ? `Son 30 günde ${catTxs.length} işlem, toplam ${totalSpent.toLocaleString("tr-TR")} TL.`
            : "Bu kategoride son 30 günde kayıtlı harcama yok.";

        const goalsSummary = (state.activeGoals ?? []).length > 0
            ? `Aktif hedefler: ${state.activeGoals.map((g) => `${g.title} — hedef ${Number(g.target_amount).toLocaleString("tr-TR")} TL, %${Number(g.progress_pct).toFixed(0)} tamamlandı`).join("; ")}.`
            : "";

        const prompt = `Kullanıcı "${catTR}" kategorisindeki harcamalarını azaltmak istiyor.

Kategori harcama özeti: ${txSummary}
${goalsSummary}

Bu kategorideki harcamaları azaltmak için 2-3 pratik öneri yaz.
Kurallar:
- Türkçe, samimi ve kısa yaz (toplam 3-5 cümle)
- Kullanıcının gerçek harcama verisine ve hedeflerine göre kişiselleştir
- Madde işareti veya numara kullanma, düz paragraf yaz`;

        const tips = await generateText(prompt, null);
        return {
            message: `${catTR} harcamalarını azaltmak için öneriler:\n\n${tips ?? "Öneri üretilemedi, lütfen tekrar dene."}`,
            buttons: END_BUTTONS,
        };
    }

    if (buttonPayload?.action === "route_savings") {
        const amount = buttonPayload?.amount ?? detectedSavings ?? 0;
        const cat = buttonPayload?.category ?? null;

        if (activeGoals?.length > 1) {
            return {
                message: `${amount > 0 ? `${Number(amount).toLocaleString("tr-TR")} TL tasarruf taahhüdünü` : "Tasarruf taahhüdünü"} hangi hedefe yönlendirmek istersin?`,
                buttons: [
                    ...activeGoals.slice(0, 3).map((g, i) => ({
                        id: `route_goal_${i}`,
                        label: g.title,
                        payload: {
                            action: "confirm_pledge",
                            pledge: { goalId: g.id, goalTitle: g.title, amount, category: cat, categorySpent: buttonPayload?.categorySpent ?? 0 },
                        },
                    })),
                    { id: "route_cancel", label: "Sonra", payload: { action: "cancel" } },
                ],
            };
        }

        const targetGoal = activeGoals?.[0];
        const route =
            optimizedRoute ??
            (targetGoal
                ? { goalId: targetGoal.id, goalTitle: targetGoal.title, amount }
                : null);

        const goalTitle = route?.goalTitle ?? "hedefinize";

        return {
            message: `${amount > 0 ? `${Number(amount).toLocaleString("tr-TR")} TL` : "Tasarruf taahhüdü"} ${goalTitle} hedefine söz olarak eklensin mi?\n\nBu ay bu kategoride gerçekten daha az harcarsan, tutarı hedefe aktaracağım.`,
            buttons: [
                {
                    id: "route_yes",
                    label: "Evet, söz ver",
                    payload: {
                        action: "confirm_pledge",
                        pledge: { goalId: route?.goalId, goalTitle, amount, category: cat, categorySpent: buttonPayload?.categorySpent ?? 0 },
                    },
                },
                { id: "route_no", label: "Sonra", payload: { action: "cancel" } },
            ],
        };
    }

    if (
        buttonPayload?.action === "back_to_analysis" ||
        buttonPayload?.action === "start_analysis"
    ) {
        // categoryDeltas öncelikli, yoksa wastefulCategories
        const catButtons = buildCategoryButtons(wastefulCategories, categoryDeltas);
        return {
            message: message || "Hangi kategoriyi azaltmak istersin?",
            buttons: catButtons.length ? catButtons : END_BUTTONS,
        };
    }

    // ── Default analysis response ──────────────────────────────────────────
    const catButtons = buildCategoryButtons(wastefulCategories, categoryDeltas);

    const hasGoals = activeGoals?.length > 0;
    const hasSavings = detectedSavings > 0;
    const currentInput = state.currentInput ?? "";

    // "Tasarruf önerileri ver" → savings-focused buttons
    if (/tasarruf/i.test(currentInput)) {
        const buttons = [];
        if (hasGoals && hasSavings)
            buttons.push({
                id: "route_savings_main",
                label: `${Number(detectedSavings).toLocaleString("tr-TR")} TL → Söz Ver`,
                payload: { action: "route_savings", amount: detectedSavings },
            });
        if (catButtons[0]) buttons.push(catButtons[0]);
        if (catButtons[1]) buttons.push(catButtons[1]);
        return { message, buttons: buttons.length ? buttons : END_BUTTONS };
    }

    // "Bu ay nasıl gidiyorum?" → monthly status buttons
    if (/nasıl gidiy|bu ay/i.test(currentInput)) {
        const buttons = [...catButtons.slice(0, 2)];
        if (hasGoals && hasSavings)
            buttons.push({
                id: "route_savings_status",
                label: `${Number(detectedSavings).toLocaleString("tr-TR")} TL Tasarruf Sözü`,
                payload: { action: "route_savings", amount: detectedSavings },
            });
        else
            buttons.push({
                id: "status_end",
                label: "Tamam",
                payload: { action: "done" },
            });
        return { message, buttons: buttons.length ? buttons : END_BUTTONS };
    }

    // Default: all 3 category breakdown buttons
    if (catButtons.length > 0) return { message, buttons: catButtons };

    return {
        message: message || "Analizin hazır!",
        buttons: END_BUTTONS,
    };
};

// categoryDeltas varsa delta miktarı göster, yoksa wastefulCategories'deki amount
function buildCategoryButtons(wastefulCategories = [], categoryDeltas = []) {
    return (wastefulCategories ?? []).slice(0, 3).map((c, i) => {
        const delta = categoryDeltas.find(
            (d) => d.name?.toLowerCase() === c.name?.toLowerCase()
        );
        const displayAmount = delta ? delta.delta : c.delta ?? c.amount ?? 0;
        const totalSpent = c.amount ?? delta?.currentSpent ?? 0;
        const label = delta
            ? `${toTR(c.name)} (+${Number(displayAmount).toLocaleString("tr-TR")} TL)`
            : `${toTR(c.name)} — ${Number(displayAmount).toLocaleString("tr-TR")} TL`;
        return {
            id: `cat_${i}`,
            label,
            payload: {
                action: "reduce_category",
                category: c.name,
                amount: totalSpent,
                delta: displayAmount,
            },
        };
    });
}
