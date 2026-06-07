import { generateText } from '../../gemini.service.js';
import { toTR } from '../categoryMap.js';
import { NAV_BUTTONS } from '../../../constants/engine.constants.js';

export const chatAgent = async (ctx, input, actionPayload, chatHistory, intent) => {
    if (intent === 'TRANSACTION_START') {
        return {
            classification: 'TRANSACTION',
            message: 'Tabii! Ne kadar harcadın veya ne kadar gelir aldın?\n(Örn: "Markete 250 TL harcadım" veya "15.000 TL maaş yattı")',
            buttons: [{ id: 'start_tx_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } }],
        };
    }

    if (intent === 'GOAL_START') {
        return {
            classification: 'GOAL_CREATION',
            message: 'Harika! Ne için ve ne kadar biriktirmek istiyorsun?\n(Örn: "Tatil için 15.000 TL biriktirmek istiyorum")',
            buttons: [{ id: 'start_goal_cancel', label: 'İptal', icon: 'close-circle-outline', payload: { action: 'cancel' } }],
        };
    }

    if (intent === 'GET_TIPS') {
        const cat = actionPayload?.category ?? '';
        const catTR = toTR(cat);
        const catTxs = (ctx.pastTransactions ?? ctx.currentMonthTx ?? [])
            .filter((t) => t.type === 'EXPENSE' && t.category_name?.toLowerCase() === cat.toLowerCase())
            .slice(0, 15);
        const totalSpent = catTxs.reduce((sum, t) => sum + Number(t.amount), 0);

        const txSummary = catTxs.length > 0
            ? `Son 30 günde ${catTxs.length} işlem, toplam ${totalSpent.toLocaleString('tr-TR')} TL.`
            : 'Bu kategoride son 30 günde kayıtlı harcama yok.';

        const goalsSummary = (ctx.activeGoals ?? []).length > 0
            ? `Aktif hedefler: ${ctx.activeGoals.map((g) => `${g.title} — hedef ${Number(g.target_amount).toLocaleString('tr-TR')} TL, %${Number(g.progress_pct).toFixed(0)} tamamlandı`).join('; ')}.`
            : '';

        // If no specific category, give general tips
        const categoryClause = cat
            ? `Kullanıcı "${catTR}" kategorisindeki harcamalarını azaltmak istiyor.\nKategori harcama özeti: ${txSummary}`
            : `Kullanıcının genel tasarruf önerileri istiyor.`;

        const prompt = `${categoryClause}
${goalsSummary}

${cat ? 'Bu kategorideki harcamaları azaltmak için' : 'Genel olarak tasarruf etmek için'} 2-3 pratik öneri yaz.
Kurallar:
- Türkçe, samimi ve kısa yaz (toplam 3-5 cümle)
- Kullanıcının gerçek harcama verisine ve hedeflerine göre kişiselleştir
- Madde işareti veya numara kullanma, düz paragraf yaz`;

        const tips = await generateText(prompt, null);
        return {
            classification: 'ANALYSIS',
            message: `${cat ? `${catTR} harcamalarını azaltmak için öneriler` : 'Tasarruf önerileri'}:\n\n${tips ?? 'Öneri üretilemedi, lütfen tekrar dene.'}`,
            buttons: NAV_BUTTONS,
        };
    }

    if (intent === 'CHITCHAT') {
        return {
            classification: 'CHITCHAT',
            message: 'Merhaba! Sana nasıl yardımcı olabilirim?',
            buttons: [
                { id: 'ch_analyze', label: 'Bütçe Analizi', icon: 'pie-chart-outline', payload: { action: 'start_analysis' } },
                { id: 'ch_tx',      label: 'İşlem Ekle',     icon: 'wallet-outline',    payload: { action: 'start_transaction' } },
                { id: 'ch_goals',   label: 'Hedef Oluştur',  icon: 'flag-outline',      payload: { action: 'start_goal' } },
                { id: 'ch_tips',    label: 'Tavsiyeler',      icon: 'bulb-outline',      payload: { action: 'get_tips' } },
            ],
        };
    }

    return {
        classification: 'UNKNOWN',
            message: 'Bunu tam anlayamadım. Ne yapmak istersin?',
            buttons: NAV_BUTTONS,
    };
};
