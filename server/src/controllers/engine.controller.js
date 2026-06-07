import ApiError from '../utils/error.js';
import db from '../lib/db/database.js';
import { createTransactionRecord } from './transaction.controller.js';
import { createGoalRecord } from './goals.controller.js';
import { toTR } from '../services/engine/categoryMap.js';
import { getContext, invalidateContext } from '../services/engine/contextCache.js';
import { smartRouter } from '../services/engine/router.js';
import {
    NAV_BUTTONS,
    TX_SUCCESS_BUTTONS,
    CANCEL_BUTTONS,
} from '../constants/engine.constants.js';

const sanitizeInput = (str) => str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();

const quickReply = (res, message, buttons = null, classification = null) =>
    res.status(200).json({
        success: true,
        data: {
            message,
            buttons,
            classification,
            label: null,
            detected_savings: null,
            wasteful_categories: null,
            optimized_route: null,
            warning: null,
        },
    });

export const action = async (req, res) => {
    try {
        const { buttonPayload, history } = req.body;
        if (!buttonPayload || !buttonPayload.action) throw ApiError.badRequest('action payload is required.');

        const userId = req.user.id;
        const chatHistory = Array.isArray(history) ? history.slice(0, 20) : [];

        // ── cancel ──
        if (buttonPayload.action === 'cancel') {
            return quickReply(res, 'İptal edildi. Başka ne yapabilirim?', CANCEL_BUTTONS);
        }

        // ── done ──
        if (buttonPayload.action === 'done') {
            return quickReply(res, 'Görüşmek üzere!', null);
        }

        // ── confirm_transaction ──
        if (buttonPayload.action === 'confirm_transaction') {
            const tx = buttonPayload.transaction;
            if (!tx || typeof tx.amount !== 'number' || tx.amount <= 0)
                return res.status(400).json({ success: false, error: 'Geçersiz işlem verisi.' });
            const saved = await createTransactionRecord(userId, tx);
            invalidateContext(userId);
            const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
            console.log(`[ENGINE-CHAT - ${time}] User ${userId} saved transaction ${saved.id} via chat`);
            const categoryLabel = toTR(tx.category ?? '');
            const typeLabel = tx.transactionType === 'INCOME' ? 'gelir' : 'gider';
            return quickReply(
                res,
                `${tx.amount.toLocaleString('tr-TR')} TL ${categoryLabel} ${typeLabel}i kaydedildi!`,
                TX_SUCCESS_BUTTONS,
                'TRANSACTION'
            );
        }

        // ── confirm_goal ──
        if (buttonPayload.action === 'confirm_goal') {
            const goal = buttonPayload.goal;
            if (!goal || !goal.title || !goal.target_amount || !goal.deadline)
                return res.status(400).json({ success: false, error: 'Geçersiz hedef verisi.' });
            const saved = await createGoalRecord(userId, goal);
            invalidateContext(userId);
            const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
            console.log(`[ENGINE-CHAT - ${time}] User ${userId} created goal ${saved.id} via chat`);
            return quickReply(
                res,
                `"${goal.title}" hedefi oluşturuldu! Hedef: ${Number(goal.target_amount).toLocaleString('tr-TR')} TL.`,
                NAV_BUTTONS,
                'GOAL_CREATION'
            );
        }

        // ── confirm_goal_contribution ──
        if (buttonPayload.action === 'confirm_goal_contribution') {
            const contribution = buttonPayload.contribution;
            if (!contribution?.goalId || !contribution?.amount || contribution.amount <= 0)
                return res.status(400).json({ success: false, error: 'Geçersiz katkı verisi.' });
            const { rows } = await db.query(
                `UPDATE goals SET current_amount = LEAST(current_amount + $1, target_amount), updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING title, current_amount, target_amount`,
                [contribution.amount, contribution.goalId, userId]
            );
            if (!rows[0]) return res.status(404).json({ success: false, error: 'Hedef bulunamadı.' });
            invalidateContext(userId);
            const g = rows[0];
            return quickReply(
                res,
                `${Number(contribution.amount).toLocaleString('tr-TR')} TL "${g.title}" hedefine eklendi! Toplam: ${Number(g.current_amount).toLocaleString('tr-TR')} / ${Number(g.target_amount).toLocaleString('tr-TR')} TL.`,
                NAV_BUTTONS,
                'GOAL_CONTRIBUTION'
            );
        }

        // ── confirm_pledge ──
        if (buttonPayload.action === 'confirm_pledge') {
            const pledge = buttonPayload.pledge;
            if (!pledge?.goalId || !pledge?.amount || pledge.amount <= 0)
                return res.status(400).json({ success: false, error: 'Geçersiz taahhüt verisi.' });
            let categoryId = null;
            if (pledge.category) {
                const catResult = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1', [pledge.category]);
                categoryId = catResult.rows[0]?.id ?? null;
            }
            const now = new Date();
            const baselineMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

            const { rowCount } = await db.query(
                `UPDATE savings_pledges SET amount = amount + $1 WHERE user_id = $2 AND goal_id = $3 AND category_id = $4 AND baseline_month = $5 AND status = 'PENDING'`,
                [pledge.amount, userId, pledge.goalId, categoryId, baselineMonth]
            );

            if (rowCount === 0) {
                await db.query(
                    `INSERT INTO savings_pledges (user_id, goal_id, category_id, amount, baseline_month, baseline_spent, status) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
                    [userId, pledge.goalId, categoryId, pledge.amount, baselineMonth, pledge.categorySpent ?? 0]
                );
            }
            return quickReply(
                res,
                `Söz verildi! ${Number(pledge.amount).toLocaleString('tr-TR')} TL'yi "${pledge.goalTitle}" hedefin için ayırdım. Bu ay bu kategoride gerçekten az harcarsan, tutarı otomatik hedefe aktaracağım.`,
                NAV_BUTTONS,
                'ANALYSIS'
            );
        }

        // ── confirm_routing ──
        if (buttonPayload.action === 'confirm_routing') {
            const route = buttonPayload.route;
            if (!route?.goalId || !route?.amount || route.amount <= 0)
                return res.status(400).json({ success: false, error: 'Geçersiz yönlendirme verisi.' });
            const { rows } = await db.query(
                `UPDATE goals SET current_amount = LEAST(current_amount + $1, target_amount) WHERE id = $2 AND user_id = $3 RETURNING title, current_amount, target_amount`,
                [route.amount, route.goalId, userId]
            );
            if (!rows[0]) return res.status(404).json({ success: false, error: 'Hedef bulunamadı.' });
            invalidateContext(userId);
            const g = rows[0];
            return quickReply(
                res,
                `${Number(route.amount).toLocaleString('tr-TR')} TL, ${g.title} hedefine yönlendirildi. Toplam: ${Number(g.current_amount).toLocaleString('tr-TR')} / ${Number(g.target_amount).toLocaleString('tr-TR')} TL.`,
                NAV_BUTTONS,
                'GOAL_CONTRIBUTION'
            );
        }

        // ── Fallback: delegate to smart router ──
        const ctx = await getContext(userId);
        const finalState = await smartRouter(ctx, '', buttonPayload, chatHistory);
        res.status(200).json({ success: true, data: finalState });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'Action failed.' });
    }
};

export const chat = async (req, res) => {
    try {
        const { input, history } = req.body;
        if (!input || typeof input !== 'string' || sanitizeInput(input).length === 0)
            throw ApiError.badRequest('input is required.');

        const cleanInput = sanitizeInput(input);
        if (cleanInput.length > 500)
            throw ApiError.badRequest('input must not exceed 500 characters.');

        const userId = req.user.id;
        const chatHistory = Array.isArray(history) ? history.slice(0, 20) : [];

        const ctx = await getContext(userId);
        const finalState = await smartRouter(ctx, cleanInput, null, chatHistory);

        res.status(200).json({ success: true, data: finalState });
    } catch (error) {
        const isGeminiError = error.message?.includes('GoogleGenerativeAI') || error.message?.includes('generativelanguage');
        const statusCode = error.statusCode || (isGeminiError ? 502 : 500);
        res.status(statusCode).json({
            success: false,
            error: isGeminiError ? 'AI service unavailable. Please try again later.' : (error.message || 'Engine chat failed.'),
        });
    }
};
