import { generateJSON } from '../../gemini.service.js';

export const extractorNode = async (state) => {
    const { classification, currentInput, categories } = state;

    const categoryNames = categories.map(c => c.name).join(', ');

    if (classification === 'TRANSACTION') {
        const prompt = `Kullanıcı mesajından işlem bilgilerini çıkar.

                        Mevcut kategoriler: ${categoryNames || 'Yemek, Ulaşım, Eğlence, Alışveriş, Faturalar, Sağlık, Diğer'}

                        Mesaj: "${currentInput}"

                        Şu JSON formatında yanıt ver (başka hiçbir şey yazma):
                        {
                        "amount": <sayısal TRY miktarı>,
                        "type": "EXPENSE" veya "INCOME",
                        "category": "<mevcut kategorilerden en yakın eşleşme>",
                        "description": "<kısa açıklama, max 100 karakter>"
                        }

                        Kurallar:
                        - amount: sadece sayı, string değil
                        - type: harcama/gider → "EXPENSE", gelir/kazanç → "INCOME"
                        - category: mutlaka mevcut kategorilerden biri olmalı
                        - Mesajda miktar yoksa amount: 0 döndür`;

        const result = await generateJSON(prompt, null);

        if (!result || typeof result.amount !== 'number' || result.amount <= 0)
            return {
                pendingData: null,
                message: 'İşlem miktarını anlayamadım. Örnek: "Yemeğe 150 TL harcadım"',
            };

        return {
            pendingData: {
                type: 'transaction',
                amount: result.amount,
                transactionType: result.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
                category: result.category ?? 'Diğer',
                description: result.description ?? currentInput.slice(0, 100),
                timestamp: new Date().toISOString(),
            },
        };
    }

    if (classification === 'GOAL_CREATION') {
        const prompt = `Kullanıcı mesajından hedef bilgilerini çıkar.

                        Mesaj: "${currentInput}"

                        Şu JSON formatında yanıt ver (başka hiçbir şey yazma):
                        {
                        "title": "<hedef başlığı, max 60 karakter>",
                        "target_amount": <sayısal TRY hedef miktarı>
                        }

                        Kurallar:
                        - title: kısa ve anlamlı Türkçe başlık
                        - target_amount: sadece sayı
                        - Mesajda miktar yoksa target_amount: 0 döndür`;

        const result = await generateJSON(prompt, null);

        if (!result || typeof result.target_amount !== 'number' || result.target_amount <= 0)
            return {
                pendingData: null,
                message: 'Hedef miktarını anlayamadım. Örnek: "Tatil için 5000 TL biriktirmek istiyorum"',
            };

        return {
            pendingData: {
                type: 'goal',
                title: result.title ?? 'Yeni Hedef',
                target_amount: result.target_amount,
            },
        };
    }

    return { pendingData: null };
};
