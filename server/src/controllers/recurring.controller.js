import db from '../lib/db/database.js';

export const getRecurringTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            `SELECT 
                r.*, 
                c.name AS category_name
             FROM recurring_transactions r
             LEFT JOIN categories c ON r.category_id = c.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: result.rows.map(row => ({
                ...row,
                amount: parseFloat(row.amount)
            }))
        });
    } catch (error) {
        console.error('[recurring.controller] getRecurringTransactions error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch recurring transactions.' });
    }
};

export const createRecurringTransaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, type, category_id, description, interval, start_date } = req.body;

        if (!amount || !type || !interval || !start_date) {
            return res.status(400).json({ success: false, error: 'Missing required fields.' });
        }

        const [year, month, day] = start_date.split('-').map(Number);
        let nextRun = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        while (nextRun <= today) {
            if (interval === 'DAILY') {
                nextRun.setDate(nextRun.getDate() + 1);
            } else if (interval === 'WEEKLY') {
                nextRun.setDate(nextRun.getDate() + 7);
            } else if (interval === 'MONTHLY') {
                nextRun.setMonth(nextRun.getMonth() + 1);
            } else if (interval === 'YEARLY') {
                nextRun.setFullYear(nextRun.getFullYear() + 1);
            }
        }
        
        const next_run_date = `${nextRun.getFullYear()}-${String(nextRun.getMonth() + 1).padStart(2, '0')}-${String(nextRun.getDate()).padStart(2, '0')}`;

        const result = await db.query(
            `INSERT INTO recurring_transactions 
             (user_id, amount, type, category_id, description, interval, start_date, next_run_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [userId, amount, type, category_id || null, description, interval, start_date, next_run_date]
        );

        res.status(201).json({
            success: true,
            data: {
                ...result.rows[0],
                amount: parseFloat(result.rows[0].amount)
            }
        });
    } catch (error) {
        console.error('[recurring.controller] createRecurringTransaction error:', error);
        res.status(500).json({ success: false, error: 'Failed to create recurring transaction.' });
    }
};

export const toggleRecurringTransaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { is_active } = req.body;

        if (is_active === undefined) {
            return res.status(400).json({ success: false, error: 'Missing is_active field.' });
        }

        const result = await db.query(
            `UPDATE recurring_transactions
             SET is_active = $1
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [is_active, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Recurring transaction not found.' });
        }

        res.status(200).json({
            success: true,
            data: {
                ...result.rows[0],
                amount: parseFloat(result.rows[0].amount)
            }
        });
    } catch (error) {
        console.error('[recurring.controller] toggleRecurringTransaction error:', error);
        res.status(500).json({ success: false, error: 'Failed to update recurring transaction.' });
    }
};

export const deleteRecurringTransaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await db.query(
            `DELETE FROM recurring_transactions
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Recurring transaction not found.' });
        }

        res.status(200).json({ success: true, message: 'Recurring transaction deleted.' });
    } catch (error) {
        console.error('[recurring.controller] deleteRecurringTransaction error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete recurring transaction.' });
    }
};
