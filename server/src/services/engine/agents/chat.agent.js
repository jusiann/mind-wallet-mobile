import { generateText } from '../../gemini.service.js';
import { toTR } from '../categoryMap.js';

const END_BUTTONS = [
    { id: 'end_analyze', label: 'Aylık Özet', payload: { action: 'start_analysis' } },
    { id: 'end_transaction', label: 'İşlem Ekle', payload: { action: 'start_transaction' } },
    { id: 'end_goal', label: 'Hedef Oluştur', payload: { action: 'start_goal' } },
    { id: 'end_done', label: 'Hayır, teşekkürler', payload: { action: 'done' } },
];

export const chatAgent = async (ctx, input, actionPayload, chatHistory, intent) => {
    if (intent === 'TRANSACTION_START') {
        return {
            classification: 'TRANSACTION',
            message: 'Hangi işlemi eklemek istediğini yaz.\n(Örn: "Markete 250 TL harcadım" veya "Maaşım 15.000 TL yattı")',
            buttons: [{ id: 'start_tx_cancel', label: 'İptal', payload: { action: 'cancel' } }],
        };
    }

    if (intent === 'GOAL_START') {
        return {
            classification: 'GOAL_CREATION',
            message: 'Yeni bir hedef oluşturmak için hedefinin adını ve tutarını yaz.\n(Örn: "Tatil için 15.000 TL biriktirmek istiyorum")',
            buttons: [{ id: 'start_goal_cancel', label: 'İptal', payload: { action: 'cancel' } }],
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
            classification: 'ANALYSIS',
            message: `${catTR} harcamalarını azaltmak için öneriler:\n\n${tips ?? 'Öneri üretilemedi, lütfen tekrar dene.'}`,
            buttons: END_BUTTONS,
        };
    }

    if (intent === 'CHITCHAT') {
        return {
            classification: 'CHITCHAT',
            message: 'Merhaba! Harcamalarını analiz etmemi, işlem kaydetmemi veya hedeflerini kontrol etmemi ister misin?',
            buttons: [
                { id: 'ch_analyze', label: 'Aylık Özet', payload: { action: 'start_analysis' } },
                { id: 'ch_goals', label: 'Hedeflerim', payload: { action: 'start_goal' } },
                { id: 'ch_tx', label: 'İşlem Ekle', payload: { action: 'start_transaction' } },
            ],
        };
    }

    return {
        classification: 'UNKNOWN',
        message: 'Bunu tam anlayamadım. İşlem eklemek mi, hedef belirlemek mi, yoksa analiz görmek mi istersin?',
        buttons: END_BUTTONS,
    };
};
