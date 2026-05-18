import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { pendingMessage } from '../../store/engine';
import createStyles from '../../assets/styles/goals.styles';

function formatCurrency(amount: number) {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export default function GoalsScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const styles = createStyles(COLORS);
    const { showAlert, alertEl } = useAlert();

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

    useFocusEffect(
        useCallback(() => {
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
        const amount = parseFloat(addTargetAmount.replace(',', '.'));
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
        pendingMessage.set('Harcamalarımı analiz et ve tasarruf önerileri ver');
        router.push('/(tabs)/ai-hub');
    }

    const detailPct = detailGoal ? Math.min(Number(detailGoal.progress_pct), 100) : 0;
    const detailIsCompleted = detailGoal?.status === 'COMPLETED';
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

                    <View style={[styles.detailIconWrap, detailIsCompleted && styles.detailIconWrapCompleted]}>
                        <Ionicons name='flag' size={32} color={COLORS.white} />
                    </View>
                    <Text style={styles.detailGoalName}>{detailGoal.title}</Text>
                    <View style={[styles.detailStatusBadge, detailIsCompleted && styles.detailStatusBadgeCompleted]}>
                        <Text style={[styles.detailStatusText, detailIsCompleted && styles.detailStatusTextCompleted]}>
                            {STATUS_LABELS[detailGoal.status]}
                        </Text>
                    </View>

                    <View style={styles.detailProgressTrack}>
                        <View
                            style={[
                                styles.detailProgressFill,
                                { width: `${detailPct}%` as any },
                                detailIsCompleted && styles.detailProgressFillCompleted,
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
        <Modal
            visible={addOpen}
            animationType='slide'
            presentationStyle='pageSheet'
            onRequestClose={closeAdd}
        >
            <SafeAreaView style={styles.addSafe} edges={['top', 'bottom']}>
                <KeyboardAvoidingView
                    style={styles.addFlex}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.addHeader}>
                        <TouchableOpacity onPress={closeAdd} style={styles.addCloseBtn}>
                            <Ionicons name='close' size={22} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.addHeaderTitle}>Yeni Hedef</Text>
                        <View style={styles.spacer} />
                    </View>

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
                        <View style={styles.addAmountRow}>
                            <Text style={styles.addAmountSymbol}>₺</Text>
                            <TextInput
                                style={styles.addAmountInput}
                                value={addTargetAmount}
                                onChangeText={setAddTargetAmount}
                                placeholder='0,00'
                                placeholderTextColor={COLORS.border}
                                keyboardType='decimal-pad'
                                maxLength={12}
                            />
                        </View>

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
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.safe} edges={[]}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size='large' color={COLORS.primary} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* INFO */}
                    <View style={styles.infoSection}>
                        <Text style={styles.infoTitle}>Hedef Yönetimi</Text>
                        <Text style={styles.infoSubtitle}>Aktif hedeflerinizi ve AI destekli analizler.</Text>
                    </View>

                    {/* AI CARD */}
                    {aiInsight ? (
                        <View style={styles.aiCard}>
                            <View style={styles.aiHeader}>
                                <Ionicons name='sparkles' size={13} color={COLORS.primary} />
                                <Text style={styles.aiLabel}>{aiInsight.label || 'Analiz Ajanı'}</Text>
                            </View>
                            <Text style={styles.aiMessage}>{aiInsight.message}</Text>
                            <TouchableOpacity style={styles.aiBtn} onPress={handleAiAction}>
                                <Text style={styles.aiBtnText}>Aksiyonu Onayla</Text>
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
                        <View style={styles.emptyCard}>
                            <Ionicons name='flag-outline' size={40} color={COLORS.textSecondary} />
                            <Text style={styles.emptyTitle}>Henüz hedef yok</Text>
                            <Text style={styles.emptyHint}>
                                Yeni hedef ekleyerek veya Mindy ile konuşarak başlayabilirsin.
                            </Text>
                        </View>
                    ) : (
                        goals.map((goal) => {
                            const pct = Math.min(Number(goal.progress_pct), 100);
                            const isCompleted = goal.status === 'COMPLETED';
                            const pendingPledge = pendingPledgesByGoal[goal.id] ?? 0;
                            return (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={styles.goalCard}
                                    onPress={() => setDetailGoal(goal)}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.goalTop}>
                                        <View style={[styles.goalIconBox, isCompleted && styles.goalIconBoxCompleted]}>
                                            <Ionicons name='flag' size={15} color={COLORS.white} />
                                        </View>
                                        <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                                        {pendingPledge > 0 && (
                                            <View style={{ backgroundColor: COLORS.primaryContainer, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6 }}>
                                                <Text style={{ color: COLORS.primary, fontSize: 11, fontFamily: 'HankenGrotesk_500Medium' }}>
                                                    +{Number(pendingPledge).toLocaleString('tr-TR')} TL söz
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.deadlineText}>
                                        Son tarih:{' '}
                                        {new Date(goal.deadline).toLocaleDateString('tr-TR', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </Text>
                                    <View style={styles.amountRow}>
                                        <View style={styles.amountLeft}>
                                            <Text style={styles.currentAmount}>{formatCurrency(goal.current_amount)}</Text>
                                            <Text style={styles.targetAmount}> / {formatCurrency(goal.target_amount)}</Text>
                                        </View>
                                        <Text style={[styles.pctText, isCompleted && styles.pctTextCompleted]}>
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

            {detailModal}
            {addModal}
            {alertEl}
        </SafeAreaView>
    );
}
