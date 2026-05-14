import ApiError from '../utils/error.js';
import db from '../lib/db/database.js';
import { engineGraph } from '../services/engine/graph.js';

export const analyze = async (req, res) => {
    try {
        const { input } = req.body;

        if (!input || typeof input !== 'string' || input.trim().length === 0)
            throw ApiError.badRequest('input is required.');

        if (input.trim().length > 500)
            throw ApiError.badRequest('input must not exceed 500 characters.');

        const userId = req.user.id;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [transactionsResult, goalsResult] = await Promise.all([
            db.query(
                `SELECT t.id, t.amount, t.type, t.description, t.transaction_timestamp,
                        c.name AS category_name
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = $1 AND t.transaction_timestamp >= $2
                 ORDER BY t.transaction_timestamp DESC`,
                [userId, thirtyDaysAgo],
            ),
            db.query(
                `SELECT id, title, target_amount, current_amount, deadline,
                        CASE WHEN target_amount = 0 THEN 0
                             ELSE ROUND((current_amount / target_amount) * 100, 2)
                        END AS progress_pct
                 FROM goals WHERE user_id = $1 AND status = 'ACTIVE'`,
                [userId],
            ),
        ]);

        const finalState = await engineGraph.invoke({
            userId,
            currentInput: input.trim(),
            pastTransactions: transactionsResult.rows,
            activeGoals: goalsResult.rows,
        });

        const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
        console.log(`[ENGINE - ${time}] User ${userId} analyzed — classification: ${finalState.classification}, savings: ${finalState.detectedSavings}`);

        res.status(200).json({
            success: true,
            data: {
                classification: finalState.classification,
                label: finalState.label,
                message: finalState.message,
                detected_savings: finalState.detectedSavings,
                wasteful_categories: finalState.wastefulCategories,
                optimized_route: finalState.optimizedRoute,
                warning: finalState.warning,
            },
        });
    } catch (error) {
        const isGeminiError = error.message?.includes('GoogleGenerativeAI') || error.message?.includes('generativelanguage');
        const statusCode = error.statusCode || (isGeminiError ? 502 : 500);
        const message = isGeminiError 
            ? 'AI service unavailable. Please try again later.' 
            : (error.message || 'Engine analysis failed.');
        
        res.status(statusCode).json({ 
            success: false, 
            error: message 
        });
    }
};
