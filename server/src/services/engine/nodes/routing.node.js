export const routingNode = (state) => {
  const { detectedSavings, activeGoals } = state;

  if (!detectedSavings || detectedSavings <= 0 || !activeGoals?.length)
    return { optimizedRoute: null };

  const sorted = [...activeGoals].sort(
    (a, b) => Number(b.progress_pct) - Number(a.progress_pct),
  );
  const target = sorted[0];

  return {
    optimizedRoute: {
      goalId: target.id,
      goalTitle: target.title,
      amount: detectedSavings,
    },
  };
};
