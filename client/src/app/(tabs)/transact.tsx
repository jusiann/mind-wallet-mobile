import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Category,
  Transaction,
  createTransaction,
  deleteTransaction,
  exportTransactionsToFile,
  fetchCategories,
  fetchTransactions,
} from "../../api/transactions";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";

// ─── Category metadata ─────────────────────────────────────────────────────────
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const CAT_META: Record<string, { tr: string; icon: IoniconName }> = {
  // Expense
  "Food & Groceries": { tr: "Market", icon: "basket-outline" },
  "Eating Out": { tr: "Yemek", icon: "restaurant-outline" },
  Transportation: { tr: "Ulaşım", icon: "car-outline" },
  "Rent & Bills": { tr: "Kira", icon: "home-outline" },
  Entertainment: { tr: "Eğlence", icon: "film-outline" },
  Health: { tr: "Sağlık", icon: "medkit-outline" },
  Clothing: { tr: "Giyim", icon: "shirt-outline" },
  Education: { tr: "Eğitim", icon: "school-outline" },
  Subscriptions: { tr: "Abonelik", icon: "repeat-outline" },
  Other: { tr: "Diğer", icon: "ellipsis-horizontal-outline" },
  // Income
  Salary: { tr: "Maaş", icon: "briefcase-outline" },
  Freelance: { tr: "Serbest", icon: "laptop-outline" },
  Investment: { tr: "Yatırım", icon: "trending-up-outline" },
  Gift: { tr: "Hediye", icon: "gift-outline" },
  "Rental Income": { tr: "Kira Gel.", icon: "business-outline" },
  Cash: { tr: "Nakit", icon: "cash-outline" },
};

function catName(name: string) {
  return CAT_META[name]?.tr ?? name;
}
function catIcon(name: string): IoniconName {
  return CAT_META[name]?.icon ?? "wallet-outline";
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatCurrency(amount: string | number) {
  return `₺${parseFloat(String(amount)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
}

function formatSectionDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

type Enriched = Transaction & { catMeta: { tr: string; icon: IoniconName } };
type Section = { title: string; data: Enriched[] };

function buildSections(
  transactions: Transaction[],
  cats: Category[],
): Section[] {
  const catMap = new Map(cats.map((c) => [c.id, c]));
  const enriched: Enriched[] = transactions.map((tx) => {
    const cat = tx.category_id != null ? catMap.get(tx.category_id) : undefined;
    return {
      ...tx,
      catMeta: cat
        ? (CAT_META[cat.name] ?? {
            tr: cat.name,
            icon: "wallet-outline" as IoniconName,
          })
        : { tr: "Diğer", icon: "wallet-outline" as IoniconName },
    };
  });

  const groups = new Map<string, Enriched[]>();
  for (const tx of enriched) {
    const key = formatSectionDate(tx.transaction_timestamp);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }
  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function TransactScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [detailTx, setDetailTx] = useState<Enriched | null>(null);
  const [exporting, setExporting] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons
                name="document-text-outline"
                size={22}
                color={COLORS.textPrimary}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddOpen(true)}
          >
            <Ionicons name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [exporting]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, catRes] = await Promise.all([
        fetchTransactions(),
        fetchCategories(),
      ]);
      setCategories(catRes.categories);
      setSections(buildSections(txRes.transactions, catRes.categories));
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "İşlemler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportTransactionsToFile();
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Dışa aktarılamadı.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(id: number) {
    Alert.alert("İşlemi Sil", "Bu işlemi silmek istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTransaction(id);
            setDetailTx(null);
            load();
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "Silinemedi.");
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {/* LIST */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>Henüz işlem yok.</Text>
          <Text style={styles.emptySubText}>
            + butonuna basarak işlem ekleyebilirsin.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.txRow}
              onPress={() => setDetailTx(item)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.txIcon,
                  item.type === "INCOME" && styles.txIconIncome,
                ]}
              >
                <Ionicons
                  name={item.catMeta.icon}
                  size={18}
                  color={item.type === "INCOME" ? "#2E7D32" : COLORS.primary}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc} numberOfLines={1}>
                  {item.description ?? item.catMeta.tr}
                </Text>
                <Text style={styles.txMeta}>
                  {item.catMeta.tr} · {formatTime(item.transaction_timestamp)}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  item.type === "INCOME"
                    ? styles.amountIncome
                    : styles.amountExpense,
                ]}
              >
                {item.type === "INCOME" ? "+" : "-"}
                {formatCurrency(item.amount)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ADD MODAL */}
      <AddModal
        visible={addOpen}
        categories={categories}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false);
          load();
        }}
      />

      {/* DETAIL MODAL */}
      {detailTx && (
        <DetailModal
          tx={detailTx}
          onClose={() => setDetailTx(null)}
          onDelete={() => handleDelete(detailTx.id)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Add Transaction Modal ─────────────────────────────────────────────────────
function AddModal({
  visible,
  categories,
  onClose,
  onSaved,
}: {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [txDate, setTxDate] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const numCols = 4;
  const chipWidth = (screenWidth - 40 - (numCols - 1) * 8) / numCols;

  function resetForm() {
    setType("EXPENSE");
    setAmount("");
    setSelectedCatId(null);
    setDescription("");
    setTxDate(new Date());
  }

  function close() {
    resetForm();
    onClose();
  }

  function shiftDay(delta: number) {
    const d = new Date(txDate);
    d.setDate(d.getDate() + delta);
    if (d <= new Date()) setTxDate(d);
  }

  async function save() {
    const parsed = parseFloat(amount.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Hata", "Geçerli bir tutar gir.");
      return;
    }
    setSaving(true);
    try {
      const ts = new Date(txDate);
      ts.setHours(new Date().getHours(), new Date().getMinutes(), 0, 0);
      const res = await createTransaction({
        amount: parsed,
        type,
        category_id: selectedCatId,
        description: description.trim() || null,
        transaction_timestamp: ts.toISOString(),
      });
      if (res.warning) Alert.alert("Uyarı", res.warning);
      resetForm();
      onSaved();
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  const isToday = txDate.toDateString() === new Date().toDateString();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={close} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Yeni İşlem</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Type Toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === "EXPENSE" && styles.typeBtnActiveExpense,
                ]}
                onPress={() => {
                  setType("EXPENSE");
                  setSelectedCatId(null);
                }}
              >
                <View
                  style={[
                    styles.typeDot,
                    {
                      backgroundColor:
                        type === "EXPENSE" ? "#E53935" : COLORS.border,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    type === "EXPENSE" && styles.typeBtnTextActive,
                  ]}
                >
                  Gider
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === "INCOME" && styles.typeBtnActiveIncome,
                ]}
                onPress={() => {
                  setType("INCOME");
                  setSelectedCatId(null);
                }}
              >
                <View
                  style={[
                    styles.typeDot,
                    {
                      backgroundColor:
                        type === "INCOME" ? "#2E7D32" : COLORS.border,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    type === "INCOME" && styles.typeBtnTextActiveIncome,
                  ]}
                >
                  Gelir
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.amountRow}>
              <Text style={styles.amountSymbol}>₺</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0,00"
                placeholderTextColor={COLORS.border}
                keyboardType="decimal-pad"
                maxLength={12}
              />
            </View>

            {/* Category */}
            <Text style={styles.fieldLabel}>Kategori</Text>
            <View style={styles.catGrid}>
              {categories
                .filter((c) => c.applicable_to === type)
                .map((cat) => {
                  const meta = CAT_META[cat.name] ?? {
                    tr: cat.name,
                    icon: "wallet-outline" as IoniconName,
                  };
                  const selected = selectedCatId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChip,
                        selected && styles.catChipSelected,
                        { width: chipWidth },
                      ]}
                      onPress={() => setSelectedCatId(selected ? null : cat.id)}
                    >
                      <Ionicons
                        name={meta.icon}
                        size={20}
                        color={selected ? COLORS.white : COLORS.primary}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          selected && styles.catChipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {meta.tr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>

            {/* Description */}
            <Text style={styles.fieldLabel}>Açıklama</Text>
            <View style={styles.descRow}>
              <TextInput
                style={styles.descInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Açıklama ekle..."
                placeholderTextColor={COLORS.placeholderText}
                maxLength={200}
              />
              <Ionicons
                name="pencil-outline"
                size={16}
                color={COLORS.textSecondary}
              />
            </View>

            {/* Date */}
            <Text style={styles.fieldLabel}>Tarih</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                onPress={() => shiftDay(-1)}
                style={styles.dateArrow}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={COLORS.textPrimary}
                />
              </TouchableOpacity>
              <Text style={styles.dateText}>
                {isToday
                  ? "Bugün"
                  : txDate.toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                    })}
              </Text>
              <TouchableOpacity
                onPress={() => shiftDay(1)}
                style={styles.dateArrow}
                disabled={isToday}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isToday ? COLORS.border : COLORS.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.saveWrap}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={save}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={COLORS.white}
                  />
                  <Text style={styles.saveBtnText}>İşlemi Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({
  tx,
  onClose,
  onDelete,
}: {
  tx: Enriched;
  onClose: () => void;
  onDelete: () => void;
}) {
  const isIncome = tx.type === "INCOME";
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.detailOverlay}>
        <View style={styles.detailCard}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>İşlem Detayı</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Icon */}
          <View
            style={[
              styles.detailIconWrap,
              isIncome ? styles.detailIconIncome : styles.detailIconExpense,
            ]}
          >
            <Ionicons name={tx.catMeta.icon} size={32} color={COLORS.white} />
          </View>

          {/* Amount */}
          <Text
            style={[
              styles.detailAmount,
              isIncome ? styles.amountIncome : styles.amountExpense,
            ]}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(tx.amount)}
          </Text>
          <Text style={styles.detailType}>
            {isIncome ? "Gelir" : "Gider"} · {tx.catMeta.tr}
          </Text>

          {/* Info rows */}
          {tx.description ? (
            <View style={styles.detailRow}>
              <Ionicons
                name="chatbox-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.detailRowText}>{tx.description}</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.detailRowText}>
              {new Date(tx.transaction_timestamp).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {"  "}
              {formatTime(tx.transaction_timestamp)}
            </Text>
          </View>

          {/* Delete */}
          <TouchableOpacity style={styles.detailDeleteBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text style={styles.detailDeleteText}>İşlemi Sil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptySubText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 14,
    color: COLORS.placeholderText,
  },

  // Header
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  sectionHeader: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  txIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  txIconIncome: {},
  txInfo: { flex: 1 },
  txDesc: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  txMeta: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  txAmount: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 15,
  },
  amountExpense: { color: "#E53935" },
  amountIncome: { color: "#2E7D32" },

  // Modal shared
  modalSafe: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  modalContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 4 },

  // Add form
  typeToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    padding: 4,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  typeBtnActiveExpense: { backgroundColor: COLORS.white },
  typeBtnActiveIncome: { backgroundColor: COLORS.white },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeBtnText: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  typeBtnTextActive: { color: "#E53935" },
  typeBtnTextActiveIncome: { color: "#2E7D32" },

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

  fieldLabel: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  catChip: {
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 14,
    paddingVertical: 12,
  },
  catChipSelected: { backgroundColor: COLORS.primary },
  catChipText: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 13,
    color: COLORS.primary,
  },
  catChipTextSelected: { color: COLORS.white },

  descRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  descInput: {
    flex: 1,
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 15,
    color: COLORS.textPrimary,
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

  // Detail modal
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  detailCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingBottom: 28,
    overflow: "hidden",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  detailIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  detailIconExpense: { backgroundColor: COLORS.primary },
  detailIconIncome: { backgroundColor: "#2E7D32" },
  detailAmount: {
    fontFamily: "HankenGrotesk_700Bold",
    fontSize: 36,
    textAlign: "center",
    marginTop: 8,
  },
  detailType: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 8,
  },
  detailRowText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  detailDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 28,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.error,
  },
  detailDeleteText: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 15,
    color: COLORS.error,
  },
});
