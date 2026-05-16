import { generateJSON } from '../../gemini.service.js';

export const routingNode = async (state) => {
    const { detectedSavings, activeGoals } = state;

    if (!detectedSavings || detectedSavings <= 0 || !activeGoals?.length)
        return { optimizedRoute: null };

    const goalsJson = JSON.stringify(
        activeGoals.map(g => ({
            id: g.id,
            title: g.title,
            target_amount: g.target_amount,
            current_amount: g.current_amount,
            deadline: g.deadline,
            progress_pct: g.progress_pct,
        })),
        null, 2,
    );

    const prompt = `The user can save ${detectedSavings} TRY per month.

                    Active financial goals:
                    ${goalsJson}

                    Which goal should we prioritize routing this saving to?
                    Calculate the new estimated completion date when ${detectedSavings} TRY is added monthly on top of the current_amount for the selected goal.

                    Respond in the following JSON format (write nothing else):
                    {
                    "goal_id": <id of the selected goal>,
                    "goal_title": "<goal title>",
                    "monthly_allocation": <monthly TRY amount to allocate>,
                    "days_saved": <how many days earlier it will be completed>,
                    "new_deadline": "<new estimated completion date, ISO format YYYY-MM-DD>",
                    "message": "<recommendation message in Turkish, 1-2 sentences>"
                    }`;

    const result = await generateJSON(prompt, null);

    if (!result || !result.goal_id)
        return { optimizedRoute: null };

    return {
        optimizedRoute: {
            goalId: result.goal_id,
            goalTitle: result.goal_title,
            amount: result.monthly_allocation,
            daysSaved: result.days_saved,
            newDeadline: result.new_deadline,
            message: result.message,
        },
    };
};
