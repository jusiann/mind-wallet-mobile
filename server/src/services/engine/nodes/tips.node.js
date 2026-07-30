import { generateText } from '../../gemini.service.js';
import { toTR } from '../categoryMap.js';
import { NAV_BUTTONS } from '../../../constants/engine.constants.js';

// ═══════════════════════════════════════════════════════════════
//  Tips Node — LangGraph Node Function
//  Generates personalized saving tips via Gemini
// ═══════════════════════════════════════════════════════════════

export const tipsNode = async (state) => {
    const { context, actionPayload } = state;
    const cat = actionPayload?.category ?? '';
    const catTR = toTR(cat);

    const catTxs = (context.currentMonthTx ?? [])
        .filter((t) => t.type === 'EXPENSE' && (!cat || t.category_name?.toLowerCase() === cat.toLowerCase()))
        .slice(0, 15);
    const totalSpent = catTxs.reduce((sum, t) => sum + Number(t.amount), 0);

    const txSummary = catTxs.length > 0
        ? `Son 30 günde ${catTxs.length} işlem, toplam ${totalSpent.toLocaleString('tr-TR')} TL.`
        : 'Bu kategoride son 30 günde kayıtlı harcama yok.';

    const goalsSummary = (context.activeGoals ?? []).length > 0
        ? `Aktif hedefler: ${context.activeGoals.map((g) => `${g.title} — hedef ${Number(g.target_amount).toLocaleString('tr-TR')} TL, %${Number(g.progress_pct).toFixed(0)} tamamlandı`).join('; ')}.`
        : '';

    const categoryClause = cat
        ? `Kullanıcı "${catTR}" kategorisindeki harcamalarını azaltmak istiyor.\nKategori harcama özeti: ${txSummary}`
        : `Kullanıcının genel tasarruf önerileri istiyor.`;

    const prompt = `${categoryClause}
${goalsSummary}

${cat ? 'Bu kategorideki harcamaları azaltmak için' : 'Genel olarak tasarruf etmek için'} somut 1-2 pratik öneri yaz.
Kurallar:
- "Merhaba", "Harika gidiyorsun" gibi selamlama veya yapay zeka klişelerini KESİNLİKLE KULLANMA. Doğrudan konuya gir.
- Toplam 2-3 cümleyi geçmesin. Çok kısa ve öz olsun.
- Robotik değil, finansal tavsiye veren yakın bir arkadaş gibi, samimi bir dille yaz.
- Verilen harcama verisi veya hedefler üzerinden somut matematiksel örnekler ver (örn: "Kafe harcaman 450 TL, bunu 300'e çekersen 150 TL tasarruf edersin").
- Madde işareti veya numara kullanma, düz paragraf yaz.`;

    const tips = await generateText(prompt, null);

    return {
        response: {
            classification: 'TIPS',
            message: `${cat ? `${catTR} harcamalarını azaltmak için öneriler` : 'Tasarruf önerileri'}:\n\n${tips ?? 'Öneri üretilemedi, lütfen tekrar dene.'}`,
            buttons: NAV_BUTTONS,
        },
    };
};
