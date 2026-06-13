import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { DashboardData, getDashboard } from '../../store/dashboard';
import { CategorySpend, fetchMonthlyExpensesByCategory } from '../../store/transactions';
import { translateCat } from '../../constants/categories';
import { COLORS } from '../../constants/theme';
import { getUserInitials } from '../../store/auth';
import { useEngineStore } from '../../store/useEngineStore';
import createStyles, { SCREEN_WIDTH, CHART_COLORS, CHART_SIZE, OUTER_R, INNER_R } from '../../assets/styles/dashboard.styles';
import { useCurrency } from '../../hooks/useCurrency';
import LoadingState from '../../components/tabs/LoadingState';
import ErrorState from '../../components/tabs/ErrorState';

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(startAngle: number, endAngle: number): string {
    const cx = CHART_SIZE / 2;
    const cy = CHART_SIZE / 2;
    if (endAngle - startAngle >= 360) endAngle = startAngle + 359.99;
    const os  = polarToCartesian(cx, cy, OUTER_R, startAngle);
    const oe  = polarToCartesian(cx, cy, OUTER_R, endAngle);
    const is_ = polarToCartesian(cx, cy, INNER_R, startAngle);
    const ie  = polarToCartesian(cx, cy, INNER_R, endAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return [
        `M ${os.x} ${os.y}`,
        `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${oe.x} ${oe.y}`,
        `L ${ie.x} ${ie.y}`,
        `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${is_.x} ${is_.y}`,
        'Z',
    ].join(' ');
}



function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function DashboardScreen() {
    const router     = useRouter();
    const navigation = useNavigation();
    const styles = createStyles(COLORS);
    const { formatCurrency, formatCurrencyShort } = useCurrency();

    const [data, setData]               = useState<DashboardData | null>(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [initials, setInitials]       = useState(getUserInitials());
    const [categorySpend, setCategorySpend] = useState<CategorySpend[]>([]);

    const topScrollRef  = useRef<ScrollView>(null);
    const topScrollX    = useRef(new Animated.Value(0)).current;
    const goalsScrollRef = useRef<ScrollView>(null);
    const goalsScrollX   = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => router.push('/(tabs)/profile' as any)} style={styles.headerAvatar}>
                    <Text style={styles.headerAvatarText}>{initials}</Text>
                </TouchableOpacity>
            ),
        });
    }, [initials]);

    const isLoaded = useRef(false);
    useFocusEffect(
        useCallback(() => {
            const shouldRefresh = useEngineStore.getState().consumeRefresh();
            setInitials(getUserInitials());
            
            if (shouldRefresh || !isLoaded.current) {
                isLoaded.current = true;
                Promise.all([getDashboard(), fetchMonthlyExpensesByCategory()]).then(
                    ([dashRes, spendRes]) => {
                        if (dashRes.success) {
                            setData(dashRes.data!);
                            setError('');
                        } else {
                            setError(dashRes.message ?? 'Yüklenemedi.');
                        }
                        if (spendRes.success && spendRes.data) setCategorySpend(spendRes.data);
                        setLoading(false);
                    },
                );
            }
        }, []),
    );

    const spendTotal = categorySpend.reduce((s, c) => s + c.amount, 0);
    let _angle = 0;
    const spendSlices = categorySpend.slice(0, CHART_COLORS.length).map((cat, i) => {
        const sweep = spendTotal > 0 ? (cat.amount / spendTotal) * 360 : 0;
        const path  = donutSlicePath(_angle, _angle + sweep);
        _angle += sweep;
        return { path, color: CHART_COLORS[i] };
    });

    return (
        <SafeAreaView style={styles.safe} edges={[]}>
            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState error={error} />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* TOP CARDS SCROLL */}
                    <View style={styles.topSection}>
                        <Animated.ScrollView
                            ref={topScrollRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={styles.topScrollView}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { x: topScrollX } } }],
                                { useNativeDriver: false },
                            )}
                            scrollEventThrottle={16}
                        >
                            {/* SLIDE 1 — BALANCE CARD */}
                            <View style={styles.topCardWrapper}>
                                <View style={styles.balanceCard}>
                                    <View style={styles.balanceTop}>
                                        <Text style={styles.balanceLabel}>BAKİYE</Text>
                                        <Text style={styles.balanceAmount}>
                                            {formatCurrency(data?.total_balance ?? 0)}
                                        </Text>
                                    </View>
                                    <View style={styles.cardBottomRow}>
                                        <View style={styles.trendBadge}>
                                            <Ionicons
                                                name={
                                                    (data?.monthly_stats?.expense_vs_last_month_pct ?? 0) <= 0
                                                        ? 'trending-down-outline'
                                                        : 'trending-up-outline'
                                                }
                                                size={14}
                                                color={COLORS.primary}
                                            />
                                            <Text style={styles.trendText}>
                                                %{Math.abs(data?.monthly_stats?.expense_vs_last_month_pct ?? 0).toFixed(1)} Son 30 gün
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.mindyBtn}
                                            onPress={() => {
                                                useEngineStore.getState().setPendingChat('Bu ayki finansal durumumu analiz et ve önerilerini paylaş.');
                                                router.push('/(tabs)/ai-hub');
                                            }}
                                        >
                                            <Ionicons name='sparkles' size={13} color={COLORS.white} />
                                            <Text style={styles.mindyBtnText}>Mindy'e Sor</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* SLIDE 2 — CHART CARD */}
                            <View style={styles.topCardWrapper}>
                                <View style={styles.chartCard}>
                                    {categorySpend.length === 0 ? (
                                        <Text style={styles.chartEmpty}>Bu ay henüz harcama yok.</Text>
                                    ) : (
                                        <View style={styles.chartCardRow}>
                                            {/* DONUT CHART */}
                                            <View style={styles.chartPieWrap}>
                                                <Svg width={CHART_SIZE} height={CHART_SIZE}>
                                                    {spendSlices.map((s, i) => (
                                                        <Path key={i} d={s.path} fill={s.color} />
                                                    ))}
                                                </Svg>
                                                <View style={styles.chartPieCenter}>
                                                    <Text style={styles.chartPieCenterAmt}>
                                                        {formatCurrencyShort(spendTotal)}
                                                    </Text>
                                                    <Text style={styles.chartPieCenterLbl}>gider</Text>
                                                </View>
                                            </View>

                                            {/* CATEGORY LIST */}
                                            <View style={styles.chartCatList}>
                                                {categorySpend.slice(0, 5).map((cat, i) => (
                                                    <View key={cat.rawName} style={styles.chartCatRow}>
                                                        <View style={[styles.chartCatDot, { backgroundColor: CHART_COLORS[i] }]} />
                                                        <Text style={styles.chartCatName} numberOfLines={1}>{cat.name}</Text>
                                                        <Text style={styles.chartCatAmt}>{formatCurrencyShort(cat.amount)}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </Animated.ScrollView>

                        {/* DOTS */}
                        <View style={styles.dotsContainer}>
                            {[0, 1].map((i) => {
                                const range = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
                                const dotWidth = topScrollX.interpolate({
                                    inputRange: range, outputRange: [6, 20, 6], extrapolate: 'clamp',
                                });
                                const dotOpacity = topScrollX.interpolate({
                                    inputRange: range, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp',
                                });
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => topScrollRef.current?.scrollTo({ x: i * SCREEN_WIDTH, animated: true })}
                                        style={styles.dotBtn}
                                    >
                                        <Animated.View style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]} />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* QUICK ACTIONS */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.actionCard, styles.actionCardExpense]}
                            onPress={() => router.push({ pathname: '/(tabs)/transact', params: { openAs: 'EXPENSE' } })}
                        >
                            <View style={styles.actionIconCircle}>
                                <Ionicons name='arrow-up-outline' size={22} color={COLORS.primary} />
                            </View>
                            <Text style={[styles.actionLabel, { color: COLORS.white }]}>Harcama</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionCard, styles.actionCardIncome]}
                            onPress={() => router.push({ pathname: '/(tabs)/transact', params: { openAs: 'INCOME' } })}
                        >
                            <View style={styles.actionIconCircle}>
                                <Ionicons name='arrow-down-outline' size={22} color={COLORS.primary} />
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
                        <View style={styles.topSection}>
                            <Animated.ScrollView
                                ref={goalsScrollRef}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                style={styles.goalsScrollView}
                                contentContainerStyle={styles.goalsScroll}
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { x: goalsScrollX } } }],
                                    { useNativeDriver: false },
                                )}
                                scrollEventThrottle={16}
                            >
                                {(data?.active_goals ?? []).map((goal) => (
                                    <View key={goal.id} style={styles.goalCardWrapper}>
                                        <View style={styles.goalCard}>
                                            <View style={styles.goalCardTop}>
                                                <Text style={styles.goalTitle}>{goal.title}</Text>
                                                <Text style={styles.goalDeadline}>
                                                    {new Date(goal.deadline).toLocaleDateString('tr-TR', {
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </Text>
                                            </View>
                                            <Text style={styles.goalAmounts}>
                                                {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                                            </Text>
                                            <View style={styles.progressTrack}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        { width: `${Math.min(goal.progress_pct, 100)}%` as any },
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.goalPct}>%{goal.progress_pct.toFixed(0)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </Animated.ScrollView>
                            {(data?.active_goals?.length ?? 0) > 1 && (
                                <View style={styles.dotsContainer}>
                                    {(data?.active_goals ?? []).map((_, i) => {
                                        const range = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
                                        const dotWidth = goalsScrollX.interpolate({
                                            inputRange: range, outputRange: [6, 20, 6], extrapolate: 'clamp',
                                        });
                                        const dotOpacity = goalsScrollX.interpolate({
                                            inputRange: range, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp',
                                        });
                                        return (
                                            <TouchableOpacity
                                                key={i}
                                                onPress={() => goalsScrollRef.current?.scrollTo({ x: i * SCREEN_WIDTH, animated: true })}
                                                style={styles.dotBtn}
                                            >
                                                <Animated.View style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]} />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* RECENT TRANSACTIONS */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>İşlemler</Text>
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
                                                color={COLORS.textPrimary}
                                            />
                                        </View>
                                        <View style={styles.txInfo}>
                                            <Text style={styles.txDesc}>{translateCat(tx.category_name)}</Text>
                                            <Text style={styles.txDate}>{formatDate(tx.transaction_timestamp)}</Text>
                                        </View>
                                        <Text
                                            style={[
                                                styles.txAmount,
                                                tx.type === 'INCOME' ? styles.txAmountIncome : styles.txAmountExpense,
                                            ]}
                                        >
                                            {tx.type === 'INCOME' ? '+' : '-'}
                                            {formatCurrency(tx.amount)}
                                        </Text>
                                    </View>
                                    {idx < arr.length - 1 && <View style={styles.txSeparator} />}
                                </View>
                            ))}
                        </View>
                    </View>

                </ScrollView>
            )}
        </SafeAreaView>
    );
}
