// ═══════════════════════════════════════════════════════════════
//  Routing Node — LangGraph Node Function (Deterministic)
//  Calculates optimal goal routing from detected savings
// ═══════════════════════════════════════════════════════════════

export const routingNode = async (state) => {
    const { analysisResult, context } = state;
    const { activeGoals = [] } = context;

    if (!analysisResult || !analysisResult.hasData || analysisResult.detectedSavings <= 0) {
        return {}; // Nothing to route
    }

    if (activeGoals.length === 0) {
        return {}; // No goals to route to
    }

    // Find the highest-priority goal (closest to deadline with most remaining)
    const sortedGoals = [...activeGoals]
        .filter((g) => {
            const remaining = Number(g.target_amount) - Number(g.current_amount);
            return remaining > 0;
        })
        .sort((a, b) => {
            // Priority: closest deadline first
            const deadlineA = new Date(a.deadline).getTime();
            const deadlineB = new Date(b.deadline).getTime();
            return deadlineA - deadlineB;
        });

    if (sortedGoals.length === 0) return {};

    const topGoal = sortedGoals[0];
    const remaining = Number(topGoal.target_amount) - Number(topGoal.current_amount);
    const monthlyAllocation = Math.min(analysisResult.detectedSavings, remaining);

    // Calculate how many days this saves
    const now = new Date();
    const deadline = new Date(topGoal.deadline);
    const totalDays = Math.max(1, Math.round((deadline - now) / (1000 * 60 * 60 * 24)));
    const dailyRate = remaining / totalDays;
    const daysSaved = dailyRate > 0 ? Math.round(monthlyAllocation / dailyRate) : 0;

    const newDeadline = new Date(deadline);
    newDeadline.setDate(newDeadline.getDate() - daysSaved);

    return {
        analysisResult: {
            ...analysisResult,
            optimizedRoute: {
                goalId: topGoal.id,
                goalTitle: topGoal.title,
                monthlyAllocation,
                daysSaved,
                newDeadline: newDeadline.toISOString().split('T')[0],
            },
        },
    };
};
