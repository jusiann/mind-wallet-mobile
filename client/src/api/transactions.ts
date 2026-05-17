import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getAccessToken } from "../store/auth";
import { BASE_URL, apiFetch } from "./client";

export interface Category {
  id: number;
  name: string;
  is_essential: boolean;
  applicable_to: "EXPENSE" | "INCOME";
}

export interface Transaction {
  id: number;
  user_id: number;
  category_id: number | null;
  amount: string;
  type: "EXPENSE" | "INCOME";
  description: string | null;
  transaction_timestamp: string;
  created_at: string;
}

export function fetchTransactions(limit = 100, offset = 0) {
  return apiFetch<{
    success: boolean;
    transactions: Transaction[];
    total: number;
  }>(`/transactions?limit=${limit}&offset=${offset}`);
}

export function fetchCategories() {
  return apiFetch<{ success: boolean; categories: Category[] }>(
    "/transactions/categories",
  );
}

export function createTransaction(body: {
  amount: number;
  type: "EXPENSE" | "INCOME";
  category_id?: number | null;
  description?: string | null;
  transaction_timestamp: string;
}) {
  return apiFetch<{
    success: boolean;
    transaction: Transaction;
    warning: string | null;
  }>("/transactions", { method: "POST", body: JSON.stringify(body) });
}

export function deleteTransaction(id: number) {
  return apiFetch<{ success: boolean }>(`/transactions/${id}`, {
    method: "DELETE",
  });
}

export async function exportTransactionsToFile() {
  const token = await getAccessToken();
  const fileUri = `${FileSystem.documentDirectory}mind-wallet-transactions.xlsx`;

  const res = await FileSystem.downloadAsync(
    `${BASE_URL}/transactions/export`,
    fileUri,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );

  if (res.status !== 200) throw new Error("Dışa aktarma başarısız.");

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error("Paylaşım bu cihazda desteklenmiyor.");

  await Sharing.shareAsync(res.uri, {
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dialogTitle: "Mind Wallet İşlemleri",
    UTI: "com.microsoft.excel.xlsx",
  });
}
