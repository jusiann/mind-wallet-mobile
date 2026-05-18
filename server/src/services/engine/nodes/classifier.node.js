import { generateText } from "../../gemini.service.js";

const GOAL_STATUS_PATTERN = /hedef/i;
const GOAL_STATUS_CONTEXT =
  /kald|durum|ilerleme|ne kadar|kaçta|tamamland|yüzde|bitti|bitiyor|nasıl/i;
const AMOUNT_PRESENT =
  /\d[\d.,]*\s*(?:bin|milyon|milyar)?(?:\s*(?:tl|₺|lira))?/i;
const ANALYSIS_FAST =
  /analiz|nasıl gidiy|tasarruf.*öner|öner.*tasarruf|bütçe|bu ay|aylık|harcama.*göster|ne kadar harca/i;
const CHITCHAT_PATTERN =
  /^[\s]*(?:selam|merhaba|hey|iyi\s*(?:günler|akşamlar|sabahlar|geceler)|günaydın|nasılsın|naber|ne\s*haber|teşekkür(?:ler)?|sağ\s*ol|eyvallah|görüşürüz|hoşça\s*kal)[\s!.]*$/i;
// "300 TL'yi Tatil hedefime ekle" / "Y hedefine X TL ekle/yatır/aktar"
const GOAL_CONTRIBUTION_PATTERN =
  /(?:hedef(?:im)?(?:e|ine|ne)|hedefe).*\d|(?:\d[\d.,]*).*(?:hedef(?:im)?(?:e|ine|ne)|hedefe)|\d[\d.,]*\s*(?:tl|₺|lira)?.*(?:ekle|yatır|aktar|koy|kaydet).*hedef|hedef.*(?:ekle|yatır|aktar|koy).*\d/i;

export const classifierNode = async (state) => {
  const input = state.currentInput;

  // Fast keyword classification — no Gemini call needed
  if (CHITCHAT_PATTERN.test(input)) return { classification: "CHITCHAT" };

  if (GOAL_STATUS_PATTERN.test(input) && GOAL_STATUS_CONTEXT.test(input))
    return { classification: "GOAL_STATUS" };

  // Direct goal contribution: "X TL'yi Y hedefime ekle"
  if (GOAL_CONTRIBUTION_PATTERN.test(input) && AMOUNT_PRESENT.test(input))
    return { classification: "GOAL_CONTRIBUTION" };

  // Clear analysis intent without an amount → no Gemini needed
  if (ANALYSIS_FAST.test(input) && !AMOUNT_PRESENT.test(input))
    return { classification: "ANALYSIS" };

  // Context-aware: infer intent from the last assistant message
  if (AMOUNT_PRESENT.test(input)) {
    const lastAssistant =
      state.chatHistory.filter((m) => m.role === "model").slice(-1)[0]
        ?.content ?? "";
    if (/adını.*tutarını|tutarını.*yaz|hedef.*oluştur/i.test(lastAssistant))
      return { classification: "GOAL_CREATION" };
    if (/işlemi.*eklemek|hangi işlem|harcama.*yaz/i.test(lastAssistant))
      return { classification: "TRANSACTION" };
  }

  const recentCtx = state.chatHistory
    .slice(-2)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const contextBlock = recentCtx
    ? `\nPrevious conversation context:\n${recentCtx}\n`
    : "";

  const prompt = `Classify the user message. Write only "ANALYSIS", "TRANSACTION", "GOAL_CREATION", or "GOAL_CONTRIBUTION", nothing else.
                    ANALYSIS: Spending analysis, budget review, savings advice, general questions, category reduction requests.
                    TRANSACTION: Attempts to record a new expense or income ("I spent X TRY", "I earned X TRY", etc.).
                    GOAL_CREATION: Requests to create a new financial goal ("I want to save X TRY for Y", "create a goal", etc.).
                    GOAL_CONTRIBUTION: Requests to directly add money to an existing goal ("add X TRY to my Y goal", "put X TRY into goal", etc.).
                    ${contextBlock}
                    Message: "${state.currentInput}"`;

  try {
    const raw = await generateText(prompt, "ANALYSIS");
    const upper = raw.trim().toUpperCase();
    const classification = upper.includes("GOAL_CONTRIBUTION")
      ? "GOAL_CONTRIBUTION"
      : upper.includes("TRANSACTION")
        ? "TRANSACTION"
        : upper.includes("GOAL_CREATION")
          ? "GOAL_CREATION"
          : "ANALYSIS";
    return { classification };
  } catch {
    return { classification: "ANALYSIS" };
  }
};
