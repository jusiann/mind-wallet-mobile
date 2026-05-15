import { generateText } from '../../gemini.service.js';

export const guardrailNode = async (state) => {
    const { activeGoals } = state;

    let amount, transactionType, category, isEssential, description;

    if (state.pendingData?.type === 'transaction') {
        ({ amount, transactionType, category, description } = state.pendingData);
        
        const catMeta = state.categories?.find(c => c.name.toLowerCase() === category?.toLowerCase());
        isEssential = catMeta?.is_essential ?? null;
    } else if (state.pendingTransaction) {
        amount = state.pendingTransaction.amount;
        transactionType = state.pendingTransaction.type;
        category = state.pendingTransaction.category_name;
        isEssential = state.pendingTransaction.is_essential;
        description = state.pendingTransaction.description;
    } else {
        return { warning: null };
    }

    if (transactionType !== 'EXPENSE' || !activeGoals?.length)
        return { warning: null };

    // Zorunlu kategoriler hiçbir zaman uyarı almaz
    if (isEssential === true)
        return { warning: null };

    // Harcama hiçbir hedefin kalan tutarının %30'unu geçmiyorsa Gemini'ye gitme
    const exceedsThreshold = activeGoals.some(g => {
        const remaining = Number(g.target_amount) - Number(g.current_amount);
        return remaining > 0 && amount > remaining * 0.30;
    });
    if (!exceedsThreshold)
        return { warning: null };

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

    const categoryLine = category
        ? `Kategori: ${category}${isEssential !== null ? ` (${isEssential ? 'zorunlu harcama' : 'zorunlu olmayan harcama'})` : ''}`
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

    if (!raw || raw.trim().toLowerCase() === 'null')
        return { warning: null };

    return { warning: raw.trim() };
};
