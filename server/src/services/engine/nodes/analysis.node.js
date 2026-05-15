import { generateJSON } from '../../gemini.service.js';

const FALLBACK = {
    detectedSavings: 0,
    wastefulCategories: [],
    message: 'Analiz için yeterli harcama verisi bulunamadı.',
};

export const analysisNode = async (state) => {
    const expenses = state.pastTransactions?.filter(t => t.type === 'EXPENSE') ?? [];

    if (expenses.length === 0)
        return { 
            ...FALLBACK, 
            label: 'Normal' 
        };
    

    const transactionsJson = JSON.stringify(
        expenses.map(t => ({
            amount: t.amount,
            category: t.category_name ?? 'Kategorisiz',
            description: t.description ?? '',
            date: t.transaction_timestamp,
        })),
        null, 2,
    );

    const historyBlock = state.chatHistory.length
        ? `\nOnceki konusma:\n${state.chatHistory.map(m => `${m.role === 'user' ? 'Kullanici' : 'Asistan'}: ${m.content}`).join('\n')}\n`
        : '';

    const categoryFocus = state.buttonPayload?.action === 'reduce_category'
        ? `\nKullanıcı özellikle "${state.buttonPayload.category}" kategorisini azaltmak istiyor. Bu kategoriye odaklan.\n`
        : '';

    const prompt = `Kullanıcının son 30 günlük harcama geçmişi:
                    ${transactionsJson}
                    ${historyBlock}${categoryFocus}
                    Şu anki kullanıcı mesajı: "${state.currentInput}"

                    Analiz et ve şu JSON formatında yanıt ver (başka hiçbir şey yazma):
                    {
                    "detectedSavings": <aylık kaç TRY tasarruf edilebileceğinin tahmini sayısal değeri>,
                    "wastefulCategories": [
                        { "name": "<kategori adı>", "amount": <toplam harcanan TRY>, "suggestion": "<kısa Türkçe öneri>" }
                    ],
                    "message": "<Türkçe özet, 1-2 cümle, konuşma tonunda>"
                    }

                    Kurallar:
                    - wastefulCategories: en fazla israf edilen 3 kategori, yoksa boş dizi
                    - detectedSavings: gerçekçi bir tasarruf tahmini, maksimum toplam harcamanın %40'ı
                    - Tüm sayısal değerler tam sayı veya ondalıklı sayı olmalı, string değil
                    - Önceki konuşma bağlamına uygun, tutarlı yanıt ver`;

    const result = await generateJSON(prompt, FALLBACK);

    const detectedSavings = typeof result.detectedSavings === 'number' ? result.detectedSavings : 0;
    const label = detectedSavings > 500 ? 'Fırsat' : 'Normal';

    return {
        detectedSavings,
        wastefulCategories: Array.isArray(result.wastefulCategories) ? result.wastefulCategories : [],
        message: result.message ?? FALLBACK.message,
        label,
    };
};
