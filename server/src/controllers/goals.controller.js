import ApiError from '../utils/error.js';
import db from '../lib/db/database.js';

const VALID_STATUSES = ['ACTIVE', 'COMPLETED', 'PAUSED'];

const validateTargetAmount = (amount) => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0)
        return 'target_amount must be a positive number.';
    if (!/^\d+(\.\d{1,2})?$/.test(String(parsed)))
        return 'target_amount must have at most 2 decimal places.';
    return null;
};

const validateCurrentAmount = (amount) => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0)
        return 'current_amount must be zero or a positive number.';
    if (!/^\d+(\.\d{1,2})?$/.test(String(parsed)))
        return 'current_amount must have at most 2 decimal places.';
    return null;
};

const validateDeadline = (deadline, requireFuture = true) => {
    const date = new Date(deadline);
    if (isNaN(date.getTime()))
        return 'deadline must be a valid ISO date string.';
    if (requireFuture && date <= new Date())
        return 'deadline must be a future date.';
    return null;
};

const validateStatus = (status) => {
    if (!VALID_STATUSES.includes(status))
        return `status must be one of: ${VALID_STATUSES.join(', ')}.`;
    return null;
};

const GOAL_SELECT = `
    SELECT
        id, user_id, title, target_amount, current_amount, deadline, status, created_at,
        CASE
            WHEN target_amount = 0 THEN 0
            ELSE ROUND((current_amount / target_amount) * 100, 2)
        END AS progress_pct
    FROM goals
`;

export const createGoalRecord = async (userId, { title, target_amount, deadline }) => {
    const { rows } = await db.query(
        `INSERT INTO goals (user_id, title, target_amount, current_amount, deadline)
         VALUES ($1, $2, $3, 0.00, $4)
         RETURNING id, user_id, title, target_amount, current_amount, deadline, status, created_at,
            CASE WHEN target_amount = 0 THEN 0
                 ELSE ROUND((current_amount / target_amount) * 100, 2)
            END AS progress_pct`,
        [userId, title.trim(), parseFloat(target_amount), new Date(deadline)],
    );
    return rows[0];
};

export const createGoal = async (req, res) => {
    try {
        const { title, target_amount, deadline } = req.body;

        if (!title || !target_amount || !deadline)
            throw ApiError.badRequest('title, target_amount, and deadline are required.');

        if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 100)
            throw ApiError.badRequest('title must be between 1 and 100 characters.');

        const amountError = validateTargetAmount(target_amount);
        if (amountError)
            throw ApiError.badRequest(amountError);

        const deadlineError = validateDeadline(deadline);
        if (deadlineError)
            throw ApiError.badRequest(deadlineError);

        const { rows } = await db.query(
            `INSERT INTO goals (user_id, title, target_amount, current_amount, deadline)
             VALUES ($1, $2, $3, 0.00, $4)
             RETURNING id, user_id, title, target_amount, current_amount, deadline, status, created_at,
                CASE WHEN target_amount = 0 THEN 0
                     ELSE ROUND((current_amount / target_amount) * 100, 2)
                END AS progress_pct`,
            [req.user.id, title.trim(), parseFloat(target_amount), new Date(deadline)],
        );

        const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
        console.log(`[GOAL - ${time}] User ${req.user.id} created goal ${rows[0].id}`);

        res.status(201).json({
            success: true,
            message: 'Goal created successfully.',
            goal: rows[0],
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to create goal',
        });
    }
};

export const getGoals = async (req, res) => {
    try {
        const { status } = req.query;
        const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
        const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

        if (status) {
            const statusError = validateStatus(status);
            if (statusError)
                throw ApiError.badRequest(statusError);
        }

        let query = `${GOAL_SELECT} WHERE user_id = $1`;
        const params = [req.user.id];
        let idx = 2;

        if (status) {
            query += ` AND status = $${idx++}`;
            params.push(status);
        }

        query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
        params.push(limit, offset);

        const { rows } = await db.query(query, params);

        res.status(200).json({
            success: true,
            goals: rows,
            total: rows.length,
            limit,
            offset,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to get goals',
        });
    }
};

export const getGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId) || parsedId <= 0)
            throw ApiError.badRequest('Invalid goal ID.');

        const { rows } = await db.query(
            `${GOAL_SELECT} WHERE id = $1 LIMIT 1`,
            [parsedId],
        );
        const goal = rows[0];
        if (!goal)
            throw ApiError.notFound('Goal not found.');

        if (goal.user_id !== req.user.id)
            throw ApiError.forbidden('You do not have permission to access this goal.');

        res.status(200).json({ success: true, goal });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to get goal',
        });
    }
};

export const updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId) || parsedId <= 0)
            throw ApiError.badRequest('Invalid goal ID.');

        const { rows: existing } = await db.query(
            'SELECT id, user_id FROM goals WHERE id = $1 LIMIT 1',
            [parsedId],
        );
        const goal = existing[0];
        if (!goal)
            throw ApiError.notFound('Goal not found.');

        if (goal.user_id !== req.user.id)
            throw ApiError.forbidden('You do not have permission to update this goal.');

        const { title, target_amount, current_amount, deadline, status } = req.body;

        if (title === undefined && target_amount === undefined && current_amount === undefined && deadline === undefined && status === undefined)
            throw ApiError.badRequest('At least one field must be provided for update.');

        const updates = [];
        const params = [];
        let idx = 1;

        if (title !== undefined) {
            if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 100)
                throw ApiError.badRequest('title must be between 1 and 100 characters.');
            
            updates.push(`title = $${idx++}`);
            params.push(title.trim());
        }
        if (target_amount !== undefined) {
            const amountError = validateTargetAmount(target_amount);
            if (amountError)
                throw ApiError.badRequest(amountError);
            
            updates.push(`target_amount = $${idx++}`);
            params.push(parseFloat(target_amount));
        }
        if (current_amount !== undefined) {
            const amountError = validateCurrentAmount(current_amount);
            if (amountError)
                throw ApiError.badRequest(amountError);
            
            updates.push(`current_amount = $${idx++}`);
            params.push(parseFloat(current_amount));
        }
        if (deadline !== undefined) {
            const deadlineError = validateDeadline(deadline, false);
            if (deadlineError)
                throw ApiError.badRequest(deadlineError);
            
            updates.push(`deadline = $${idx++}`);
            params.push(new Date(deadline));
        }
        if (status !== undefined) {
            const statusError = validateStatus(status);
            if (statusError)
                throw ApiError.badRequest(statusError);
            
            updates.push(`status = $${idx++}`);
            params.push(status);
        }

        updates.push(`updated_at = NOW()`);
        params.push(parsedId, req.user.id);

        const { rows } = await db.query(
            `UPDATE goals SET ${updates.join(', ')}
             WHERE id = $${idx++} AND user_id = $${idx}
             RETURNING id, user_id, title, target_amount, current_amount, deadline, status, created_at, updated_at,
                CASE WHEN target_amount = 0 THEN 0
                     ELSE ROUND((current_amount / target_amount) * 100, 2)
                END AS progress_pct`,
            params,
        );

        const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
        console.log(`[GOAL - ${time}] User ${req.user.id} updated goal ${parsedId}`);

        res.status(200).json({
            success: true,
            message: 'Goal updated successfully.',
            goal: rows[0],
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to update goal',
        });
    }
};

export const deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId) || parsedId <= 0)
            throw ApiError.badRequest('Invalid goal ID.');

        const { rows: existing } = await db.query(
            'SELECT id, user_id FROM goals WHERE id = $1 LIMIT 1',
            [parsedId],
        );
        const goal = existing[0];
        if (!goal)
            throw ApiError.notFound('Goal not found.');

        if (goal.user_id !== req.user.id)
            throw ApiError.forbidden('You do not have permission to delete this goal.');

        await db.query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [parsedId, req.user.id]);

        const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
        console.log(`[GOAL - ${time}] User ${req.user.id} deleted goal ${parsedId}`);

        res.status(200).json({
            success: true,
            message: 'Goal deleted successfully.',
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to delete goal',
        });
    }
};
