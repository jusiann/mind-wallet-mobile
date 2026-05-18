import { generateJSON } from "../../gemini.service.js";

// ─── Turkish amount parser ─────────────────────────────────────────────────
const MULTIPLIERS = { bin: 1_000, milyon: 1_000_000, milyar: 1_000_000_000 };
const AMOUNT_RE = /(\d[\d.,]*)\s*(bin|milyon|milyar)?(?:\s*(?:tl|₺|lira))?/i;

function parseTurkishAmount(text) {
  const m = text.match(AMOUNT_RE);
  if (!m) return 0;
  const numStr = m[1].replace(/\.(?=\d{3}(?:[.,]|$))/g, "").replace(",", ".");
  const base = parseFloat(numStr);
  if (isNaN(base) || base <= 0) return 0;
  return base * (m[2] ? (MULTIPLIERS[m[2].toLowerCase()] ?? 1) : 1);
}

const NOISE =
  /\b(için|hedefi?|biriktirmek|istiyorum|biriktir|birikim|tasarruf|etmek|kaydet|oluştur|almak|yapmak|gitmek|satın|tl|lira|₺|hedefe|ekle|yatır|aktar|koy|para|bir|ve|ile|de|da)\b/gi;

function enforceShortTitle(raw) {
  const cleaned = raw
    .replace(NOISE, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter(Boolean);
  // Max 3 kelime
  const short = words.slice(0, 3).join(" ");
  if (!short) return "";
  return short.charAt(0).toUpperCase() + short.slice(1);
}

function extractGoalFromInput(input) {
  const fullMatch = input.match(
    /\d[\d.,]*\s*(?:bin|milyon|milyar)?(?:\s*(?:tl|₺|lira))?/i,
  );

  const amount = fullMatch ? parseTurkishAmount(fullMatch[0]) : 0;

  const raw = (fullMatch ? input.replace(fullMatch[0], "") : input)
    .trim();

  const title = enforceShortTitle(raw);

  if (amount > 0 || title) {
    return { title: title || "Yeni Hedef", target_amount: amount };
  }
  return null;
}
// ──────────────────────────────────────────────────────────────────────────

// Fuzzy goal matching — Levenshtein ≤ 2 veya substring
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function findGoalByTitle(input, goals) {
  const lower = input.toLowerCase();
  // Substring match önce
  const subMatch = goals.find((g) => lower.includes(g.title.toLowerCase()));
  if (subMatch) return subMatch;
  // Levenshtein ≤ 2
  return goals.find((g) => levenshtein(lower, g.title.toLowerCase()) <= 2) ?? null;
}

// ──────────────────────────────────────────────────────────────────────────

export const extractorNode = async (state) => {
  const { classification, currentInput, categories, activeGoals = [] } = state;

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
                        "title": "<1-3 kelimelik kısa başlık, sadece ana konu — örn: 'Motorsiklet', 'Tatil', 'Araba', 'Ev Peşinatı'>",
                        "target_amount": <numeric TRY target amount>
                        }

                        Rules:
                        - title: 1-3 kelime MAXIMUM, sadece tasarruf edilmek istenen şeyin adı, Türkçe, başlık formatında
                        - target_amount: number only
                        - If no amount in the message, return target_amount: 0`;

    const result = await generateJSON(prompt, null);

    if (!result) {
      const fast2 = extractGoalFromInput(currentInput);
      if (fast2)
        return { pendingData: { type: "goal", title: fast2.title, target_amount: fast2.target_amount } };
      return {
        pendingData: null,
        message: 'Hedef tutarı anlaşılamadı. Örnek: "Tatil için 5000 TL biriktirmek istiyorum"',
      };
    }

    const rawTitle = typeof result.title === "string" ? result.title : "";
    const safeTitle = enforceShortTitle(rawTitle) || "Yeni Hedef";

    if (typeof result.target_amount !== "number" || result.target_amount <= 0)
      return {
        pendingData: {
          type: "goal",
          title: safeTitle,
          target_amount: 0,
        },
      };

    return {
      pendingData: {
        type: "goal",
        title: safeTitle,
        target_amount: result.target_amount,
      },
    };
  }

  if (classification === "GOAL_CONTRIBUTION") {
    const amount = parseTurkishAmount(currentInput);
    if (amount <= 0)
      return {
        pendingData: null,
        message: 'Tutar anlaşılamadı. Örnek: "Tatil hedefime 500 TL ekle"',
      };

    // Hangi hedef?
    const matchedGoal = activeGoals.length > 0
      ? findGoalByTitle(currentInput, activeGoals)
      : null;

    if (matchedGoal) {
      return {
        pendingData: {
          type: "goal_contribution",
          amount,
          goalId: matchedGoal.id,
          goalTitle: matchedGoal.title,
        },
      };
    }

    // Hedef bulunamadı — kullanıcıdan seçmesini iste
    return {
      pendingData: {
        type: "goal_contribution",
        amount,
        goalId: null,
        goalTitle: null,
      },
    };
  }

  return { pendingData: null };
};
