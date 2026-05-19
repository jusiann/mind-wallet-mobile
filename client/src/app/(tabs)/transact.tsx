import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    SectionList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Category,
    Transaction,
    createTransaction,
    deleteTransaction,
    exportTransactionsToFile,
    fetchCategories,
    fetchTransactions,
} from '../../store/transactions';
import { COLORS } from '../../constants/theme';
import { useAlert } from '../../constants/alert';
import { CAT_META } from '../../constants/categories';
import createStyles from '../../assets/styles/transact.styles';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function formatCurrency(amount: string | number) {
    return `₺${parseFloat(String(amount)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
}

function formatAmountInput(raw: string): string {
    const cleaned = raw.replace(/[^0-9,]/g, '');
    const commaIdx = cleaned.indexOf(',');
    const intPart = commaIdx === -1 ? cleaned : cleaned.slice(0, commaIdx);
    const decPart = commaIdx === -1 ? '' : cleaned.slice(commaIdx + 1).replace(/,/g, '').slice(0, 2);
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return commaIdx === -1 ? formatted : `${formatted},${decPart}`;
}

function formatSectionDate(iso: string) {
    return new Date(iso).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

type Enriched = Transaction & { catMeta: { tr: string; icon: IoniconName } };
type Section = { title: string; data: Enriched[] };

function buildSections(transactions: Transaction[], cats: Category[]): Section[] {
    const catMap = new Map(cats.map((c) => [c.id, c]));
    const enriched: Enriched[] = transactions.map((tx) => {
        const cat = tx.category_id != null ? catMap.get(tx.category_id) : undefined;
        return {
            ...tx,
            catMeta: cat
                ? (CAT_META[cat.name] ?? { tr: cat.name, icon: 'wallet-outline' as IoniconName })
                : { tr: 'Diğer', icon: 'wallet-outline' as IoniconName },
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

export default function TransactScreen() {
    const [sections, setSections] = useState<Section[]>([]);
    const styles = createStyles(COLORS);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const [addOpen, setAddOpen] = useState(false);
    const [initialType, setInitialType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    const [addType, setAddType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    const [addAmount, setAddAmount] = useState('');
    const [addSelectedCatId, setAddSelectedCatId] = useState<number | null>(null);
    const [addDescription, setAddDescription] = useState('');
    const [addTxDate, setAddTxDate] = useState(new Date());
    const [addSaving, setAddSaving] = useState(false);

    const [detailTx, setDetailTx] = useState<Enriched | null>(null);

    const { showAlert, alertEl } = useAlert();
    const navigation = useNavigation();
    const router = useRouter();
    const { openAs } = useLocalSearchParams<{ openAs?: 'EXPENSE' | 'INCOME' }>();
    const { width: screenWidth } = useWindowDimensions();
    const numCols = 4;
    const chipWidth = (screenWidth - 40 - (numCols - 1) * 8) / numCols;

    useEffect(() => {
        if (openAs === 'EXPENSE' || openAs === 'INCOME') {
            setInitialType(openAs);
            setAddType(openAs);
            setAddOpen(true);
            router.setParams({ openAs: undefined });
        }
    }, [openAs]);

    useEffect(() => {
        if (addOpen) setAddType(initialType);
    }, [addOpen, initialType]);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={handleExport} disabled={exporting}>
                        {exporting ? (
                            <ActivityIndicator size='small' color={COLORS.primary} />
                        ) : (
                            <Ionicons name='document-text-outline' size={22} color={COLORS.textPrimary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
                        <Ionicons name='add' size={22} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [exporting]);

    const load = useCallback(async () => {
        setLoading(true);
        const [txRes, catRes] = await Promise.all([fetchTransactions(), fetchCategories()]);
        if (!txRes.success || !catRes.success) {
            showAlert({ title: 'Hata', message: txRes.message ?? catRes.message ?? 'İşlemler yüklenemedi.' });
            setLoading(false);
            return;
        }
        setCategories(catRes.data!.categories);
        setSections(buildSections(txRes.data!.transactions, catRes.data!.categories));
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    async function handleExport() {
        if (exporting) return;
        setExporting(true);
        const res = await exportTransactionsToFile();
        if (!res.success) showAlert({ title: 'Hata', message: res.message ?? 'Dışa aktarılamadı.' });
        setExporting(false);
    }

    async function handleDelete(id: number) {
        showAlert({
            title: 'İşlemi Sil',
            message: 'Bu işlemi silmek istediğine emin misin?',
            confirm: {
                label: 'Sil',
                destructive: true,
                onPress: async () => {
                    const res = await deleteTransaction(id);
                    if (res.success) {
                        setDetailTx(null);
                        load();
                    } else {
                        showAlert({ title: 'Hata', message: res.message ?? 'Silinemedi.' });
                    }
                },
            },
        });
    }

    function resetAddForm() {
        setAddType('EXPENSE');
        setAddAmount('');
        setAddSelectedCatId(null);
        setAddDescription('');
        setAddTxDate(new Date());
    }

    function closeAdd() {
        resetAddForm();
        setAddOpen(false);
    }

    function shiftDay(delta: number) {
        const d = new Date(addTxDate);
        d.setDate(d.getDate() + delta);
        if (d <= new Date()) setAddTxDate(d);
    }

    async function saveAdd() {
        const parsed = parseFloat(addAmount.replace(/\./g, '').replace(',', '.'));
        if (isNaN(parsed) || parsed <= 0) {
            showAlert({ title: 'Hata', message: 'Geçerli bir tutar gir.' });
            return;
        }
        setAddSaving(true);
        const ts = new Date(addTxDate);
        ts.setHours(new Date().getHours(), new Date().getMinutes(), 0, 0);
        const res = await createTransaction({
            amount: parsed,
            type: addType,
            category_id: addSelectedCatId,
            description: addDescription.trim() || null,
            transaction_timestamp: ts.toISOString(),
        });
        if (res.success) {
            resetAddForm();
            const askAnother = () => showAlert({
                title: 'İşlem Kaydedildi',
                message: 'Başka işlem yapmak ister misin?',
                onCancel: () => { setAddOpen(false); load(); },
                confirm: { label: 'Evet', cancelLabel: 'Hayır', onPress: () => {} },
            });
            if (res.data!.warning) {
                showAlert({
                    title: 'Uyarı',
                    message: res.data!.warning!,
                    confirm: { label: 'Tamam', hideCancel: true, onPress: askAnother },
                });
            } else {
                askAnother();
            }
        } else {
            showAlert({ title: 'Hata', message: res.message ?? 'Kaydedilemedi.' });
        }
        setAddSaving(false);
    }

    const isToday = addTxDate.toDateString() === new Date().toDateString();

    const addModal = (
        <Modal
            visible={addOpen}
            animationType='slide'
            presentationStyle='pageSheet'
            onRequestClose={closeAdd}
        >
            <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={closeAdd} style={styles.modalCloseBtn}>
                            <Ionicons name='close' size={22} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Yeni İşlem</Text>
                        <View style={styles.spacer} />
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps='handled'>
                        {/* TYPE TOGGLE */}
                        <View style={styles.typeToggle}>
                            <TouchableOpacity
                                style={[styles.typeBtn, addType === 'EXPENSE' && styles.typeBtnActiveExpense]}
                                onPress={() => { setAddType('EXPENSE'); setAddSelectedCatId(null); }}
                            >
                                <View style={[styles.typeDot, { backgroundColor: addType === 'EXPENSE' ? '#E53935' : COLORS.border }]} />
                                <Text style={[styles.typeBtnText, addType === 'EXPENSE' && styles.typeBtnTextActive]}>Gider</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, addType === 'INCOME' && styles.typeBtnActiveIncome]}
                                onPress={() => { setAddType('INCOME'); setAddSelectedCatId(null); }}
                            >
                                <View style={[styles.typeDot, { backgroundColor: addType === 'INCOME' ? '#2E7D32' : COLORS.border }]} />
                                <Text style={[styles.typeBtnText, addType === 'INCOME' && styles.typeBtnTextActiveIncome]}>Gelir</Text>
                            </TouchableOpacity>
                        </View>

                        {/* AMOUNT */}
                        <View style={styles.amountRow}>
                            <Text style={styles.amountSymbol}>₺</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={addAmount}
                                onChangeText={(t) => setAddAmount(formatAmountInput(t))}
                                placeholder='0,00'
                                placeholderTextColor={COLORS.border}
                                keyboardType='decimal-pad'
                                maxLength={12}
                            />
                        </View>

                        {/* CATEGORY */}
                        <Text style={styles.fieldLabel}>Kategori</Text>
                        <View style={styles.catGrid}>
                            {categories
                                .filter((c) => c.applicable_to === addType)
                                .map((cat) => {
                                    const meta = CAT_META[cat.name] ?? { tr: cat.name, icon: 'wallet-outline' as IoniconName };
                                    const selected = addSelectedCatId === cat.id;
                                    return (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[styles.catChip, selected && styles.catChipSelected, { width: chipWidth }]}
                                            onPress={() => setAddSelectedCatId(selected ? null : cat.id)}
                                        >
                                            <Ionicons name={meta.icon} size={20} color={selected ? COLORS.white : COLORS.primary} />
                                            <Text style={[styles.catChipText, selected && styles.catChipTextSelected]} numberOfLines={1}>
                                                {meta.tr}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                        </View>

                        {/* DESCRIPTION */}
                        <Text style={styles.fieldLabel}>Açıklama</Text>
                        <View style={styles.descRow}>
                            <TextInput
                                style={styles.descInput}
                                value={addDescription}
                                onChangeText={setAddDescription}
                                placeholder='Açıklama ekle...'
                                placeholderTextColor={COLORS.placeholderText}
                                maxLength={200}
                            />
                            <Ionicons name='pencil-outline' size={16} color={COLORS.textSecondary} />
                        </View>

                        {/* DATE */}
                        <Text style={styles.fieldLabel}>Tarih</Text>
                        <View style={styles.dateRow}>
                            <TouchableOpacity onPress={() => shiftDay(-1)} style={styles.dateArrow}>
                                <Ionicons name='chevron-back' size={18} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                            <Text style={styles.dateText}>
                                {isToday
                                    ? 'Bugün'
                                    : addTxDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                            </Text>
                            <TouchableOpacity onPress={() => shiftDay(1)} style={styles.dateArrow} disabled={isToday}>
                                <Ionicons
                                    name='chevron-forward'
                                    size={18}
                                    color={isToday ? COLORS.border : COLORS.textPrimary}
                                />
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <View style={styles.saveWrap}>
                        <TouchableOpacity
                            style={[styles.saveBtn, addSaving && styles.saveBtnDisabled]}
                            onPress={saveAdd}
                            disabled={addSaving}
                        >
                            {addSaving ? (
                                <ActivityIndicator size='small' color={COLORS.white} />
                            ) : (
                                <>
                                    <Ionicons name='checkmark-circle-outline' size={20} color={COLORS.white} />
                                    <Text style={styles.saveBtnText}>İşlemi Kaydet</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );

    const detailIsIncome = detailTx?.type === 'INCOME';

    const detailModal = detailTx && (
        <Modal visible animationType='fade' transparent onRequestClose={() => setDetailTx(null)}>
            <View style={styles.detailOverlay}>
                <View style={styles.detailCard}>
                    <View style={styles.detailHeader}>
                        <TouchableOpacity onPress={() => setDetailTx(null)} style={styles.modalCloseBtn}>
                            <Ionicons name='close' size={22} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>İşlem Detayı</Text>
                        <View style={styles.spacer} />
                    </View>

                    <View style={[styles.detailIconWrap, detailIsIncome ? styles.detailIconIncome : styles.detailIconExpense]}>
                        <Ionicons name={detailTx.catMeta.icon} size={32} color={COLORS.white} />
                    </View>

                    <Text style={[styles.detailAmount, detailIsIncome ? styles.amountIncome : styles.amountExpense]}>
                        {detailIsIncome ? '+' : '-'}{formatCurrency(detailTx.amount)}
                    </Text>
                    <Text style={styles.detailType}>
                        {detailIsIncome ? 'Gelir' : 'Gider'} · {detailTx.catMeta.tr}
                    </Text>

                    {detailTx.description ? (
                        <View style={styles.detailRow}>
                            <Ionicons name='chatbox-outline' size={16} color={COLORS.textSecondary} />
                            <Text style={styles.detailRowText}>{detailTx.description}</Text>
                        </View>
                    ) : null}
                    <View style={styles.detailRow}>
                        <Ionicons name='calendar-outline' size={16} color={COLORS.textSecondary} />
                        <Text style={styles.detailRowText}>
                            {new Date(detailTx.transaction_timestamp).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                            {'  '}
                            {formatTime(detailTx.transaction_timestamp)}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.detailDeleteBtn} onPress={() => handleDelete(detailTx.id)}>
                        <Ionicons name='trash-outline' size={18} color={COLORS.error} />
                        <Text style={styles.detailDeleteText}>İşlemi Sil</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.safe} edges={[]}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size='large' color={COLORS.primary} />
                </View>
            ) : sections.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name='receipt-outline' size={48} color={COLORS.border} />
                    <Text style={styles.emptyText}>Henüz işlem yok.</Text>
                    <Text style={styles.emptySubText}>+ butonuna basarak işlem ekleyebilirsin.</Text>
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
                            <View style={[styles.txIcon, item.type === 'INCOME' && styles.txIconIncome]}>
                                <Ionicons
                                    name={item.catMeta.icon}
                                    size={18}
                                    color={item.type === 'INCOME' ? '#2E7D32' : COLORS.primary}
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
                                    item.type === 'INCOME' ? styles.amountIncome : styles.amountExpense,
                                ]}
                            >
                                {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            {addModal}
            {detailModal}
            {alertEl}
        </SafeAreaView>
    );
}
