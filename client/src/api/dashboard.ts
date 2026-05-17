import { apiFetch } from "./client";

export interface DashboardGoal {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  progress_pct: number;
}

export interface DashboardTransaction {
  id: number;
  description: string;
  amount: number;
  type: "EXPENSE" | "INCOME";
  category_name: string;
  transaction_timestamp: string;
}

export interface DashboardData {
  total_balance: number;
  monthly_income: number;
  active_goals: DashboardGoal[];
  recent_transactions: DashboardTransaction[];
  monthly_stats: {
    expense_vs_last_month_pct: number | null;
  };
  ai_insight: {
    label: string;
    message: string;
  };
}

export function getDashboard() {
  return apiFetch<{ success: boolean; data: DashboardData }>("/dashboard").then(
    (res) => res.data,
  );
}

export interface Goal {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  created_at: string;
  progress_pct: number;
}

export function getGoals(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<{ success: boolean; goals: Goal[]; total: number }>(
    `/goals${query}`,
  ).then((res) => res.goals);
}

export function createGoal(body: {
  title: string;
  target_amount: number;
  deadline: string;
}) {
  return apiFetch<{ success: boolean; goal: Goal }>("/goals", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((res) => res.goal);
}

export function deleteGoalById(id: number) {
  return apiFetch<{ success: boolean }>(`/goals/${id}`, { method: "DELETE" });
}
