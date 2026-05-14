import ApiError from '../utils/error.js';
import db from '../lib/db/database.js';

const validateAmount = (amount) => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0)
        return 'Amount must be a positive number.';
    if (!/^\d+(\.\d{1,2})?$/.test(String(parsed)))
        return 'Amount must have at most 2 decimal places.';
    return null;
};

const validateType = (type) => {
    if (!['EXPENSE', 'INCOME'].includes(type))
        return 'Type must be either EXPENSE or INCOME.';
    return null;
};

const validateTimestamp = (ts) => {
    const date = new Date(ts);
    if (isNaN(date.getTime()))
        return 'transaction_timestamp must be a valid ISO date string.';
    return null;
};

export const createTransaction = async (req, res) => {
    try {
        const { amount, type, category_id, description, transaction_timestamp } = req.body;

        if (!amount || !type || !transaction_timestamp)
            throw ApiError.badRequest('amount, type, and transaction_timestamp are required.');

        const amountError = validateAmount(amount);
        if (amountError) 
            throw ApiError.badRequest(amountError);

        const typeError = validateType(type);
        if (typeError) 
            throw ApiError.badRequest(typeError);

        const tsError = validateTimestamp(transaction_timestamp);
        if (tsError) 
            throw ApiError.badRequest(tsError);

        if (description && description.length > 500)
            throw ApiError.badRequest('Description must not exceed 500 characters.');

        if (category_id !== undefined && category_id !== null) {
            const parsedCategoryId = parseInt(category_id, 10);
            if (isNaN(parsedCategoryId) || parsedCategoryId <= 0)
                throw ApiError.badRequest('category_id must be a positive integer.');

            const { rows: catRows } = await db.query(
                'SELECT id FROM categories WHERE id = $1 LIMIT 1',
                [parsedCategoryId],
            );
            if (catRows.length === 0)
                throw ApiError.notFound('Category not found.');
        }

        // TODO: GuardRailNode — intercept here before DB insertion

        const { rows } = await db.query(
            `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_timestamp)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                req.user.id,
                category_id ?? null,
                parseFloat(amount),
                type,
                description ?? null,
                new Date(transaction_timestamp),
            ],
        );

        const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
        console.log(`[TRANSACTION - ${time}] User ${req.user.id} created transaction ${rows[0].id}`);

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully.',
            transaction: rows[0],
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ 
            success: false, 
            error: error.message || 'Failed to create transaction' 
        });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const { type, category_id, start_date, end_date } = req.query;
        let limit = parseInt(req.query.limit, 10) || 20;
        let offset = parseInt(req.query.offset, 10) || 0;

        if (limit > 100) limit = 100;
        if (offset < 0) offset = 0;

        if (type) {
            const typeError = validateType(type);
            if (typeError) 
                throw ApiError.badRequest(typeError);
        }

        const conditions = ['user_id = $1'];
        const params = [req.user.id];
        let idx = 2;

        if (type) {
            conditions.push(`type = $${idx++}`);
            params.push(type);
        }
        if (category_id) {
            const parsedCategoryId = parseInt(category_id, 10);
            if (isNaN(parsedCategoryId) || parsedCategoryId <= 0)
                throw ApiError.badRequest('category_id must be a positive integer.');
            conditions.push(`category_id = $${idx++}`);
            params.push(parsedCategoryId);
        }
        if (start_date) {
            const tsError = validateTimestamp(start_date);
            if (tsError) 
                throw ApiError.badRequest('start_date must be a valid ISO date string.');
            conditions.push(`transaction_timestamp >= $${idx++}`);
            params.push(new Date(start_date));
        }
        if (end_date) {
            const tsError = validateTimestamp(end_date);
            if (tsError) 
                throw ApiError.badRequest('end_date must be a valid ISO date string.');
            
            conditions.push(`transaction_timestamp <= $${idx++}`);
            params.push(new Date(end_date));
        }

        const whereClause = conditions.join(' AND ');

        const { rows: countRows } = await db.query(
            `SELECT COUNT(*) FROM transactions WHERE ${whereClause}`,
            params,
        );

        const { rows } = await db.query(
            `SELECT * FROM transactions WHERE ${whereClause}
             ORDER BY transaction_timestamp DESC
             LIMIT $${idx++} OFFSET $${idx}`,
            [...params, limit, offset],
        );

        res.status(200).json({
            success: true,
            transactions: rows,
            total: parseInt(countRows[0].count, 10),
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ 
            success: false, 
            error: error.message || 'Failed to get transactions' 
        });
    }
};

export const getTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId) || parsedId <= 0)
            throw ApiError.badRequest('Invalid transaction ID.');

        const { rows } = await db.query(
            'SELECT * FROM transactions WHERE id = $1 LIMIT 1',
            [parsedId],
        );
        const transaction = rows[0];
        if (!transaction) 
            throw ApiError.notFound('Transaction not found.');

        if (transaction.user_id !== req.user.id)
            throw ApiError.forbidden('You do not have permission to access this transaction.');

        res.status(200).json({ 
            success: true, 
            transaction 
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ 
            success: false, 
            error: error.message || 'Failed to get transaction' 
        });
    }
};

export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId) || parsedId <= 0)
            throw ApiError.badRequest('Invalid transaction ID.');

        const { rows: existing } = await db.query(
            'SELECT * FROM transactions WHERE id = $1 LIMIT 1',
            [parsedId],
        );
        const transaction = existing[0];
        if (!transaction) 
            throw ApiError.notFound('Transaction not found.');

        if (transaction.user_id !== req.user.id)
            throw ApiError.forbidden('You do not have permission to update this transaction.');

        const { amount, category_id, description, transaction_timestamp } = req.body;

        if (amount === undefined && category_id === undefined && description === undefined && transaction_timestamp === undefined)
            throw ApiError.badRequest('At least one field must be provided for update.');

        const updates = [];
        const params = [];
        let idx = 1;

        if (amount !== undefined) {
            const amountError = validateAmount(amount);
            if (amountError) 
                throw ApiError.badRequest(amountError);
            
            updates.push(`amount = $${idx++}`);
            params.push(parseFloat(amount));
        }
        if (category_id !== undefined) {
            if (category_id === null) {
                updates.push(`category_id = $${idx++}`);
                params.push(null);
            } else {
                const parsedCategoryId = parseInt(category_id, 10);
                if (isNaN(parsedCategoryId) || parsedCategoryId <= 0)
                    throw ApiError.badRequest('category_id must be a positive integer.');
                
                const { rows: catRows } = await db.query(
                    'SELECT id FROM categories WHERE id = $1 LIMIT 1',
                    [parsedCategoryId],
                );
                if (catRows.length === 0)
                    throw ApiError.notFound('Category not found.');
                
                updates.push(`category_id = $${idx++}`);
                params.push(parsedCategoryId);
            }
        }
        if (description !== undefined) {
            if (description !== null && description.length > 500)
                throw ApiError.badRequest('Description must not exceed 500 characters.');
            updates.push(`description = $${idx++}`);
            params.push(description ?? null);
        }
        if (transaction_timestamp !== undefined) {
            const tsError = validateTimestamp(transaction_timestamp);
            if (tsError) 
                throw ApiError.badRequest(tsError);
            
            updates.push(`transaction_timestamp = $${idx++}`);
            params.push(new Date(transaction_timestamp));
        }

        params.push(parsedId, req.user.id);

        const { rows } = await db.query(
            `UPDATE transactions SET ${updates.join(', ')}
             WHERE id = $${idx++} AND user_id = $${idx}
             RETURNING *`,
            params,
        );

        res.status(200).json({
            success: true,
            message: 'Transaction updated successfully.',
            transaction: rows[0],
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ 
            success: false, 
            error: error.message || 'Failed to update transaction' 
        });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId) || parsedId <= 0)
            throw ApiError.badRequest('Invalid transaction ID.');

        const { rows: existing } = await db.query(
            'SELECT id, user_id FROM transactions WHERE id = $1 LIMIT 1',
            [parsedId],
        );
        const transaction = existing[0];
        if (!transaction) 
            throw ApiError.notFound('Transaction not found.');

        if (transaction.user_id !== req.user.id)
            throw ApiError.forbidden('You do not have permission to delete this transaction.');

        await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [parsedId, req.user.id]);

        const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
        console.log(`[TRANSACTION - ${time}] User ${req.user.id} deleted transaction ${parsedId}`);

        res.status(200).json({ 
            success: true, 
            message: 'Transaction deleted successfully.' 
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ 
            success: false, 
            error: error.message || 'Failed to delete transaction' 
        });
    }
};
