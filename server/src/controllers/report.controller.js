import db from '../lib/db/database.js';

export const getMonthlyReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const monthParam = req.query.month; // Expected format: 'YYYY-MM'
        
        if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
            return res.status(400).json({ success: false, error: 'Invalid month format. Expected YYYY-MM.' });
        }

        const targetDate = new Date(`${monthParam}-01T00:00:00Z`);
        const currentMonthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString();
        const nextMonthStart = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1).toISOString();
        const prevMonthStart = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1).toISOString();

        const [totalsResult, lastMonthTotalsResult, categoriesResult, daysResult, maxExpenseResult] = await Promise.all([
            // 1. Current month totals
            db.query(
                `SELECT 
                    COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS total_income,
                    COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS total_expense
                 FROM transactions 
                 WHERE user_id = $1 
                   AND transaction_timestamp >= $2 
                   AND transaction_timestamp < $3`,
                [userId, currentMonthStart, nextMonthStart]
            ),
            // 2. Last month totals
            db.query(
                `SELECT 
                    COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS total_income,
                    COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS total_expense
                 FROM transactions 
                 WHERE user_id = $1 
                   AND transaction_timestamp >= $2 
                   AND transaction_timestamp < $3`,
                [userId, prevMonthStart, currentMonthStart]
            ),
            // 3. Category breakdown for expenses
            db.query(
                `SELECT 
                    COALESCE(c.name, 'Other') AS category_name,
                    SUM(t.amount) AS amount
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = $1 
                   AND t.type = 'EXPENSE'
                   AND t.transaction_timestamp >= $2 
                   AND t.transaction_timestamp < $3
                 GROUP BY COALESCE(c.name, 'Other')
                 ORDER BY amount DESC`,
                [userId, currentMonthStart, nextMonthStart]
            ),
            // 4. Top spending days
            db.query(
                `SELECT 
                    DATE(transaction_timestamp) AS date,
                    SUM(amount) AS amount
                 FROM transactions
                 WHERE user_id = $1
                   AND type = 'EXPENSE'
                   AND transaction_timestamp >= $2 
                   AND transaction_timestamp < $3
                 GROUP BY DATE(transaction_timestamp)
                 ORDER BY amount DESC
                 LIMIT 5`,
                [userId, currentMonthStart, nextMonthStart]
            ),
            // 5. Biggest single expense
            db.query(
                `SELECT 
                    COALESCE(MAX(amount), 0) AS max_amount
                 FROM transactions
                 WHERE user_id = $1
                   AND type = 'EXPENSE'
                   AND transaction_timestamp >= $2 
                   AND transaction_timestamp < $3`,
                [userId, currentMonthStart, nextMonthStart]
            )
        ]);

        const currTotals = totalsResult.rows[0];
        const prevTotals = lastMonthTotalsResult.rows[0];
        
        const total_income = parseFloat(currTotals.total_income);
        const total_expense = parseFloat(currTotals.total_expense);
        const prev_income = parseFloat(prevTotals.total_income);
        const prev_expense = parseFloat(prevTotals.total_expense);
        
        const net_income = total_income - total_expense;
        const savings_rate = total_income > 0 ? (net_income / total_income) * 100 : 0;

        const income_change_pct = prev_income > 0 ? ((total_income - prev_income) / prev_income) * 100 : (total_income > 0 ? 100 : 0);
        const expense_change_pct = prev_expense > 0 ? ((total_expense - prev_expense) / prev_expense) * 100 : (total_expense > 0 ? 100 : 0);

        let days_passed = 1;
        const now = new Date();
        if (targetDate.getFullYear() === now.getFullYear() && targetDate.getMonth() === now.getMonth()) {
            days_passed = Math.max(1, now.getDate());
        } else if (targetDate < now) {
            days_passed = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
        }
        const daily_avg_spend = total_expense / days_passed;
        const biggest_expense = parseFloat(maxExpenseResult.rows[0].max_amount);

        const category_breakdown = categoriesResult.rows.map(row => {
            const amount = parseFloat(row.amount);
            const percentage = total_expense > 0 ? (amount / total_expense) * 100 : 0;
            return {
                category_name: row.category_name,
                amount: amount,
                percentage: percentage
            };
        });

        const top_days = daysResult.rows.map(row => ({
            date: row.date,
            amount: parseFloat(row.amount)
        }));

        res.status(200).json({
            success: true,
            data: {
                total_income,
                total_expense,
                net_income,
                savings_rate,
                comparison: {
                    income_change_pct,
                    expense_change_pct
                },
                daily_avg_spend,
                biggest_expense,
                category_breakdown,
                top_days
            }
        });
    } catch (error) {
        console.error('[report.controller] error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate monthly report.' });
    }
};
