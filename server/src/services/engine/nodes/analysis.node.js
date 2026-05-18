import { generateJSON } from "../../gemini.service.js";
import { toTR } from "../categoryMap.js";

const NO_DATA_FALLBACK = {
  detectedSavings: 0,
  wastefulCategories: [],
  message: "Analiz için yeterli harcama verisi bulunamadı.",
  label: "Normal",
};

const ANALYSIS_ERROR_FALLBACK = {
  detectedSavings: 0,
  wastefulCategories: [],
  message: "Analiz şu an yapılamadı, lütfen tekrar dene.",
  label: "Normal",
};

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
                    - wastefulCategories: top 3 most wasteful categories, empty array if none; suggestion field must be in Turkish
                    - detectedSavings: realistic savings estimate, maximum 40% of total spending
                    - All numeric values must be numbers or decimals, not strings
                    - message must be in Turkish
                    - Tailor the message to the user's specific question above`;

  try {
    const result = await generateJSON(prompt, null);
    if (!result) return ANALYSIS_ERROR_FALLBACK;

    const detectedSavings =
      typeof result.detectedSavings === "number" ? result.detectedSavings : 0;
    return {
      detectedSavings,
      wastefulCategories: Array.isArray(result.wastefulCategories)
        ? result.wastefulCategories.map((c) => ({ ...c, name: toTR(c.name) }))
        : [],
      message: result.message ?? ANALYSIS_ERROR_FALLBACK.message,
      label: detectedSavings > 500 ? "Opportunity" : "Normal",
    };
  } catch (err) {
    if (err?.status === 429) {
      return {
        ...ANALYSIS_ERROR_FALLBACK,
        message: "Mindy şu an çok yoğun, biraz bekleyip tekrar dener misin? 🙏",
      };
    }
    return ANALYSIS_ERROR_FALLBACK;
  }
};
