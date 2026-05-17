import ApiError from "../utils/error.js";
import db from "../lib/db/database.js";
import { engineGraph } from "../services/engine/graph.js";
import { createTransactionRecord } from "./transaction.controller.js";
import { createGoalRecord } from "./goals.controller.js";

const sanitizeInput = (str) =>
  str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();

const quickReply = (res, message, buttons = null) =>
  res
    .status(200)
    .json({
      success: true,
      data: {
        message,
        buttons,
        classification: null,
        label: null,
        detected_savings: null,
        wasteful_categories: null,
        optimized_route: null,
        warning: null,
      },
    });

export const analyze = async (req, res) => {
  try {
    const { input, history, buttonPayload } = req.body;

    const chatHistory = Array.isArray(history) ? history.slice(0, 20) : [];
    if (chatHistory.some((m) => !m?.role || !m?.content))
      return res.status(400).json({
        success: false,
        error: "history items must have role and content.",
      });

    if (buttonPayload?.action === "cancel") {
      return quickReply(res, "İptal edildi.", [
        {
          id: "end_analyze",
          label: "Analiz Et",
          payload: { action: "start_analysis" },
        },
        {
          id: "end_transaction",
          label: "İşlem Ekle",
          payload: { action: "start_transaction" },
        },
        {
          id: "end_goal",
          label: "Hedef Oluştur",
          payload: { action: "start_goal" },
        },
      ]);
    }

    if (buttonPayload?.action === "done") {
      return quickReply(res, "Görüşmek üzere!", null);
    }

    if (buttonPayload?.action === "confirm_transaction") {
      const tx = buttonPayload.transaction;
      if (!tx || typeof tx.amount !== "number" || tx.amount <= 0) {
        return res
          .status(400)
          .json({ success: false, error: "Geçersiz işlem verisi." });
      }
      const userId = req.user.id;
      const saved = await createTransactionRecord(userId, tx);
      const time = new Date().toLocaleTimeString("tr-TR", { hour12: false });
      console.log(
        `[ENGINE-CHAT - ${time}] User ${userId} saved transaction ${saved.id} via chat`,
      );
      return quickReply(
        res,
        `Kaydedildi. ${tx.amount.toLocaleString("tr-TR")} TL ${tx.category ?? ""} işlemi eklendi.`,
        [
          {
            id: "end_analyze",
            label: "Analiz Et",
            payload: { action: "start_analysis" },
          },
          {
            id: "end_transaction",
            label: "İşlem Ekle",
            payload: { action: "start_transaction" },
          },
          {
            id: "end_goal",
            label: "Hedef Oluştur",
            payload: { action: "start_goal" },
          },
          {
            id: "end_done",
            label: "Hayır, teşekkürler",
            payload: { action: "done" },
          },
        ],
      );
    }

    if (buttonPayload?.action === "confirm_goal") {
      const goal = buttonPayload.goal;
      if (!goal || !goal.title || !goal.target_amount || !goal.deadline) {
        return res
          .status(400)
          .json({ success: false, error: "Geçersiz hedef verisi." });
      }
      const userId = req.user.id;
      const saved = await createGoalRecord(userId, goal);
      const time = new Date().toLocaleTimeString("tr-TR", { hour12: false });
      console.log(
        `[ENGINE-CHAT - ${time}] User ${userId} created goal ${saved.id} via chat`,
      );
      return quickReply(
        res,
        `${goal.title} hedefi oluşturuldu! Hedef: ${Number(goal.target_amount).toLocaleString("tr-TR")} TL.`,
        [
          {
            id: "end_analyze",
            label: "Analiz Et",
            payload: { action: "start_analysis" },
          },
          {
            id: "end_transaction",
            label: "İşlem Ekle",
            payload: { action: "start_transaction" },
          },
          {
            id: "end_done",
            label: "Hayır, teşekkürler",
            payload: { action: "done" },
          },
        ],
      );
    }

    if (buttonPayload?.action === "confirm_routing") {
      const route = buttonPayload.route;
      if (!route?.goalId || !route?.amount || route.amount <= 0) {
        return res
          .status(400)
          .json({ success: false, error: "Geçersiz yönlendirme verisi." });
      }
      const userId = req.user.id;
      const { rows } = await db.query(
        `UPDATE goals
                 SET current_amount = LEAST(current_amount + $1, target_amount)
                 WHERE id = $2 AND user_id = $3
                 RETURNING title, current_amount, target_amount`,
        [route.amount, route.goalId, userId],
      );
      if (!rows[0])
        return res
          .status(404)
          .json({ success: false, error: "Hedef bulunamadı." });
      const g = rows[0];
      const time = new Date().toLocaleTimeString("tr-TR", { hour12: false });
      console.log(
        `[ENGINE-CHAT - ${time}] User ${userId} routed ${route.amount} TRY to goal ${route.goalId}`,
      );
      return quickReply(
        res,
        `${Number(route.amount).toLocaleString("tr-TR")} TL, ${g.title} hedefine yönlendirildi. Toplam: ${Number(g.current_amount).toLocaleString("tr-TR")} / ${Number(g.target_amount).toLocaleString("tr-TR")} TL.`,
        [
          {
            id: "end_analyze",
            label: "Analiz Et",
            payload: { action: "start_analysis" },
          },
          {
            id: "end_transaction",
            label: "İşlem Ekle",
            payload: { action: "start_transaction" },
          },
          {
            id: "end_done",
            label: "Hayır, teşekkürler",
            payload: { action: "done" },
          },
        ],
      );
    }

    if (
      !buttonPayload &&
      (!input || typeof input !== "string" || sanitizeInput(input).length === 0)
    )
      throw ApiError.badRequest("input is required.");

    const cleanInput = input ? sanitizeInput(input) : "";
    if (cleanInput.length > 500)
      throw ApiError.badRequest("input must not exceed 500 characters.");

    const userId = req.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [transactionsResult, goalsResult, categoriesResult] =
      await Promise.all([
        db.query(
          `SELECT t.id, t.amount, t.type, t.description, t.transaction_timestamp,
                        c.name AS category_name
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = $1 AND t.transaction_timestamp >= $2
                 ORDER BY t.transaction_timestamp DESC`,
          [userId, thirtyDaysAgo],
        ),
        db.query(
          `SELECT id, title, target_amount, current_amount, deadline,
                        CASE WHEN target_amount = 0 THEN 0
                             ELSE ROUND((current_amount / target_amount) * 100, 2)
                        END AS progress_pct
                 FROM goals WHERE user_id = $1 AND status = 'ACTIVE'`,
          [userId],
        ),
        db.query(
          "SELECT id, name, is_essential FROM categories ORDER BY id ASC",
        ),
      ]);

    const finalState = await engineGraph.invoke({
      userId,
      currentInput: cleanInput,
      pastTransactions: transactionsResult.rows,
      activeGoals: goalsResult.rows,
      categories: categoriesResult.rows,
      chatHistory,
      buttonPayload: buttonPayload ?? null,
    });

    const time = new Date().toLocaleTimeString("tr-TR", { hour12: false });
    console.log(
      `[ENGINE - ${time}] User ${userId} — classification: ${finalState.classification}, savings: ${finalState.detectedSavings}`,
    );

    res.status(200).json({
      success: true,
      data: {
        message: finalState.message || "Analizin hazır!",
        buttons: finalState.buttons ?? null,
        classification: finalState.classification,
        label: finalState.label,
        detected_savings: finalState.detectedSavings,
        wasteful_categories: finalState.wastefulCategories,
        optimized_route: finalState.optimizedRoute,
        warning: finalState.warning,
      },
    });
  } catch (error) {
    const isGeminiError =
      error.message?.includes("GoogleGenerativeAI") ||
      error.message?.includes("generativelanguage");
    const statusCode = error.statusCode || (isGeminiError ? 502 : 500);
    const message = isGeminiError
      ? "AI service unavailable. Please try again later."
      : error.message || "Engine analysis failed.";

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
};
