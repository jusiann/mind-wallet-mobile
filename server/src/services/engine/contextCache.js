import db from '../../lib/db/database.js';

// Cache structure: Map<userId, { data: object, ts: number }>
const cache = new Map();

// 5 minutes TTL fallback
const CACHE_TTL_MS = 5 * 60 * 1000;

export const getContext = async (userId) => {
    const cached = cache.get(userId);
    if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
        return cached.data;
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [currentMonthResult, previousMonthResult, goalsResult, categoriesResult] =
        await Promise.all([
            db.query(
                `SELECT t.id, t.amount, t.type, t.description, t.transaction_timestamp,
                        t.category_id, c.name AS category_name
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = $1 AND t.transaction_timestamp >= $2
                 ORDER BY t.transaction_timestamp DESC
                 LIMIT 150`,
                [userId, currentMonthStart],
            ),
            db.query(
                `SELECT t.id, t.amount, t.type, t.description, t.transaction_timestamp,
                        t.category_id, c.name AS category_name
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = $1 AND t.transaction_timestamp >= $2 AND t.transaction_timestamp <= $3
                 ORDER BY t.transaction_timestamp DESC
                 LIMIT 150`,
                [userId, previousMonthStart, previousMonthEnd],
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
        ]);

    const ctx = {
        currentMonthTx: currentMonthResult.rows,
        previousMonthTx: previousMonthResult.rows,
        activeGoals: goalsResult.rows,
        categories: categoriesResult.rows,
    };

    cache.set(userId, { data: ctx, ts: Date.now() });
    return ctx;
};

export const invalidateContext = (userId) => {
    cache.delete(userId);
};
