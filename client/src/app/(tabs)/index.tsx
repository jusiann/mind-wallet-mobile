import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardData, getDashboard } from '../../api/dashboard';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { getUserInitials } from '../../store/auth';

const { width: screenWidth } = Dimensions.get('window');

function formatCurrency(amount: number): string {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function DashboardScreen() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [initials, setInitials] = useState(getUserInitials());
    const goalsScrollRef = useRef<ScrollView>(null);
    const goalsScrollX = useRef(new Animated.Value(0)).current;

    useFocusEffect(useCallback(() => { setInitials(getUserInitials()); }, []));

    useEffect(() => {
        getDashboard()
            .then(setData)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading)
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );

    if (error)
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );

    const pct = data?.monthly_stats?.expense_vs_last_month_pct ?? 0;
    const pctDown = pct <= 0;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mind Wallet</Text>
                <TouchableOpacity onPress={() => router.push('/profile')} style={styles.headerAvatar}>
                    <Text style={styles.headerAvatarText}>{initials}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* BALANCE CARD */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>BAKİYE</Text>
                    <Text style={styles.balanceAmount}>{formatCurrency(data?.total_balance ?? 0)}</Text>
                    <View style={styles.trendBadge}>
                        <Ionicons
                            name={pctDown ? 'trending-down-outline' : 'trending-up-outline'}
                            size={14}
                            color={COLORS.primary}
                        />
                        <Text style={styles.trendText}>
                            {Math.abs(pct).toFixed(1)}% Son 30 gün
                        </Text>
                    </View>
                </View>

                {/* QUICK ACTIONS */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: COLORS.primary }]}
                        onPress={() => router.push('/(tabs)/transact')}
                    >
                        <View style={[styles.actionIconCircle, { backgroundColor: COLORS.white }]}>
                            <Ionicons name="arrow-up-outline" size={22} color={COLORS.primary} />
                        </View>
                        <Text style={[styles.actionLabel, { color: COLORS.white }]}>Harcama</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: COLORS.primaryContainer }]}
                        onPress={() => router.push('/(tabs)/transact')}
                    >
                        <View style={[styles.actionIconCircle, { backgroundColor: COLORS.white }]}>
                            <Ionicons name="arrow-down-outline" size={22} color={COLORS.primary} />
                        </View>
                        <Text style={[styles.actionLabel, { color: COLORS.primary }]}>Gelir</Text>
                    </TouchableOpacity>
                </View>

                {/* GOALS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Hedefler</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/goals')}>
                            <Text style={styles.seeAllText}>Tümü</Text>
                        </TouchableOpacity>
                    </View>
                    <Animated.ScrollView
                        ref={goalsScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={styles.goalsScrollView}
                        contentContainerStyle={styles.goalsScroll}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: goalsScrollX } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                    >
                        {(data?.active_goals ?? []).map(goal => (
                            <View key={goal.id} style={styles.goalCardWrapper}>
                                <View style={styles.goalCard}>
                                    <View style={styles.goalCardTop}>
                                        <Text style={styles.goalTitle}>{goal.title}</Text>
                                        <Text style={styles.goalDeadline}>
                                            {new Date(goal.deadline).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}
                                        </Text>
                                    </View>
                                    <Text style={styles.goalAmounts}>
                                        {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                                    </Text>
                                    <View style={styles.progressTrack}>
                                        <View style={[styles.progressFill, { width: `${Math.min(goal.progress_pct, 100)}%` as any }]} />
                                    </View>
                                    <Text style={styles.goalPct}>{goal.progress_pct.toFixed(0)}%</Text>
                                </View>
                            </View>
                        ))}
                    </Animated.ScrollView>
                    {(data?.active_goals?.length ?? 0) > 1 && (
                        <View style={styles.dotsContainer}>
                            {(data?.active_goals ?? []).map((_, i) => {
                                const dotWidth = goalsScrollX.interpolate({
                                    inputRange: [(i - 1) * screenWidth, i * screenWidth, (i + 1) * screenWidth],
                                    outputRange: [6, 20, 6],
                                    extrapolate: 'clamp',
                                });
                                const dotOpacity = goalsScrollX.interpolate({
                                    inputRange: [(i - 1) * screenWidth, i * screenWidth, (i + 1) * screenWidth],
                                    outputRange: [0.3, 1, 0.3],
                                    extrapolate: 'clamp',
                                });
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => goalsScrollRef.current?.scrollTo({ x: i * screenWidth, animated: true })}
                                        style={styles.dotBtn}
                                    >
                                        <Animated.View style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]} />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* RECENT TRANSACTIONS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Akış</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/transact')}>
                            <Text style={styles.seeAllText}>Tümü</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.txCard}>
                        {(data?.recent_transactions ?? []).map((tx, idx, arr) => (
                            <View key={tx.id}>
                                <View style={styles.txItem}>
                                    <View style={styles.txIcon}>
                                        <Ionicons
                                            name={tx.type === 'INCOME' ? 'arrow-down-outline' : 'arrow-up-outline'}
                                            size={18}
                                            color={COLORS.primary}
                                        />
                                    </View>
                                    <View style={styles.txInfo}>
                                        <Text style={styles.txDesc}>{tx.description || tx.category_name}</Text>
                                        <Text style={styles.txDate}>{formatDate(tx.transaction_timestamp)}</Text>
                                    </View>
                                    <Text style={[styles.txAmount, { color: tx.type === 'INCOME' ? '#4CAF50' : '#F44336' }]}>
                                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </Text>
                                </View>
                                {idx < arr.length - 1 && <View style={styles.txSeparator} />}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
    errorText: { ...TYPOGRAPHY.bodyMd, color: COLORS.error },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerTitle: { ...TYPOGRAPHY.headlineMd, color: COLORS.textPrimary },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.textPrimary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerAvatarText: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 13, color: COLORS.white },

    scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 20 },

    balanceCard: {
        backgroundColor: COLORS.textPrimary,
        borderRadius: 24,
        padding: 28,
        gap: 8,
    },
    balanceLabel: {
        fontFamily: 'HankenGrotesk_500Medium',
        fontSize: 12,
        letterSpacing: 1.5,
        color: 'rgba(255,255,255,0.6)',
    },
    balanceAmount: { ...TYPOGRAPHY.numericXl, color: COLORS.white },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 4,
        backgroundColor: 'rgba(103,80,164,0.2)',
    },
    trendText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 13, color: COLORS.primary },

    actionsRow: { flexDirection: 'row', gap: 12 },
    actionCard: {
        flex: 1,
        borderRadius: 20,
        paddingVertical: 20,
        alignItems: 'center',
        gap: 10,
    },
    actionIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14 },

    section: { gap: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { ...TYPOGRAPHY.headlineMd, fontSize: 20, color: COLORS.textPrimary },
    seeAllText: { ...TYPOGRAPHY.labelMd, color: COLORS.primary },

    goalsScrollView: { marginHorizontal: -20 },
    goalsScroll: { paddingBottom: 8 },
    goalCardWrapper: { width: screenWidth, paddingHorizontal: 20 },
    goalCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        gap: 10,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    dotBtn: { padding: 4 },
    dot: { height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
    goalCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goalDeadline: {
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    goalTitle: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 18, color: COLORS.textPrimary },
    goalPct: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 13, color: COLORS.primary },
    progressTrack: {
        height: 5,
        backgroundColor: COLORS.surfaceContainerHigh,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: { height: 5, backgroundColor: COLORS.primary, borderRadius: 3 },
    goalAmounts: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: COLORS.textSecondary },

    txCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    txSeparator: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },
    txItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
    },
    txIcon: { width: 24, alignItems: 'center', justifyContent: 'center' },
    txInfo: { flex: 1, gap: 2 },
    txDesc: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 15, color: COLORS.textPrimary },
    txDate: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: COLORS.textSecondary },
    txAmount: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15 },
});
