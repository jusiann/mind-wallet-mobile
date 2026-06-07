import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useCurrency } from '../../hooks/useCurrency';
import BottomSheetModal from '../../components/BottomSheetModal';
import { cleanAmountInput, formatAmountDisplay } from '../../utils/format';
import { useEngineStore } from '../../store/useEngineStore';
import TransactionRow from '../../components/tabs/TransactionRow';
import LoadingState from '../../components/tabs/LoadingState';
import EmptyState from '../../components/tabs/EmptyState';
import QuickActionCard from '../../components/tabs/QuickActionCard';
import AmountInput from '../../components/tabs/AmountInput';
import DatePickerRow from '../../components/tabs/DatePickerRow';
import BottomSheetHeader from '../../components/tabs/BottomSheetHeader';
import CalendarModal from '../../components/tabs/CalendarModal';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];



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
    const [exportOpen, setExportOpen] = useState(false);
    const [exportDate, setExportDate] = useState(new Date());
    const { symbol, formatCurrency, toBaseCurrency } = useCurrency();

    const [addOpen, setAddOpen] = useState(false);
    const [initialType, setInitialType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    const [addType, setAddType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    const [addAmount, setAddAmount] = useState('');
    const [addSelectedCatId, setAddSelectedCatId] = useState<number | null>(null);
    const [addDescription, setAddDescription] = useState('');
    const [addTxDate, setAddTxDate] = useState(new Date());
    const [addSaving, setAddSaving] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const [detailTx, setDetailTx] = useState<Enriched | null>(null);

    const { showAlert, alertEl } = useAlert();
    const navigation = useNavigation();
    const router = useRouter();
    const { openAs } = useLocalSearchParams<{ openAs?: 'EXPENSE' | 'INCOME' }>();
    const { width: screenWidth } = useWindowDimensions();
    const numCols = 3;
    const chipWidth = (screenWidth - 64 - (numCols - 1) * 8) / numCols;

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
                    <TouchableOpacity style={styles.iconBtn} onPress={() => setExportOpen(true)} disabled={exporting}>
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

    const isLoaded = useRef(false);
    useFocusEffect(useCallback(() => { 
        const shouldRefresh = useEngineStore.getState().consumeRefresh();
        if (shouldRefresh || !isLoaded.current) {
            isLoaded.current = true;
            load(); 
        }
    }, [load]));

    function shiftExportMonth(delta: number) {
        const d = new Date(exportDate);
        d.setMonth(d.getMonth() + delta);
        setExportDate(d);
    }

    async function executeExport(all: boolean = false) {
        if (exporting) return;
        setExporting(true);
        const monthStr = all ? undefined : `${exportDate.getFullYear()}-${String(exportDate.getMonth() + 1).padStart(2, '0')}`;
        const res = await exportTransactionsToFile(monthStr);
        if (!res.success) showAlert({ title: 'Hata', message: res.message ?? 'Dışa aktarılamadı.' });
        else setExportOpen(false);
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



    async function saveAdd() {
        const parsed = toBaseCurrency(parseFloat(addAmount.replace(/\./g, '').replace(',', '.')));
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
            if (res.data!.warning) {
                showAlert({
                    title: 'Uyarı',
                    message: res.data!.warning!,
                    confirm: { label: 'Tamam', hideCancel: true, onPress: () => { setAddOpen(false); load(); } },
                });
            } else {
                setAddOpen(false);
                load();
            }
        } else {
            showAlert({ title: 'Hata', message: res.message ?? 'Kaydedilemedi.' });
        }
        setAddSaving(false);
    }

    const isToday = addTxDate.toDateString() === new Date().toDateString();

    const addModal = (
        <BottomSheetModal visible={addOpen} onClose={closeAdd}>
            <BottomSheetHeader title="Yeni İşlem" />

            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps='handled'>
                {/* TYPE TOGGLE */}
                <View style={styles.typeToggle}>
                    <TouchableOpacity
                        style={[styles.typeBtn, addType === 'EXPENSE' && styles.typeBtnActiveExpense]}
                        onPress={() => { setAddType('EXPENSE'); setAddSelectedCatId(null); }}
                    >
                        <View style={[styles.typeDot, { backgroundColor: addType === 'EXPENSE' ? COLORS.primary : COLORS.border }]} />
                        <Text style={[styles.typeBtnText, addType === 'EXPENSE' && styles.typeBtnTextActive]}>Gider</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeBtn, addType === 'INCOME' && styles.typeBtnActiveIncome]}
                        onPress={() => { setAddType('INCOME'); setAddSelectedCatId(null); }}
                    >
                        <View style={[styles.typeDot, { backgroundColor: addType === 'INCOME' ? COLORS.primary : COLORS.border }]} />
                        <Text style={[styles.typeBtnText, addType === 'INCOME' && styles.typeBtnTextActiveIncome]}>Gelir</Text>
                    </TouchableOpacity>
                </View>

                {/* AMOUNT */}
                <AmountInput
                    symbol={symbol}
                    value={addAmount}
                    onChangeText={(t) => setAddAmount(cleanAmountInput(t))}
                    onEndEditing={() => setAddAmount(formatAmountDisplay(addAmount))}
                />

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
                <DatePickerRow date={addTxDate} isToday={isToday} onPressDate={() => setCalendarOpen(true)} />
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
        </BottomSheetModal>
    );

    const detailIsIncome = detailTx?.type === 'INCOME';

    const detailModal = detailTx && (
        <Modal visible animationType='fade' transparent onRequestClose={() => setDetailTx(null)}>
            <View style={styles.detailOverlay}>
                <View style={styles.detailCard}>
                    <View style={styles.detailHeader}>
                        <TouchableOpacity onPress={() => setDetailTx(null)} style={styles.detailCloseBtn}>
                            <Ionicons name='close' size={22} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>İşlem Detayı</Text>
                        <View style={styles.spacer} />
                    </View>

                    <View style={[styles.detailIconWrap, detailIsIncome ? styles.detailIconIncome : styles.detailIconExpense]}>
                        <Ionicons name={detailTx.catMeta.icon} size={32} color={COLORS.white} />
                    </View>

                    <Text style={[styles.detailAmount, detailIsIncome ? styles.amountIncome : styles.amountExpense]}>
                        {detailIsIncome ? '+' : '-'}{formatCurrency(parseFloat(String(detailTx.amount)))}
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

    const exportBottomSheet = (
        <BottomSheetModal visible={exportOpen} onClose={() => setExportOpen(false)}>
            <BottomSheetHeader title="Dışa Aktar - Excel" />
            <View style={{ padding: 20, gap: 16 }}>
                <Text style={styles.fieldLabel}>Dışa aktarılacak dönemi seçin:</Text>

                <View style={[styles.dateRow, { marginBottom: 8 }]}>
                    <TouchableOpacity onPress={() => shiftExportMonth(-1)} style={styles.dateArrow}>
                        <Ionicons name='chevron-back' size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.dateText}>
                        {exportDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={() => shiftExportMonth(1)} style={styles.dateArrow}>
                        <Ionicons name='chevron-forward' size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => executeExport(false)}
                    disabled={exporting}
                >
                    {exporting ? <ActivityIndicator size="small" color={COLORS.white} /> : (
                        <>
                            <Ionicons name='download-outline' size={20} color={COLORS.white} />
                            <Text style={styles.saveBtnText}>Seçili Ayı Aktar</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: COLORS.surfaceContainerLow, marginTop: 4 }]}
                    onPress={() => executeExport(true)}
                    disabled={exporting}
                >
                    <Ionicons name='documents-outline' size={20} color={COLORS.primary} />
                    <Text style={[styles.saveBtnText, { color: COLORS.primary }]}>Tüm İşlemleri Aktar</Text>
                </TouchableOpacity>
            </View>
        </BottomSheetModal>
    );

    return (
        <SafeAreaView style={styles.safe} edges={[]}>
            {loading ? (
                <LoadingState />
            ) : sections.length === 0 ? (
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={styles.quickActionsRow}>
                        <QuickActionCard title="Aylık Rapor" icon="bar-chart-outline" onPress={() => router.push('/report' as any)} />
                        <QuickActionCard title="Otom. İşlemler" icon="repeat-outline" onPress={() => router.push('/recurring' as any)} />
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <EmptyState 
                            icon="receipt-outline" 
                            title="Henüz işlem yok." 
                            hint="+ butonuna basarak işlem ekleyebilirsin." 
                        />
                    </View>
                </ScrollView>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={false}
                    ListHeaderComponent={
                        <View style={styles.quickActionsRow}>
                            <QuickActionCard title="Aylık Rapor" icon="bar-chart-outline" onPress={() => router.push('/report' as any)} />
                            <QuickActionCard title="Otom. İşlemler" icon="repeat-outline" onPress={() => router.push('/recurring' as any)} />
                        </View>
                    }
                    renderSectionHeader={({ section }) => (
                        <Text style={styles.sectionHeader}>{section.title}</Text>
                    )}
                    renderItem={({ item }) => (
                        <TransactionRow tx={item} meta={item.catMeta} onPress={() => setDetailTx(item)} />
                    )}
                />
            )}

            {addModal}
            {exportBottomSheet}
            {detailModal}
            <CalendarModal
                visible={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                date={addTxDate}
                onSelectDate={setAddTxDate}
            />
            {alertEl}
        </SafeAreaView>
    );
}
