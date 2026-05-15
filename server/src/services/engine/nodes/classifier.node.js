import { generateText } from '../../gemini.service.js';

export const classifierNode = async (state) => {
    const recentCtx = state.chatHistory.slice(-2)
        .map(m => `${m.role === 'user' ? 'Kullanici' : 'Asistan'}: ${m.content}`)
        .join('\n');

    const contextBlock = recentCtx ? `\nOnceki konusma baglamı:\n${recentCtx}\n` : '';

    const prompt = `Kullanıcı mesajını sınıflandır. Sadece "ANALYSIS", "TRANSACTION" veya "GOAL_CREATION" yaz, başka şey yazma.
                    ANALYSIS: Harcama analizi, bütçe inceleme, tasarruf tavsiyesi, genel soru, kategori azaltma isteği.
                    TRANSACTION: Yeni bir harcama veya gelir kaydetme girişimleri ("X TL harcadım", "X TL aldım" vb.).
                    GOAL_CREATION: Yeni bir finansal hedef oluşturma isteği ("X TL biriktirmek istiyorum", "hedef oluştur" vb.).
                    ${contextBlock}
                    Mesaj: "${state.currentInput}"`;

    const raw = await generateText(prompt, 'ANALYSIS');
    const upper = raw.trim().toUpperCase();

    const classification = upper.includes('TRANSACTION') ? 'TRANSACTION'
        : upper.includes('GOAL_CREATION') ? 'GOAL_CREATION'
        : 'ANALYSIS';

    return { classification };
};
