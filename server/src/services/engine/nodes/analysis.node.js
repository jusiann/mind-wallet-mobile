import { generateText } from "../../gemini.service.js";
import { toTR } from "../categoryMap.js";

const NO_DATA_FALLBACK = {
  detectedSavings: 0,
  wastefulCategories: [],
  categoryDeltas: [],
  message: "Analiz için yeterli harcama verisi bulunamadı.",
  label: "Normal",
};

const ANALYSIS_ERROR_FALLBACK = {
  detectedSavings: 0,
  wastefulCategories: [],
  categoryDeltas: [],
  message: "Analiz şu an yapılamadı, lütfen tekrar dene.",
  label: "Normal",
};

// Deterministik ay-ay hesaplama
function computeCategoryDeltas(currentMonthTx, previousMonthTx, categories) {
  const nonEssentialIds = new Set(
    categories.filter((c) => !c.is_essential).map((c) => c.id),
  );

  const sumByCategory = (txs, catId) =>
    txs
      .filter(
        (t) =>
          t.type === "EXPENSE" &&
          String(t.category_id) === String(catId) &&
          nonEssentialIds.has(Number(catId)),
      )
      .reduce((s, t) => s + Number(t.amount), 0);

  const categoryIds = [
    ...new Set([
      ...currentMonthTx.map((t) => t.category_id),
      ...previousMonthTx.map((t) => t.category_id),
    ]),
  ].filter((id) => nonEssentialIds.has(Number(id)));

  const deltas = categoryIds
    .map((catId) => {
      const currentSpent = sumByCategory(currentMonthTx, catId);
      const previousSpent = sumByCategory(previousMonthTx, catId);
      const delta = currentSpent - previousSpent;
      const catName =
        currentMonthTx.find((t) => String(t.category_id) === String(catId))
          ?.category_name ??
        previousMonthTx.find((t) => String(t.category_id) === String(catId))
          ?.category_name ??
        "Diğer";
      return { catId: Number(catId), name: catName, currentSpent, previousSpent, delta };
    })
    .filter((d) => d.delta > 50) // küçük farkları gürültü olarak ele
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  const detectedSavings = Math.round(deltas.reduce((s, d) => s + d.delta, 0));
  return { deltas, detectedSavings };
}

// %20 fallback — önceki ay verisi yoksa
function fallbackSavings(currentMonthTx, categories) {
  const nonEssentialIds = new Set(
    categories.filter((c) => !c.is_essential).map((c) => c.id),
  );
  const nonEssentialTotal = currentMonthTx
    .filter((t) => t.type === "EXPENSE" && nonEssentialIds.has(Number(t.category_id)))
    .reduce((s, t) => s + Number(t.amount), 0);

  const savings = Math.round(nonEssentialTotal * 0.2);

  const byCategory = {};
  for (const t of currentMonthTx) {
    if (t.type !== "EXPENSE" || !nonEssentialIds.has(Number(t.category_id))) continue;
    const key = t.category_id;
    if (!byCategory[key]) byCategory[key] = { name: t.category_name ?? "Diğer", total: 0 };
    byCategory[key].total += Number(t.amount);
  }

  const deltas = Object.entries(byCategory)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 3)
    .map(([catId, { name, total }]) => ({
      catId: Number(catId),
      name,
      currentSpent: total,
      previousSpent: 0,
      delta: Math.round(total * 0.2),
    }));

  return { deltas, detectedSavings: savings, isFallback: true };
}

export const analysisNode = async (state) => {
  const { currentMonthTx = [], previousMonthTx = [], categories = [] } = state;

  const currentExpenses = currentMonthTx.filter((t) => t.type === "EXPENSE");
  if (currentExpenses.length === 0) return NO_DATA_FALLBACK;

  const hasPreviousData = previousMonthTx.filter((t) => t.type === "EXPENSE").length > 0;

  let deltas, detectedSavings, isFallback;
  if (hasPreviousData) {
    ({ deltas, detectedSavings } = computeCategoryDeltas(currentMonthTx, previousMonthTx, categories));
    isFallback = false;
  } else {
    ({ deltas, detectedSavings, isFallback } = fallbackSavings(currentMonthTx, categories));
  }

  // wastefulCategories: responder için uyumlu format
  const wastefulCategories = deltas.map((d) => ({
    name: d.name,
    categoryId: d.catId,
    amount: d.currentSpent,
    delta: d.delta,
    previousSpent: d.previousSpent,
    suggestion: "",
  }));

  // Mesajı Gemini ile cila — sayılar deterministik
  const intentHint = /tasarruf/i.test(state.currentInput ?? "")
    ? "Kullanıcı tasarruf fırsatları arıyor."
    : /nasıl gidiy|bu ay/i.test(state.currentInput ?? "")
      ? "Kullanıcı bu ayın özetini soruyor."
      : "Kullanıcı harcama detaylarını öğrenmek istiyor.";

  const totalCurrentMonth = currentExpenses.reduce((s, t) => s + Number(t.amount), 0);

  let deltasSummary;
  if (isFallback) {
    deltasSummary = `Önceki ay verisi yok; bu ay zorunlu olmayan kategorilerde toplam ${totalCurrentMonth.toLocaleString("tr-TR")} TL harcandı. Önerilen tasarruf: ${detectedSavings.toLocaleString("tr-TR")} TL (%20).`;
  } else {
    deltasSummary = deltas.length > 0
      ? deltas.map((d) => `${toTR(d.name)}: geçen ay ${d.previousSpent.toLocaleString("tr-TR")} TL, bu ay ${d.currentSpent.toLocaleString("tr-TR")} TL (+${d.delta.toLocaleString("tr-TR")} TL)`).join("; ")
      : `Bu ay geçen aya göre harcamalar benzer, tespit edilen anlamlı artış yok.`;
  }

  const prompt = `Kullanıcının harcama karşılaştırma verisi:
${deltasSummary}
Bu ayki toplam harcama: ${totalCurrentMonth.toLocaleString("tr-TR")} TL.
Toplam tasarruf önerisi: ${detectedSavings.toLocaleString("tr-TR")} TL.
${intentHint}

Kullanıcı mesajı: "${state.currentInput ?? ""}"

Yukarıdaki verilere dayanarak Türkçe, samimi, kısa (1-2 cümle) bir özet yaz. Sadece özet metni yaz, JSON veya başka format kullanma. Sayıları değiştirme.`;

  try {
    const message = await generateText(prompt, null);
    return {
      detectedSavings,
      wastefulCategories,
      categoryDeltas: deltas,
      message: message ?? `Bu ay ${detectedSavings.toLocaleString("tr-TR")} TL tasarruf edebilirsin.`,
      label: detectedSavings > 500 ? "Opportunity" : "Normal",
    };
  } catch (err) {
    if (err?.status === 429) {
      return {
        detectedSavings,
        wastefulCategories,
        categoryDeltas: deltas,
        message: `Bu ay ${detectedSavings.toLocaleString("tr-TR")} TL tasarruf fırsatı var. Mindy şu an yoğun, detayları biraz sonra sor.`,
        label: detectedSavings > 500 ? "Opportunity" : "Normal",
      };
    }
    return ANALYSIS_ERROR_FALLBACK;
  }
};
