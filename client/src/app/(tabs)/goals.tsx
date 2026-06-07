import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDashboard } from '../../store/dashboard';
import { Goal, createGoal, deleteGoalById, getGoals } from '../../store/goals';
import { Pledge, fetchPledges } from '../../store/pledges';
import { COLORS } from '../../constants/theme';
import { useAlert } from '../../constants/alert';
import { useEngineStore } from '../../store/useEngineStore';
import createStyles from '../../assets/styles/goals.styles';
import { useCurrency } from '../../hooks/useCurrency';
import BottomSheetModal from '../../components/BottomSheetModal';
import LoadingState from '../../components/tabs/LoadingState';
import ErrorState from '../../components/tabs/ErrorState';
import EmptyState from '../../components/tabs/EmptyState';
import GoalCard from '../../components/tabs/GoalCard';
import AmountInput from '../../components/tabs/AmountInput';
import BottomSheetHeader from '../../components/tabs/BottomSheetHeader';

function cleanAmountInput(raw: string): string {
    const cleaned = raw.replace(/[^0-9,]/g, '');
    const commaIdx = cleaned.indexOf(',');
    const intPart = commaIdx === -1 ? cleaned : cleaned.slice(0, commaIdx);
    const decPart = commaIdx === -1 ? '' : cleaned.slice(commaIdx + 1).replace(/,/g, '').slice(0, 2);
    return commaIdx === -1 ? intPart : `${intPart},${decPart}`;
}

function formatAmountDisplay(raw: string): string {
    const cleaned = raw.replace(/[^0-9,]/g, '');
    if (!cleaned) return '';
    const commaIdx = cleaned.indexOf(',');
    const intPart = commaIdx === -1 ? cleaned : cleaned.slice(0, commaIdx);
    const decPart = commaIdx === -1 ? '' : cleaned.slice(commaIdx + 1).replace(/,/g, '').slice(0, 2);
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return commaIdx === -1 ? formatted : `${formatted},${decPart}`;
}

function formatMonthYear(date: Date): string {
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
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

const STATUS_LABELS: Record<Goal['status'], string> = {
    ACTIVE: 'Aktif',
    COMPLETED: 'Tamamlandı',
    PAUSED: 'Durduruldu',
};

function isGoalExpired(goal: Goal): boolean {
    return goal.status === 'ACTIVE' && new Date(goal.deadline) < new Date();
}

export default function GoalsScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const styles = createStyles(COLORS);
    const { showAlert, alertEl } = useAlert();
    const { symbol, formatCurrency, toBaseCurrency } = useCurrency();

    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [aiInsight, setAiInsight] = useState<{ label: string; message: string } | null>(null);
    // goalId → pending pledge miktarlarının toplamı
    const [pendingPledgesByGoal, setPendingPledgesByGoal] = useState<Record<number, number>>({});

    const [detailGoal, setDetailGoal] = useState<Goal | null>(null);

    const [addOpen, setAddOpen] = useState(false);
    const [addTitle, setAddTitle] = useState('');
    const [addTargetAmount, setAddTargetAmount] = useState('');
    const [addDeadline, setAddDeadline] = useState(getDefaultDeadline());
    const [addSaving, setAddSaving] = useState(false);
    const [addFormError, setAddFormError] = useState('');

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerBtnWrap}>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
                        <Ionicons name='add' size={22} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation]);

    const isLoaded = useRef(false);
    useFocusEffect(
        useCallback(() => {
            const shouldRefresh = useEngineStore.getState().consumeRefresh();
            
            if (shouldRefresh || !isLoaded.current) {
                isLoaded.current = true;
                loadGoals(true);
                getDashboard().then((res) => {
                    if (res.success) setAiInsight(res.data!.ai_insight);
                });
                fetchPledges('PENDING').then((res) => {
                    if (res.success) {
                        const map: Record<number, number> = {};
                        for (const p of res.data ?? []) {
                            map[p.goal_id] = (map[p.goal_id] ?? 0) + Number(p.amount);
                        }
                        setPendingPledgesByGoal(map);
                    }
                });
            }
        }, []),
    );

    async function loadGoals(showLoading = false) {
        if (showLoading) setLoading(true);
        const res = await getGoals();
        if (res.success) {
            setGoals(res.data!);
            setError('');
        } else {
            setError(res.message ?? 'Yüklenemedi.');
        }
        setLoading(false);
    }

    function resetAdd() {
        setAddTitle('');
        setAddTargetAmount('');
        setAddDeadline(getDefaultDeadline());
        setAddFormError('');
    }

    function closeAdd() {
        resetAdd();
        setAddOpen(false);
    }

    async function handleSaveAdd() {
        const trimmedTitle = addTitle.trim();
        const amount = toBaseCurrency(parseFloat(addTargetAmount.replace(/\./g, '').replace(',', '.')));
        if (!trimmedTitle) { setAddFormError('Hedef adı gerekli.'); return; }
        if (isNaN(amount) || amount <= 0) { setAddFormError('Geçerli bir tutar girin.'); return; }
        setAddSaving(true);
        setAddFormError('');
        const lastDay = new Date(addDeadline.getFullYear(), addDeadline.getMonth() + 1, 0);
        const res = await createGoal({
            title: trimmedTitle,
            target_amount: amount,
            deadline: lastDay.toISOString(),
        });
        if (res.success) {
            resetAdd();
            setAddOpen(false);
            loadGoals();
        } else {
            setAddFormError(res.message ?? 'Hedef oluşturulamadı.');
        }
        setAddSaving(false);
    }

    function handleDeleteGoal(goal: Goal) {
        showAlert({
            title: 'Hedefi Sil',
            message: `"${goal.title}" silinsin mi?`,
            confirm: {
                label: 'Sil',
                destructive: true,
                onPress: async () => {
                    const res = await deleteGoalById(goal.id);
                    if (res.success) {
                        setDetailGoal(null);
                        loadGoals();
                    } else {
                        showAlert({ title: 'Hata', message: res.message ?? 'Hedef silinemedi.' });
                    }
                },
            },
        });
    }

    function handleAiAction() {
        useEngineStore.getState().setPendingChat('Harcamalarımı analiz et ve tasarruf önerileri ver');
        router.push('/(tabs)/ai-hub');
    }

    const detailPct = detailGoal ? Math.min(Number(detailGoal.progress_pct), 100) : 0;
    const detailIsCompleted = detailGoal?.status === 'COMPLETED';
    const detailIsExpired = detailGoal ? isGoalExpired(detailGoal) : false;
    const detailRemaining = detailGoal
        ? Math.max(detailGoal.target_amount - detailGoal.current_amount, 0)
        : 0;

    const detailModal = detailGoal && (
        <Modal visible animationType='fade' transparent onRequestClose={() => setDetailGoal(null)}>
            <View style={styles.detailOverlay}>
                <View style={styles.detailCard}>
                    <View style={styles.detailHeader}>
                        <TouchableOpacity onPress={() => setDetailGoal(null)} style={styles.detailCloseBtn}>
                            <Ionicons name='close' size={22} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.detailTitle}>Hedef Detayı</Text>
                        <View style={styles.spacer} />
                    </View>

                    <View style={[styles.detailIconWrap, detailIsCompleted && styles.detailIconWrapCompleted, detailIsExpired && styles.detailIconWrapExpired]}>
                        <Ionicons name='flag' size={32} color={COLORS.white} />
                    </View>
                    <Text style={styles.detailGoalName}>{detailGoal.title}</Text>
                    {(detailGoal.status !== 'ACTIVE' || detailIsExpired) && (
                        <View style={[
                            styles.detailStatusBadge,
                            detailIsCompleted && styles.detailStatusBadgeCompleted,
                            detailIsExpired && styles.detailStatusBadgeExpired,
                        ]}>
                            <Text style={[
                                styles.detailStatusText,
                                detailIsCompleted && styles.detailStatusTextCompleted,
                                detailIsExpired && styles.detailStatusTextExpired,
                            ]}>
                                {detailIsExpired ? 'Süre Doldu' : STATUS_LABELS[detailGoal.status]}
                            </Text>
                        </View>
                    )}

                    <View style={styles.detailProgressTrack}>
                        <View
                            style={[
                                styles.detailProgressFill,
                                { width: `${detailPct}%` as any },
                                detailIsCompleted && styles.detailProgressFillCompleted,
                                detailIsExpired && styles.detailProgressFillExpired,
                            ]}
                        />
                    </View>
                    <Text style={styles.detailPctText}>%{detailPct.toFixed(0)} tamamlandı</Text>

                    <View style={styles.detailInfoRow}>
                        <Ionicons name='wallet-outline' size={16} color={COLORS.textSecondary} />
                        <Text style={styles.detailInfoText}>
                            {formatCurrency(detailGoal.current_amount)} / {formatCurrency(detailGoal.target_amount)}
                        </Text>
                    </View>
                    <View style={styles.detailInfoRow}>
                        <Ionicons name='calendar-outline' size={16} color={COLORS.textSecondary} />
                        <Text style={styles.detailInfoText}>
                            {new Date(detailGoal.deadline).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </Text>
                    </View>
                    {!detailIsCompleted && (
                        <View style={styles.detailInfoRow}>
                            <Ionicons name='hourglass-outline' size={16} color={COLORS.textSecondary} />
                            <Text style={styles.detailInfoText}>{formatCurrency(detailRemaining)} kaldı</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.detailDeleteBtn} onPress={() => handleDeleteGoal(detailGoal)}>
                        <Ionicons name='trash-outline' size={18} color={COLORS.error} />
                        <Text style={styles.detailDeleteText}>Hedefi Sil</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const addModal = (
        <BottomSheetModal visible={addOpen} onClose={closeAdd}>
            <BottomSheetHeader title="Yeni Hedef" />

            <ScrollView contentContainerStyle={styles.addContent} keyboardShouldPersistTaps='handled'>
                <Text style={styles.addFieldLabel}>Hedef Adı</Text>
                <TextInput
                    style={styles.addTextInput}
                    value={addTitle}
                    onChangeText={setAddTitle}
                    placeholder='Örn: Ev Peşinatı'
                    placeholderTextColor={COLORS.placeholderText}
                    maxLength={100}
                />

                <Text style={styles.addFieldLabel}>Hedef Tutarı</Text>
                <AmountInput
                    symbol={symbol}
                    value={addTargetAmount}
                    onChangeText={(t) => setAddTargetAmount(cleanAmountInput(t))}
                    onEndEditing={() => setAddTargetAmount(formatAmountDisplay(addTargetAmount))}
                />

                <Text style={styles.addFieldLabel}>Hedef Tarihi</Text>
                <View style={styles.addDateRow}>
                    <TouchableOpacity style={styles.addDateArrow} onPress={() => setAddDeadline((d) => addMonths(d, -1))}>
                        <Ionicons name='chevron-back' size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.addDateText}>{formatMonthYear(addDeadline)}</Text>
                    <TouchableOpacity style={styles.addDateArrow} onPress={() => setAddDeadline((d) => addMonths(d, 1))}>
                        <Ionicons name='chevron-forward' size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>

                {addFormError ? <Text style={styles.addFormError}>{addFormError}</Text> : null}
            </ScrollView>

            <View style={styles.addSaveWrap}>
                <TouchableOpacity
                    style={[styles.addSaveBtn, addSaving && styles.addSaveBtnDisabled]}
                    onPress={handleSaveAdd}
                    disabled={addSaving}
                >
                    {addSaving ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <Ionicons name='checkmark-circle-outline' size={20} color={COLORS.white} />
                            <Text style={styles.addSaveBtnText}>Hedefi Kaydet</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </BottomSheetModal>
    );

    return (
        <SafeAreaView style={styles.safe} edges={[]}>
            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState error={error} />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* AI CARD */}
                    {aiInsight ? (
                        <View style={styles.aiCard}>
                            <View style={styles.aiHeader}>
                                <Ionicons name='sparkles' size={13} color={COLORS.primary} />
                                <Text style={styles.aiLabel}>{aiInsight.label || 'Analiz Ajanı'}</Text>
                            </View>
                            <Text style={styles.aiMessage}>{aiInsight.message}</Text>
                            <TouchableOpacity style={styles.aiBtn} onPress={handleAiAction}>
                                <Text style={styles.aiBtnText}>Mindy'e Sor</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.aiCard, styles.aiCardEmpty]}>
                            <Ionicons name='sparkles-outline' size={22} color={COLORS.textSecondary} />
                            <Text style={styles.aiEmptyText}>AI analizi yükleniyor...</Text>
                        </View>
                    )}

                    {/* GOALS */}
                    {goals.length === 0 ? (
                        <View style={{ flex: 1, marginTop: 40 }}>
                            <EmptyState 
                                icon="flag-outline"
                                title="Henüz hedef yok"
                                hint="Yeni hedef ekleyerek veya Mindy ile konuşarak başlayabilirsin."
                            />
                        </View>
                    ) : (
                        goals.map((goal) => {
                            const pendingPledge = pendingPledgesByGoal[goal.id] ?? 0;
                            return (
                                <GoalCard
                                    key={goal.id}
                                    goal={goal}
                                    onPress={() => setDetailGoal(goal)}
                                    pendingPledgeAmount={pendingPledge}
                                />
                            );
                        })
                    )}
                </ScrollView>
            )}

            {detailModal}
            {addModal}
            {alertEl}
        </SafeAreaView>
    );
}
