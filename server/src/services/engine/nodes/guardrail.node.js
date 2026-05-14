import { generateText } from '../../gemini.service.js';

export const guardrailNode = async (state) => {
    const { pendingTransaction, activeGoals } = state;

    if (!pendingTransaction || pendingTransaction.type !== 'EXPENSE' || !activeGoals?.length) {
        return { warning: null };
    }

    const { amount, description, category_name, is_essential } = pendingTransaction;
    const goalsJson = JSON.stringify(
        activeGoals.map(g => ({
            title: g.title,
            target: g.target_amount,
            current: g.current_amount,
            deadline: g.deadline,
            progress_pct: g.progress_pct,
        })),
        null, 2,
    );

    const categoryLine = category_name
        ? `Kategori: ${category_name} (${is_essential ? 'zorunlu harcama' : 'zorunlu olmayan harcama'})`
        : 'Kategori: Belirtilmemiş';

    const prompt = `Bir kullanıcı yeni bir harcama yapmak istiyor.

Harcama: ${amount} TRY
${categoryLine}
Açıklama: ${description ?? 'Yok'}

Aktif finansal hedefler:
${goalsJson}

Değerlendirme kuralları:
- Zorunlu olmayan (is_essential=false) kategorilerde yüksek harcamalar daha dikkatli değerlendirilmeli.
- Harcama miktarı kullanıcının herhangi bir hedefinin kalan tutarının %30'undan fazlasını tüketiyorsa uyar.
- Hedef yoksa veya harcama makul görünüyorsa "null" yaz.

Bu harcama kullanıcının finansal hedeflerini önemli ölçüde tehdit ediyor mu?
Eğer evet, kısa ve samimi bir Türkçe uyarı mesajı yaz (max 2 cümle).
Eğer hayır, sadece "null" yaz.

Sadece düz metin veya "null" — JSON değil.`;

    const raw = await generateText(prompt, null);

    if (!raw || raw.trim().toLowerCase() === 'null') {
        return { warning: null };
    }

    return { warning: raw.trim() };
};
