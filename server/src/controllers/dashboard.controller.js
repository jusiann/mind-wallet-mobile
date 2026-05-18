import db from '../lib/db/database.js';

const deriveInsight = (pct) => {
    if (pct === null)
        return { label: 'Normal', message: 'Geçen ay için henüz veri yok.' };
    if (pct <= -10)
        return { label: 'Yavaş', message: `Geçen aya göre %${Math.abs(pct)} daha az harcıyorsunuz.` };
    if (pct >= 10)
        return { label: 'Hızlı', message: `Geçen aya göre %${pct} daha fazla harcıyorsunuz.` };
    return { label: 'Normal', message: 'Harcama hızınız geçen ayla benzer.' };
};

export const getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const [balanceResult, goalsResult, transactionsResult, statsResult] = await Promise.all([
            db.query(
                `SELECT COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0) AS total_balance
                 FROM transactions WHERE user_id = $1`,
                [userId],
            ),
            db.query(
                `SELECT
                    id, title, target_amount, current_amount, deadline, status,
                    CASE
                        WHEN target_amount = 0 THEN 0
                        ELSE ROUND((current_amount / target_amount) * 100, 2)
                    END AS progress_pct
                 FROM goals
                 WHERE user_id = $1 AND status = 'ACTIVE'
                 ORDER BY deadline ASC
                 LIMIT 10`,
                [userId],
            ),
            db.query(
                `SELECT
                    t.id, t.amount, t.type, t.description,
                    t.transaction_timestamp, c.name AS category_name
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = $1
                 ORDER BY t.transaction_timestamp DESC
                 LIMIT 5`,
                [userId],
            ),
            db.query(
                `WITH current_month AS (
                    SELECT
                        COALESCE(SUM(CASE WHEN type = 'INCOME'  THEN amount ELSE 0 END), 0) AS total_income,
                        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS total_expense
                    FROM transactions
                    WHERE user_id = $1
                      AND transaction_timestamp >= DATE_TRUNC('month', NOW())
                      AND transaction_timestamp <  DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
                 ),
                 last_month AS (
                    SELECT
                        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS total_expense
                    FROM transactions
                    WHERE user_id = $1
                      AND transaction_timestamp >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
                      AND transaction_timestamp <  DATE_TRUNC('month', NOW())
                 )
                 SELECT
                    cm.total_income,
                    cm.total_expense,
                    (cm.total_income - cm.total_expense) AS net,
                    CASE
                        WHEN lm.total_expense = 0 THEN NULL
                        ELSE ROUND(((cm.total_expense - lm.total_expense) / lm.total_expense) * 100, 2)
                    END AS expense_vs_last_month_pct
                 FROM current_month cm, last_month lm`,
                [userId],
            ),
        ]);

        const stats = statsResult.rows[0];
        const pct = stats.expense_vs_last_month_pct !== null
            ? parseFloat(stats.expense_vs_last_month_pct)
            : null;

        const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
        console.log(`[DASHBOARD - ${time}] User ${userId} fetched dashboard`);

        res.status(200).json({
            success: true,
            data: {
                total_balance: parseFloat(balanceResult.rows[0].total_balance),
                monthly_income: parseFloat(stats.total_income),
                active_goals: goalsResult.rows.map(g => ({
                    ...g,
                    target_amount: parseFloat(g.target_amount),
                    current_amount: parseFloat(g.current_amount),
                    progress_pct: parseFloat(g.progress_pct),
                })),
                recent_transactions: transactionsResult.rows.map(t => ({
                    ...t,
                    amount: parseFloat(t.amount),
                })),
                monthly_stats: {
                    total_income: parseFloat(stats.total_income),
                    total_expense: parseFloat(stats.total_expense),
                    net: parseFloat(stats.net),
                    expense_vs_last_month_pct: pct,
                },
                ai_insight: deriveInsight(pct),
            },
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to load dashboard',
        });
    }
};
