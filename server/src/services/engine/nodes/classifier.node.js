import { generateText } from '../../gemini.service.js';

export const classifierNode = async (state) => {
    const prompt = `Kullanıcı mesajını sınıflandır. Sadece "ANALYSIS" veya "TRANSACTION" yaz, başka şey yazma.

ANALYSIS: Harcama analizi, bütçe inceleme, tasarruf tavsiyesi, genel soru istekleri.
TRANSACTION: Yeni bir harcama veya gelir kaydetme girişimleri.

Mesaj: "${state.currentInput}"`;

    const raw = await generateText(prompt, 'ANALYSIS');
    const classification = raw.trim().toUpperCase().includes('TRANSACTION') ? 'TRANSACTION' : 'ANALYSIS';

    return { classification };
};
