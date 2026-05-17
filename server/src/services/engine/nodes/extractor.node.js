import { generateJSON } from "../../gemini.service.js";

// ─── Turkish amount parser ─────────────────────────────────────────────────
const MULTIPLIERS = { bin: 1_000, milyon: 1_000_000, milyar: 1_000_000_000 };
const AMOUNT_RE = /(\d[\d.,]*)\s*(bin|milyon|milyar)?(?:\s*(?:tl|₺|lira))?/i;

function parseTurkishAmount(text) {
  const m = text.match(AMOUNT_RE);
  if (!m) return 0;
  // Dots used as thousands separator (e.g. 250.000 → 250000); comma as decimal
  const numStr = m[1].replace(/\.(?=\d{3}(?:[.,]|$))/g, "").replace(",", ".");
  const base = parseFloat(numStr);
  if (isNaN(base) || base <= 0) return 0;
  return base * (m[2] ? (MULTIPLIERS[m[2].toLowerCase()] ?? 1) : 1);
}

function extractGoalFromInput(input) {
  const fullMatch = input.match(
    /\d[\d.,]*\s*(?:bin|milyon|milyar)?(?:\s*(?:tl|₺|lira))?/i,
  );
  if (!fullMatch) return null;

  const amount = parseTurkishAmount(fullMatch[0]);
  if (amount <= 0) return null;

  const NOISE =
    /\b(için|hedefi?|biriktirmek|istiyorum|biriktir|tasarruf|etmek|kaydet|oluştur|tl|lira|₺)\b/gi;
  const title = input
    .replace(fullMatch[0], "")
    .replace(NOISE, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);

  return { title: title || "Yeni Hedef", target_amount: amount };
}
// ──────────────────────────────────────────────────────────────────────────

export const extractorNode = async (state) => {
  const { classification, currentInput, categories } = state;

  const categoryNames = categories.map((c) => c.name).join(", ");

  if (classification === "TRANSACTION") {
    const prompt = `Extract transaction details from the user message.

                        Available categories: ${categoryNames || "Food, Transportation, Entertainment, Shopping, Bills, Health, Other"}

                        Message: "${currentInput}"

                        Respond in the following JSON format (write nothing else):
                        {
                        "amount": <numeric TRY amount>,
                        "type": "EXPENSE" or "INCOME",
                        "category": "<closest match from available categories>",
                        "description": "<short description in Turkish, max 100 characters>"
                        }

                        Rules:
                        - amount: number only, not a string
                        - type: spending/expense → "EXPENSE", income/earnings → "INCOME"
                        - category: must be one of the available categories
                        - description: must be in Turkish
                        - If no amount in the message, return amount: 0`;

    const result = await generateJSON(prompt, null);

    if (!result || typeof result.amount !== "number" || result.amount <= 0)
      return {
        pendingData: null,
        message: 'İşlem tutarı anlaşılamadı. Örnek: "Markete 150 TL harcadım"',
      };

    return {
      pendingData: {
        type: "transaction",
        amount: result.amount,
        transactionType: result.type === "INCOME" ? "INCOME" : "EXPENSE",
        category: result.category ?? "Other",
        description: result.description ?? currentInput.slice(0, 100),
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (classification === "GOAL_CREATION") {
    // Try pattern-based extraction first — no Gemini call
    const fast = extractGoalFromInput(currentInput);
    if (fast) {
      return {
        pendingData: {
          type: "goal",
          title: fast.title,
          target_amount: fast.target_amount,
        },
      };
    }

    // Fallback to Gemini for complex or ambiguous phrasing
    const prompt = `Extract goal details from the user message.

                        Message: "${currentInput}"

                        Respond in the following JSON format (write nothing else):
                        {
                        "title": "<goal title, max 60 characters>",
                        "target_amount": <numeric TRY target amount>
                        }

                        Rules:
                        - title: short and meaningful title in Turkish
                        - target_amount: number only
                        - If no amount in the message, return target_amount: 0`;

    const result = await generateJSON(prompt, null);

    if (
      !result ||
      typeof result.target_amount !== "number" ||
      result.target_amount <= 0
    )
      return {
        pendingData: null,
        message:
          'Hedef tutarı anlaşılamadı. Örnek: "Tatil için 5000 TL biriktirmek istiyorum"',
      };

    return {
      pendingData: {
        type: "goal",
        title: result.title ?? "Yeni Hedef",
        target_amount: result.target_amount,
      },
    };
  }

  return { pendingData: null };
};
