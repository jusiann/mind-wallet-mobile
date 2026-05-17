import { generateJSON } from "../../gemini.service.js";

const NO_DATA_FALLBACK = {
  detectedSavings: 0,
  wastefulCategories: [],
  message: "Analiz için yeterli harcama verisi bulunamadı.",
  label: "Normal",
};

function computeBasicAnalysis(expenses, input = "") {
  const total = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

  const byCategory = {};
  for (const t of expenses) {
    const cat = t.category_name ?? "Diğer";
    byCategory[cat] = (byCategory[cat] ?? 0) + Number(t.amount);
  }
  const top3 = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({
      name,
      amount,
      suggestion: "Bu kategorideki harcamaları gözden geçir.",
    }));

  const savings = Math.round(total * 0.15);
  const totalStr = Number(total).toLocaleString("tr-TR");

  let message;
  if (/tasarruf/i.test(input)) {
    const tip = top3[0]
      ? `${top3[0].name} harcamalarını azaltarak aylık yaklaşık ${Number(Math.round(top3[0].amount * 0.3)).toLocaleString("tr-TR")} TL tasarruf edebilirsin.`
      : "Harcama kategorilerini inceleyerek tasarruf alanları bulabilirsin.";
    message = `Bu ay ${totalStr} TL harcama yaptın. Tasarruf potansiyeli: ~${Number(savings).toLocaleString("tr-TR")} TL. ${tip}`;
  } else if (/nasıl gidiy|bu ay|durum/i.test(input)) {
    const topCat = top3[0]
      ? `En yüksek harcama ${top3[0].name} kategorisinde: ${Number(top3[0].amount).toLocaleString("tr-TR")} TL.`
      : "";
    message =
      `Bu ay toplam ${totalStr} TL harcama yaptın. ${topCat} ${savings > 0 ? `Yaklaşık ${Number(savings).toLocaleString("tr-TR")} TL tasarruf edebilirsin.` : ""}`.trim();
  } else {
    const breakdown = top3
      .map((c) => `${c.name}: ${Number(c.amount).toLocaleString("tr-TR")} TL`)
      .join(" • ");
    message = `Son 30 günde ${totalStr} TL harcama yaptın. Kategori dağılımı: ${breakdown || "veri yok"}.`;
  }

  return {
    detectedSavings: savings,
    wastefulCategories: top3,
    message,
    label: savings > 500 ? "Opportunity" : "Normal",
  };
}

export const analysisNode = async (state) => {
  const expenses =
    state.pastTransactions?.filter((t) => t.type === "EXPENSE") ?? [];

  if (expenses.length === 0) return NO_DATA_FALLBACK;

  const transactionsJson = JSON.stringify(
    expenses.map((t) => ({
      amount: t.amount,
      category: t.category_name ?? "Uncategorized",
      description: t.description ?? "",
      date: t.transaction_timestamp,
    })),
    null,
    2,
  );

  const historyBlock = state.chatHistory.length
    ? `\nPrevious conversation:\n${state.chatHistory.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n")}\n`
    : "";

  const categoryFocus =
    state.buttonPayload?.action === "reduce_category"
      ? `\nThe user specifically wants to reduce the "${state.buttonPayload.category}" category. Focus on this category.\n`
      : "";

  const intentHint = /tasarruf/i.test(state.currentInput)
    ? "\nFocus on savings opportunities and concrete tips for reducing spending."
    : /nasıl gidiy|bu ay/i.test(state.currentInput)
      ? "\nFocus on a monthly status summary — total spending, biggest category, and whether the user is on track."
      : "\nFocus on a detailed category breakdown and highlight the most wasteful areas.";

  const prompt = `User's spending history from the last 30 days:
                    ${transactionsJson}
                    ${historyBlock}${categoryFocus}${intentHint}
                    Current user message: "${state.currentInput}"

                    Analyze and respond in the following JSON format (write nothing else):
                    {
                    "detectedSavings": <estimated numeric value of how much can be saved monthly in TRY>,
                    "wastefulCategories": [
                        { "name": "<category name>", "amount": <total TRY spent>, "suggestion": "<short suggestion in Turkish>" }
                    ],
                    "message": "<Turkish summary, 1-2 sentences, conversational tone>"
                    }

                    Rules:
                    - wastefulCategories: top 3 most wasteful categories, empty array if none
                    - detectedSavings: realistic savings estimate, maximum 40% of total spending
                    - All numeric values must be numbers or decimals, not strings
                    - Tailor the message to the user's specific question above`;

  try {
    const result = await generateJSON(prompt, null);
    if (!result) return computeBasicAnalysis(expenses, state.currentInput);

    const detectedSavings =
      typeof result.detectedSavings === "number" ? result.detectedSavings : 0;
    return {
      detectedSavings,
      wastefulCategories: Array.isArray(result.wastefulCategories)
        ? result.wastefulCategories
        : [],
      message:
        result.message ??
        computeBasicAnalysis(expenses, state.currentInput).message,
      label: detectedSavings > 500 ? "Opportunity" : "Normal",
    };
  } catch {
    return computeBasicAnalysis(expenses, state.currentInput);
  }
};
