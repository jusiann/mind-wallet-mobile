import db from '../lib/db/database.js';
import ApiError from '../utils/error.js';
import { invalidateContext } from '../services/engine/contextCache.js';

export const listPledges = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        const statusFilter = status ? 'AND sp.status = $2' : '';
        const params = status ? [userId, status] : [userId];

        const { rows } = await db.query(
            `SELECT sp.id, sp.amount, sp.baseline_month, sp.baseline_spent, sp.status,
                    sp.created_at, sp.resolved_at,
                    g.title AS goal_title, g.id AS goal_id,
                    c.name AS category_name
             FROM savings_pledges sp
             JOIN goals g ON sp.goal_id = g.id
             LEFT JOIN categories c ON sp.category_id = c.id
             WHERE sp.user_id = $1 ${statusFilter}
             ORDER BY sp.created_at DESC
             LIMIT 50`,
            params,
        );

        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to list pledges',
        });
    }
};

export const resolvePledge = async (req, res) => {
    try {
        const userId = req.user.id;
        const pledgeId = Number(req.params.id);

        if (!pledgeId || isNaN(pledgeId))
            throw ApiError.badRequest('Geçersiz taahhüt ID.');

        const { rows: pledgeRows } = await db.query(
            `SELECT sp.*, c.name AS category_name
             FROM savings_pledges sp
             LEFT JOIN categories c ON sp.category_id = c.id
             WHERE sp.id = $1 AND sp.user_id = $2 AND sp.status = 'PENDING'`,
            [pledgeId, userId],
        );

        if (!pledgeRows[0])
            throw ApiError.notFound('Aktif taahhüt bulunamadı.');

        const pledge = pledgeRows[0];

        const pledgeMonthStart = new Date(pledge.baseline_month);
        pledgeMonthStart.setMonth(pledgeMonthStart.getMonth() + 1);
        const pledgeMonthEnd = new Date(pledgeMonthStart.getFullYear(), pledgeMonthStart.getMonth() + 1, 0, 23, 59, 59);

        let actualSpent = 0;
        if (pledge.category_id) {
            const { rows: txRows } = await db.query(
                `SELECT COALESCE(SUM(amount), 0) AS total
                 FROM transactions
                 WHERE user_id = $1 AND category_id = $2 AND type = 'EXPENSE'
                   AND transaction_timestamp >= $3 AND transaction_timestamp <= $4`,
                [userId, pledge.category_id, pledgeMonthStart, pledgeMonthEnd],
            );
            actualSpent = Number(txRows[0]?.total ?? 0);
        }

        const saved = Number(pledge.baseline_spent) - actualSpent;
        const resolved = saved >= Number(pledge.amount);

        if (resolved) {
            const { rows: goalRows } = await db.query(
                `UPDATE goals
                   SET current_amount = LEAST(current_amount + $1, target_amount),
                       updated_at = NOW()
                   WHERE id = $2 AND user_id = $3
                   RETURNING title, current_amount, target_amount`,
                [pledge.amount, pledge.goal_id, userId],
            );

            await db.query(
                `UPDATE savings_pledges SET status = 'RESOLVED', resolved_at = NOW() WHERE id = $1`,
                [pledgeId],
            );
            invalidateContext(userId);

            const g = goalRows[0];
            res.status(200).json({
                success: true,
                data: {
                    resolved: true,
                    message: `Tebrikler! ${Number(pledge.amount).toLocaleString('tr-TR')} TL "${g?.title}" hedefine aktarıldı.`,
                    goalCurrentAmount: g?.current_amount,
                    goalTargetAmount: g?.target_amount,
                },
            });
        } else {
            await db.query(
                `UPDATE savings_pledges SET status = 'EXPIRED', resolved_at = NOW() WHERE id = $1`,
                [pledgeId],
            );

            res.status(200).json({
                success: true,
                data: {
                    resolved: false,
                    message: `Bu ay yeterli tasarruf gerçekleşmedi. Taahhüt iptal edildi. (Harcama: ${actualSpent.toLocaleString('tr-TR')} TL, hedef: ${Number(pledge.baseline_spent).toLocaleString('tr-TR')} TL altı)`,
                },
            });
        }
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to resolve pledge',
        });
    }
};

export const cancelPledge = async (req, res) => {
    try {
        const userId = req.user.id;
        const pledgeId = Number(req.params.id);

        if (!pledgeId || isNaN(pledgeId))
            throw ApiError.badRequest('Geçersiz taahhüt ID.');

        const { rowCount } = await db.query(
            `UPDATE savings_pledges SET status = 'CANCELED', resolved_at = NOW()
             WHERE id = $1 AND user_id = $2 AND status = 'PENDING'`,
            [pledgeId, userId],
        );

        if (!rowCount)
            throw ApiError.notFound('Aktif taahhüt bulunamadı.');

        res.status(200).json({ success: true, data: { message: 'Taahhüt iptal edildi.' } });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to cancel pledge',
        });
    }
};
