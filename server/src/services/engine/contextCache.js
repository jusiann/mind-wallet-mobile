import db from '../../lib/db/database.js';

const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 200;

export const getContext = async (userId) => {
    const cached = cache.get(userId);
    if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
        cache.delete(userId);
        cache.set(userId, cached);
        return cached.data;
    }
    if (cached)
        cache.delete(userId);

    const now = new Date();
    // Pledges depend on the calendar month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // AI analysis depends on 30-day rolling windows
    const currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [currentMonthResult, previousMonthResult, goalsResult, categoriesResult, pledgesResult, userResult] =
        await Promise.all([
            db.query(
                `SELECT t.id, t.amount, t.type, t.description, t.transaction_timestamp,
                        t.category_id, c.name AS category_name
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = $1 AND t.transaction_timestamp >= $2
                 ORDER BY t.transaction_timestamp DESC
                 LIMIT 150`,
                [userId, currentPeriodStart],
            ),
            db.query(
                `SELECT t.id, t.amount, t.type, t.description, t.transaction_timestamp,
                        t.category_id, c.name AS category_name
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = $1 AND t.transaction_timestamp >= $2 AND t.transaction_timestamp <= $3
                 ORDER BY t.transaction_timestamp DESC
                 LIMIT 150`,
                [userId, previousPeriodStart, previousPeriodEnd],
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
                'SELECT id, name, is_essential FROM categories ORDER BY id ASC',
            ),
            db.query(
                `SELECT category_id, SUM(amount) as total_pledged
                 FROM savings_pledges
                 WHERE user_id = $1 AND status = 'PENDING' AND baseline_month = $2
                 GROUP BY category_id`,
                [userId, currentMonthStart]
            ),
            db.query(
                `SELECT total_balance, monthly_income FROM users WHERE id = $1`,
                [userId]
            ),
        ]);

    const ctx = {
        currentMonthTx: currentMonthResult.rows,
        previousMonthTx: previousMonthResult.rows,
        activeGoals: goalsResult.rows,
        categories: categoriesResult.rows,
        pledges: pledgesResult.rows,
        user: userResult.rows[0],
    };

    if (cache.size >= MAX_CACHE_SIZE) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) cache.delete(oldestKey);
    }

    cache.set(userId, { data: ctx, ts: Date.now() });
    return ctx;
};

export const invalidateContext = (userId) => {
    cache.delete(userId);
};
