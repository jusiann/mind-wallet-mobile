import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDashboard } from "../../store/dashboard";
import { Goal, createGoal, deleteGoalById, getGoals } from "../../store/goals";
import { COLORS } from "../../constants/theme";
import { pendingMessage } from "../../store/pendingMessage";

function formatCurrency(amount: number) {
  return `₺${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getDefaultDeadline(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  d.setDate(1);
  return d;
}

// ─── Goal Detail Modal ─────────────────────────────────────────────────────────
function GoalDetailModal({
  goal,
  onClose,
  onDelete,
}: {
  goal: Goal;
  onClose: () => void;
  onDelete: () => void;
}) {
  const pct = Math.min(Number(goal.progress_pct), 100);
  const isCompleted = goal.status === "COMPLETED";
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);

  const STATUS_LABELS: Record<Goal["status"], string> = {
    ACTIVE: "Aktif",
    COMPLETED: "Tamamlandı",
    PAUSED: "Durduruldu",
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={detailStyles.overlay}>
        <View style={detailStyles.card}>
          <View style={detailStyles.header}>
            <TouchableOpacity onPress={onClose} style={detailStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={detailStyles.title}>Hedef Detayı</Text>
            <View style={{ width: 36 }} />
          </View>

          <View
            style={[
              detailStyles.iconWrap,
              isCompleted && detailStyles.iconWrapCompleted,
            ]}
          >
            <Ionicons name="flag" size={32} color={COLORS.white} />
          </View>
          <Text style={detailStyles.goalName}>{goal.title}</Text>
          <View
            style={[
              detailStyles.statusBadge,
              isCompleted && detailStyles.statusBadgeCompleted,
            ]}
          >
            <Text
              style={[
                detailStyles.statusText,
                isCompleted && detailStyles.statusTextCompleted,
              ]}
            >
              {STATUS_LABELS[goal.status]}
            </Text>
          </View>

          <View style={detailStyles.progressTrack}>
            <View
              style={[
                detailStyles.progressFill,
                { width: `${pct}%` as any },
                isCompleted && detailStyles.progressFillCompleted,
              ]}
            />
          </View>
          <Text style={detailStyles.pctText}>%{pct.toFixed(0)} tamamlandı</Text>

          <View style={detailStyles.infoRow}>
            <Ionicons
              name="wallet-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={detailStyles.infoText}>
              {formatCurrency(goal.current_amount)} /{" "}
              {formatCurrency(goal.target_amount)}
            </Text>
          </View>
          <View style={detailStyles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={detailStyles.infoText}>
              {new Date(goal.deadline).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
          {!isCompleted && (
            <View style={detailStyles.infoRow}>
              <Ionicons
                name="hourglass-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={detailStyles.infoText}>
                {formatCurrency(remaining)} kaldı
              </Text>
            </View>
          )}

          <TouchableOpacity style={detailStyles.deleteBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text style={detailStyles.deleteText}>Hedefi Sil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Add Goal Modal ────────────────────────────────────────────────────────────
function AddGoalModal({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState(getDefaultDeadline());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function reset() {
    setTitle("");
    setTargetAmount("");
    setDeadline(getDefaultDeadline());
    setFormError("");
  }

  function close() {
    reset();
    onClose();
  }

  async function handleSave() {
    const trimmedTitle = title.trim();
    const amount = parseFloat(targetAmount.replace(",", "."));
    if (!trimmedTitle) {
      setFormError("Hedef adı gerekli.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setFormError("Geçerli bir tutar girin.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const lastDay = new Date(
        deadline.getFullYear(),
        deadline.getMonth() + 1,
        0,
      );
      await createGoal({
        title: trimmedTitle,
        target_amount: amount,
        deadline: lastDay.toISOString(),
      });
      reset();
      onSaved();
    } catch (e: any) {
      setFormError(e.message || "Hedef oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={addStyles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={addStyles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View style={addStyles.header}>
            <TouchableOpacity onPress={close} style={addStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={addStyles.headerTitle}>Yeni Hedef</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            contentContainerStyle={addStyles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <Text style={addStyles.fieldLabel}>Hedef Adı</Text>
            <TextInput
              style={addStyles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Örn: Ev Peşinatı"
              placeholderTextColor={COLORS.placeholderText}
              maxLength={100}
            />

            {/* Amount */}
            <Text style={addStyles.fieldLabel}>Hedef Tutarı</Text>
            <View style={addStyles.amountRow}>
              <Text style={addStyles.amountSymbol}>₺</Text>
              <TextInput
                style={addStyles.amountInput}
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder="0,00"
                placeholderTextColor={COLORS.border}
                keyboardType="decimal-pad"
                maxLength={12}
              />
            </View>

            {/* Deadline */}
            <Text style={addStyles.fieldLabel}>Hedef Tarihi</Text>
            <View style={addStyles.dateRow}>
              <TouchableOpacity
                style={addStyles.dateArrow}
                onPress={() => setDeadline((d) => addMonths(d, -1))}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={COLORS.textPrimary}
                />
              </TouchableOpacity>
              <Text style={addStyles.dateText}>
                {formatMonthYear(deadline)}
              </Text>
              <TouchableOpacity
                style={addStyles.dateArrow}
                onPress={() => setDeadline((d) => addMonths(d, 1))}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {formError ? (
              <Text style={addStyles.formError}>{formError}</Text>
            ) : null}
          </ScrollView>

          <View style={addStyles.saveWrap}>
            <TouchableOpacity
              style={[addStyles.saveBtn, saving && addStyles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={COLORS.white}
                  />
                  <Text style={addStyles.saveBtnText}>Hedefi Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function GoalsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiInsight, setAiInsight] = useState<{
    label: string;
    message: string;
  } | null>(null);
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ marginRight: 16 }}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddOpen(true)}
          >
            <Ionicons name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadGoals(true);
      getDashboard()
        .then((d) => setAiInsight(d.ai_insight))
        .catch(() => {});
    }, []),
  );

  function loadGoals(showLoading = false) {
    if (showLoading) setLoading(true);
    getGoals()
      .then((g) => {
        setGoals(g);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function handleDeleteGoal(goal: Goal) {
    Alert.alert("Hedefi Sil", `"${goal.title}" silinsin mi?`, [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGoalById(goal.id);
            setDetailGoal(null);
            loadGoals();
          } catch (e: any) {
            Alert.alert("Hata", e.message || "Hedef silinemedi.");
          }
        },
      },
    ]);
  }

  function handleAiAction() {
    pendingMessage.set("Harcamalarımı analiz et ve tasarruf önerileri ver");
    router.push("/(tabs)/ai-hub");
  }

  const showInsight = !!aiInsight;

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* INFO */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Hedef Yönetimi</Text>
            <Text style={styles.infoSubtitle}>
              Aktif hedeflerinizi ve AI destekli analizler.
            </Text>
          </View>

          {/* AI CARD — full width */}
          {showInsight ? (
            <View style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={13} color={COLORS.primary} />
                <Text style={styles.aiLabel}>
                  {aiInsight!.label || "Analiz Ajanı"}
                </Text>
              </View>
              <Text style={styles.aiMessage}>{aiInsight!.message}</Text>
              <TouchableOpacity style={styles.aiBtn} onPress={handleAiAction}>
                <Text style={styles.aiBtnText}>Aksiyonu Onayla</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.aiCard, styles.aiCardEmpty]}>
              <Ionicons
                name="sparkles-outline"
                size={22}
                color={COLORS.textSecondary}
              />
              <Text style={styles.aiEmptyText}>AI analizi yükleniyor...</Text>
            </View>
          )}

          {/* EMPTY STATE */}
          {goals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="flag-outline"
                size={40}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyTitle}>Henüz hedef yok</Text>
              <Text style={styles.emptyHint}>
                Yeni hedef ekleyerek veya Mindy ile konuşarak başlayabilirsin.
              </Text>
            </View>
          ) : (
            goals.map((goal) => {
              const pct = Math.min(Number(goal.progress_pct), 100);
              const isCompleted = goal.status === "COMPLETED";

              return (
                <TouchableOpacity
                  key={goal.id}
                  style={styles.goalCard}
                  onPress={() => setDetailGoal(goal)}
                  activeOpacity={0.85}
                >
                  <View style={styles.goalTop}>
                    <View
                      style={[
                        styles.goalIconBox,
                        isCompleted && styles.goalIconBoxCompleted,
                      ]}
                    >
                      <Ionicons name="flag" size={15} color={COLORS.white} />
                    </View>
                    <Text style={styles.goalTitle} numberOfLines={1}>
                      {goal.title}
                    </Text>
                  </View>

                  <Text style={styles.deadlineText}>
                    Son tarih:{" "}
                    {new Date(goal.deadline).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>

                  <View style={styles.amountRow}>
                    <View style={styles.amountLeft}>
                      <Text style={styles.currentAmount}>
                        {formatCurrency(goal.current_amount)}
                      </Text>
                      <Text style={styles.targetAmount}>
                        {" "}
                        / {formatCurrency(goal.target_amount)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.pctText,
                        isCompleted && styles.pctTextCompleted,
                      ]}
                    >
                      %{pct.toFixed(0)}
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${pct}%` as any },
                        isCompleted && styles.progressFillCompleted,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* DETAIL MODAL */}
      {detailGoal && (
        <GoalDetailModal
          goal={detailGoal}
          onClose={() => setDetailGoal(null)}
          onDelete={() => handleDeleteGoal(detailGoal)}
        />
      )}

      {/* ADD MODAL */}
      <AddGoalModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false);
          loadGoals();
        }}
      />
    </SafeAreaView>
  );
}

// ─── Main Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 15,
    color: COLORS.error,
  },

  scroll: { padding: 20, gap: 16, paddingBottom: 40 },

  infoSection: { gap: 4 },
  infoTitle: {
    fontFamily: "HankenGrotesk_700Bold",
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  infoSubtitle: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  emptyCard: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  emptyHint: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  goalTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  goalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  goalIconBoxCompleted: { backgroundColor: "#43A047" },
  goalTitle: {
    flex: 1,
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  menuBtn: { padding: 4 },

  deadlineText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountLeft: { flexDirection: "row", alignItems: "baseline" },
  currentAmount: {
    fontFamily: "HankenGrotesk_700Bold",
    fontSize: 26,
    color: COLORS.textPrimary,
  },
  targetAmount: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  pctText: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 13,
    color: COLORS.primary,
  },
  pctTextCompleted: { color: "#43A047" },

  progressTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },
  progressFillCompleted: { backgroundColor: "#43A047" },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statBadge: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statBadgeCompleted: { backgroundColor: "#E8F5E9" },
  statBadgeText: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 12,
    color: COLORS.primary,
  },
  statBadgeTextCompleted: { color: "#388E3C" },
  remainingText: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  aiCard: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  aiCardEmpty: { alignItems: "center", justifyContent: "center", gap: 8 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  aiLabel: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 12,
    color: COLORS.primary,
  },
  aiMessage: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.85)",
    flex: 1,
  },
  aiEmptyText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  aiBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 9,
  },
  aiBtnText: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 13,
    color: COLORS.white,
  },

  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Detail Modal Styles ───────────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingBottom: 28,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 17,
    color: COLORS.textPrimary,
  },

  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  iconWrapCompleted: { backgroundColor: "#43A047" },

  goalName: {
    fontFamily: "HankenGrotesk_700Bold",
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: "center",
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 6,
    marginBottom: 16,
  },
  statusBadgeCompleted: { backgroundColor: "#E8F5E9" },
  statusText: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 12,
    color: COLORS.primary,
  },
  statusTextCompleted: { color: "#388E3C" },

  progressTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 4,
    overflow: "hidden",
    marginHorizontal: 24,
  },
  progressFill: { height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },
  progressFillCompleted: { backgroundColor: "#43A047" },
  pctText: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 13,
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 8,
  },
  infoText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 28,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.error,
  },
  deleteText: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 15,
    color: COLORS.error,
  },
});

// ─── Add Modal Styles ──────────────────────────────────────────────────────────
const addStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 17,
    color: COLORS.textPrimary,
  },

  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 4 },

  fieldLabel: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  textInput: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  amountSymbol: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 32,
    color: COLORS.textSecondary,
  },
  amountInput: {
    fontFamily: "HankenGrotesk_700Bold",
    fontSize: 48,
    color: COLORS.textPrimary,
    minWidth: 120,
    textAlign: "center",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateArrow: { padding: 2 },
  dateText: {
    flex: 1,
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: "center",
  },

  formError: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 13,
    color: COLORS.error,
    marginTop: 4,
  },

  saveWrap: { paddingHorizontal: 20, paddingVertical: 12 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 16,
    color: COLORS.white,
  },
});
