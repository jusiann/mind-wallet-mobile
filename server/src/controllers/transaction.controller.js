import ApiError from '../utils/error.js';
import db from '../lib/db/database.js';
import { runGuardRail } from '../services/engine/graph.js';
import ExcelJS from 'exceljs';

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

export const getCategories = async (_req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT id, name, is_essential, applicable_to FROM categories ORDER BY id ASC',
        );
        res.status(200).json({
            success: true,
            categories: rows,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get categories',
        });
    }
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

        let categoryMeta = null;
        if (category_id !== undefined && category_id !== null) {
            const { rows: catRows } = await db.query(
                'SELECT id, name, is_essential FROM categories WHERE id = $1 LIMIT 1',
                [category_id],
            );
            categoryMeta = catRows[0] ?? null;
            if (!categoryMeta)
                throw ApiError.notFound('Category not found.');
        }

        let guardWarning = null;
        if (type === 'EXPENSE') {
            try {
                const { rows: goalRows } = await db.query(
                    `SELECT id, title, target_amount, current_amount, deadline,
                            CASE WHEN target_amount = 0 THEN 0
                                 ELSE ROUND((current_amount / target_amount) * 100, 2)
                            END AS progress_pct
                     FROM goals WHERE user_id = $1 AND status = 'ACTIVE'`,
                    [req.user.id],
                );
                guardWarning = await runGuardRail(goalRows, {
                    amount: parseFloat(amount),
                    type,
                    category_name: categoryMeta?.name ?? null,
                    is_essential: categoryMeta?.is_essential ?? null,
                    description: description ?? null,
                });
            } catch {
                guardWarning = null;
            }
        }

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
            warning: guardWarning,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to create transaction',
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
            const { rows: catCheck } = await db.query(
                'SELECT id FROM categories WHERE id = $1 LIMIT 1',
                [category_id],
            );
            if (!catCheck[0])
                throw ApiError.badRequest('Invalid category_id.');
            conditions.push(`category_id = $${idx++}`);
            params.push(category_id);
        }
        if (start_date) {
            if (validateTimestamp(start_date))
                throw ApiError.badRequest('start_date must be a valid ISO date string.');
            conditions.push(`transaction_timestamp >= $${idx++}`);
            params.push(new Date(start_date));
        }
        if (end_date) {
            if (validateTimestamp(end_date))
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
            `SELECT id, amount, type, description, transaction_timestamp, category_id
             FROM transactions WHERE ${whereClause}
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
            error: error.message || 'Failed to get transactions',
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
            'SELECT id, amount, type, description, transaction_timestamp, category_id, user_id FROM transactions WHERE id = $1 LIMIT 1',
            [parsedId],
        );
        const transaction = rows[0];
        if (!transaction)
            throw ApiError.notFound('Transaction not found.');

        if (transaction.user_id !== req.user.id)
            throw ApiError.forbidden('You do not have permission to access this transaction.');

        res.status(200).json({ success: true, transaction });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to get transaction',
        });
    }
};

export const exportTransactions = async (req, res) => {
    try {
        const userId = req.user.id;

        const { rows } = await db.query(
            `SELECT
                t.id,
                t.amount,
                t.type,
                t.description,
                t.transaction_timestamp,
                c.name AS category_name
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = $1
             ORDER BY t.transaction_timestamp DESC
             LIMIT 10000`,
            [userId],
        );

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Mind Wallet';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Transactions');
        sheet.columns = [
            { header: 'ID', key: 'id', width: 8 },
            { header: 'Date', key: 'date', width: 22 },
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Amount', key: 'amount', width: 14 },
            { header: 'Category', key: 'category', width: 22 },
            { header: 'Description', key: 'description', width: 36 },
        ];

        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF7C3AED' },
        };

        for (const tx of rows) {
            sheet.addRow({
                id: tx.id,
                date: new Date(tx.transaction_timestamp).toISOString().replace('T', ' ').slice(0, 19),
                type: tx.type,
                amount: parseFloat(tx.amount),
                category: tx.category_name ?? '',
                description: tx.description ?? '',
            });
        }

        sheet.getColumn('amount').numFmt = '#,##0.00';

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="mind-wallet-${userId}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ success: false, error: 'Export failed' });
    }
};

export const updateTransaction = async (req, res) => {
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
                const { rows: catRows } = await db.query(
                    'SELECT id FROM categories WHERE id = $1 LIMIT 1',
                    [category_id],
                );
                if (!catRows[0])
                    throw ApiError.notFound('Category not found.');
                updates.push(`category_id = $${idx++}`);
                params.push(category_id);
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
            error: error.message || 'Failed to update transaction',
        });
    }
};

export const createTransactionRecord = async (userId, { amount, transactionType, category, description, timestamp }) => {
    let categoryId = null;
    if (category) {
        const { rows: catRows } = await db.query(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1',
            [category],
        );
        categoryId = catRows[0]?.id ?? null;
    }

    const { rows } = await db.query(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
            userId,
            categoryId,
            parseFloat(amount),
            transactionType,
            description ?? null,
            new Date(timestamp),
        ],
    );

    return rows[0];
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
            message: 'Transaction deleted successfully.',
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to delete transaction',
        });
    }
};
