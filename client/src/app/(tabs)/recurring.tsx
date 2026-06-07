import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Switch,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    RecurringTransaction,
    RecurringInterval,
    fetchRecurringTransactions,
    createRecurringTransaction,
    toggleRecurringTransaction,
    deleteRecurringTransaction,
} from '../../store/recurring';
import { fetchCategories, Category } from '../../store/transactions';
import { useCurrency } from '../../hooks/useCurrency';
import { COLORS } from '../../constants/theme';
import { CAT_META } from '../../constants/categories';
import { useAlert } from '../../constants/alert';
import createStyles from '../../assets/styles/recurring.styles';
import BottomSheetModal from '../../components/BottomSheetModal';
import { cleanAmountInput, formatAmountDisplay } from '../../utils/format';
import LoadingState from '../../components/tabs/LoadingState';
import EmptyState from '../../components/tabs/EmptyState';
import AmountInput from '../../components/tabs/AmountInput';
import DatePickerRow from '../../components/tabs/DatePickerRow';
import BottomSheetHeader from '../../components/tabs/BottomSheetHeader';
import CalendarModal from '../../components/tabs/CalendarModal';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const INTERVALS: { label: string; value: RecurringInterval }[] = [
    { label: 'Günlük', value: 'DAILY' },
    { label: 'Haftalık', value: 'WEEKLY' },
    { label: 'Aylık', value: 'MONTHLY' },
    { label: 'Yıllık', value: 'YEARLY' },
];



export default function RecurringScreen() {
    const router = useRouter();
    const styles = createStyles(COLORS);
    const { showAlert, alertEl } = useAlert();
    const { symbol, formatCurrency, toBaseCurrency } = useCurrency();

    const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [addOpen, setAddOpen] = useState(false);
    const [addType, setAddType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    const [addAmount, setAddAmount] = useState('');
    const [addSelectedCatId, setAddSelectedCatId] = useState<number | null>(null);
    const [addDescription, setAddDescription] = useState('');
    const [addInterval, setAddInterval] = useState<RecurringInterval>('MONTHLY');
    const [addStartDate, setAddStartDate] = useState(new Date());
    const [addSaving, setAddSaving] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const [detailTx, setDetailTx] = useState<RecurringTransaction | null>(null);

    const { width: screenWidth } = useWindowDimensions();
    const numCols = 3;
    const chipWidth = (screenWidth - 64 - (numCols - 1) * 8) / numCols;

    const loadData = useCallback(async () => {
        setLoading(true);
        const [recRes, catRes] = await Promise.all([fetchRecurringTransactions(), fetchCategories()]);
        if (recRes.success && catRes.success) {
            setTransactions(recRes.data!);
            setCategories(catRes.data!.categories);
        } else {
            showAlert({ title: 'Hata', message: recRes.message || catRes.message || 'Veriler yüklenemedi.' });
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    function resetAddForm() {
        setAddType('EXPENSE');
        setAddAmount('');
        setAddSelectedCatId(null);
        setAddDescription('');
        setAddInterval('MONTHLY');
        setAddStartDate(new Date());
    }

    function closeAdd() {
        resetAddForm();
        setAddOpen(false);
    }



    async function handleSaveAdd() {
        const parsed = toBaseCurrency(parseFloat(addAmount.replace(/\./g, '').replace(',', '.')));
        if (isNaN(parsed) || parsed <= 0) {
            showAlert({ title: 'Hata', message: 'Geçerli bir tutar gir.' });
            return;
        }
        setAddSaving(true);
        const res = await createRecurringTransaction({
            amount: parsed,
            type: addType,
            category_id: addSelectedCatId,
            description: addDescription.trim() || null,
            interval: addInterval,
            start_date: addStartDate.toISOString().split('T')[0],
        });
        if (res.success) {
            closeAdd();
            loadData();
        } else {
            showAlert({ title: 'Hata', message: res.message || 'Kaydedilemedi.' });
        }
        setAddSaving(false);
    }

    async function handleToggle(id: number, currentVal: boolean) {
        const res = await toggleRecurringTransaction(id, !currentVal);
        if (res.success) {
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, is_active: !currentVal } : t));
            if (detailTx && detailTx.id === id) {
                setDetailTx(prev => prev ? { ...prev, is_active: !currentVal } : null);
            }
        } else {
            showAlert({ title: 'Hata', message: res.message || 'Güncellenemedi.' });
        }
    }

    async function handleDelete(id: number) {
        showAlert({
            title: 'Sil',
            message: 'Bu tekrarlayan işlemi silmek istediğine emin misin?',
            confirm: {
                label: 'Sil',
                destructive: true,
                onPress: async () => {
                    const res = await deleteRecurringTransaction(id);
                    if (res.success) {
                        setDetailTx(null);
                        loadData();
                    } else {
                        showAlert({ title: 'Hata', message: res.message || 'Silinemedi.' });
                    }
                },
            },
        });
    }

    const isToday = addStartDate.toDateString() === new Date().toDateString();

    const addModal = (
        <BottomSheetModal visible={addOpen} onClose={closeAdd}>
            <BottomSheetHeader title="Yeni Tekrarlayan İşlem" />

            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps='handled'>
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

                <AmountInput
                    symbol={symbol}
                    value={addAmount}
                    onChangeText={(t) => setAddAmount(cleanAmountInput(t))}
                    onEndEditing={() => setAddAmount(formatAmountDisplay(addAmount))}
                />

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

                <Text style={styles.fieldLabel}>Tekrarlama Sıklığı</Text>
                <View style={styles.intervalRow}>
                    {INTERVALS.map(int => (
                        <TouchableOpacity
                            key={int.value}
                            style={[styles.intervalBtn, addInterval === int.value && styles.intervalBtnSelected]}
                            onPress={() => setAddInterval(int.value)}
                        >
                            <Text style={[styles.intervalBtnText, addInterval === int.value && styles.intervalBtnTextSelected]}>
                                {int.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

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

                <Text style={styles.fieldLabel}>Başlangıç Tarihi</Text>
                <DatePickerRow date={addStartDate} isToday={isToday} onPressDate={() => setCalendarOpen(true)} />
            </ScrollView>

            <View style={styles.saveWrap}>
                <TouchableOpacity
                    style={[styles.saveBtn, addSaving && styles.saveBtnDisabled]}
                    onPress={handleSaveAdd}
                    disabled={addSaving}
                >
                    {addSaving ? (
                        <ActivityIndicator size='small' color={COLORS.white} />
                    ) : (
                        <>
                            <Ionicons name='checkmark-circle-outline' size={20} color={COLORS.white} />
                            <Text style={styles.saveBtnText}>Kaydet</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </BottomSheetModal>
    );

    const detailModal = detailTx && (
        <Modal visible animationType='fade' transparent onRequestClose={() => setDetailTx(null)}>
            <View style={styles.detailOverlay}>
                <View style={styles.detailCard}>
                    <View style={styles.detailHeader}>
                        <TouchableOpacity onPress={() => setDetailTx(null)} style={styles.detailCloseBtn}>
                            <Ionicons name='close' size={22} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Detay</Text>
                        <View style={styles.spacer} />
                    </View>

                    <View style={[styles.detailIconWrap, detailTx.type === 'INCOME' ? styles.recIconIncome : styles.recIconExpense]}>
                        <Ionicons 
                            name={detailTx.category_name ? (CAT_META[detailTx.category_name]?.icon || 'wallet-outline') : 'wallet-outline'} 
                            size={32} 
                            color={COLORS.white} 
                        />
                    </View>

                    <Text style={[styles.detailAmount, detailTx.type === 'INCOME' ? styles.recAmountIncome : styles.recAmountExpense]}>
                        {detailTx.type === 'INCOME' ? '+' : '-'}{formatCurrency(detailTx.amount)}
                    </Text>
                    <Text style={styles.detailType}>
                        {detailTx.type === 'INCOME' ? 'Gelir' : 'Gider'} · {detailTx.category_name ? (CAT_META[detailTx.category_name]?.tr || detailTx.category_name) : 'Genel'}
                    </Text>

                    {detailTx.description && (
                        <View style={styles.detailRow}>
                            <Ionicons name='chatbox-outline' size={16} color={COLORS.textSecondary} />
                            <Text style={styles.detailRowText}>{detailTx.description}</Text>
                        </View>
                    )}
                    <View style={styles.detailRow}>
                        <Ionicons name='repeat-outline' size={16} color={COLORS.textSecondary} />
                        <Text style={styles.detailRowText}>
                            Sıklık: {INTERVALS.find(i => i.value === detailTx.interval)?.label}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name='calendar-outline' size={16} color={COLORS.textSecondary} />
                        <Text style={styles.detailRowText}>
                            Sonraki: {new Date(detailTx.next_run_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name='power-outline' size={16} color={COLORS.textSecondary} />
                        <Text style={styles.detailRowText}>Durum</Text>
                        <Switch
                            value={detailTx.is_active}
                            onValueChange={() => handleToggle(detailTx.id, detailTx.is_active)}
                            trackColor={{ false: COLORS.border, true: Platform.OS === 'android' ? COLORS.primaryContainer : COLORS.primary }}
                            thumbColor={Platform.OS === 'android' ? (detailTx.is_active ? COLORS.primary : '#f4f3f4') : undefined}
                        />
                    </View>

                    <TouchableOpacity style={styles.detailDeleteBtn} onPress={() => handleDelete(detailTx.id)}>
                        <Ionicons name='trash-outline' size={18} color={COLORS.error} />
                        <Text style={styles.detailDeleteText}>Sil</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name='arrow-back' size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Otom. İşlemler</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
                    <Ionicons name='add' size={22} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <LoadingState />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {transactions.length === 0 ? (
                        <View style={{ flex: 1, marginTop: 40 }}>
                            <EmptyState 
                                icon="repeat-outline"
                                title="Kayıt Yok"
                                hint="Düzenli faturalarınızı veya gelirlerinizi buraya ekleyerek otomatik işlenmesini sağlayabilirsiniz."
                            />
                        </View>
                    ) : (
                        transactions.map(item => {
                            const meta = item.category_name 
                                ? (CAT_META[item.category_name] ?? { tr: item.category_name, icon: 'wallet-outline' as IoniconName })
                                : { tr: 'Genel', icon: 'wallet-outline' as IoniconName };
                            const intLabel = INTERVALS.find(i => i.value === item.interval)?.label;
                            
                            return (
                                <TouchableOpacity 
                                    key={item.id} 
                                    style={[styles.recCard, !item.is_active && styles.recCardInactive]}
                                    onPress={() => setDetailTx(item)}
                                >
                                    <View style={styles.recCardContent}>
                                        <View style={styles.recInfo}>
                                            <View style={styles.recIconBox}>
                                                <Ionicons name={meta.icon} size={22} color={COLORS.textPrimary} />
                                            </View>
                                            <View style={styles.recTextWrap}>
                                                <Text style={styles.recDesc} numberOfLines={1}>{item.description || meta.tr}</Text>
                                                <Text style={styles.recCat}>{meta.tr} · {intLabel}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.recRight}>
                                            <Text style={[styles.recAmount, item.type === 'INCOME' ? styles.recAmountIncome : styles.recAmountExpense]}>
                                                {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                                            </Text>
                                            <View style={styles.recRightBottom}>
                                                <View style={styles.recDetailItem}>
                                                    <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
                                                    <Text style={styles.recDetailTextDate}>
                                                        {new Date(item.next_run_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                    </Text>
                                                </View>
                                                <Switch
                                                    value={item.is_active}
                                                    onValueChange={() => handleToggle(item.id, item.is_active)}
                                                    style={styles.recSwitch}
                                                    trackColor={{ false: COLORS.border, true: Platform.OS === 'android' ? COLORS.primaryContainer : COLORS.primary }}
                                                    thumbColor={Platform.OS === 'android' ? (item.is_active ? COLORS.primary : '#f4f3f4') : undefined}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            )}

            {addModal}
            {detailModal}
            <CalendarModal
                visible={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                date={addStartDate}
                onSelectDate={setAddStartDate}
            />
            {alertEl}
        </SafeAreaView>
    );
}
