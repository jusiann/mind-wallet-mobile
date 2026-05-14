import { generateJSON } from '../../gemini.service.js';

export const routingNode = async (state) => {
    const { detectedSavings, activeGoals } = state;

    if (!detectedSavings || detectedSavings <= 0 || !activeGoals?.length) {
        return { optimizedRoute: null };
    }

    const goalsJson = JSON.stringify(
        activeGoals.map(g => ({
            id: g.id,
            title: g.title,
            target_amount: g.target_amount,
            current_amount: g.current_amount,
            deadline: g.deadline,
            progress_pct: g.progress_pct,
        })),
        null, 2,
    );

    const prompt = `Kullanıcı aylık ${detectedSavings} TRY tasarruf edebilir.

Aktif finansal hedefler:
${goalsJson}

Bu tasarrufu hangi hedefe öncelikli yönlendirmeliyiz?
Seçilen hedef için mevcut current_amount'a ek olarak aylık ${detectedSavings} TRY eklendiğinde yeni tahmini tamamlanma tarihini hesapla.

Şu JSON formatında yanıt ver (başka hiçbir şey yazma):
{
  "goal_id": <seçilen hedefin id'si>,
  "goal_title": "<hedef başlığı>",
  "monthly_allocation": <aylık yönlendirilecek TRY miktarı>,
  "days_saved": <kaç gün erken tamamlanacak>,
  "new_deadline": "<yeni tahmini tamamlanma tarihi, ISO format YYYY-MM-DD>",
  "message": "<Türkçe öneri mesajı, 1-2 cümle>"
}`;

    const result = await generateJSON(prompt, null);

    if (!result || !result.goal_id) {
        return { optimizedRoute: null };
    }

    return {
        optimizedRoute: {
            goal_id: result.goal_id,
            goal_title: result.goal_title,
            monthly_allocation: result.monthly_allocation,
            days_saved: result.days_saved,
            new_deadline: result.new_deadline,
            message: result.message,
        },
    };
};
