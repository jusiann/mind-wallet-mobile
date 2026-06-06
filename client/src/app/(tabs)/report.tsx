import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMonthlyReport, MonthlyReport } from '../../store/report';
import { useCurrency } from '../../hooks/useCurrency';
import { COLORS } from '../../constants/theme';
import { CAT_META } from '../../constants/categories';
import createStyles from '../../assets/styles/report.styles';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function formatMonthYear(date: Date) {
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

function toYYYYMM(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

export default function ReportScreen() {
    const router = useRouter();
    const styles = createStyles(COLORS);
    const { symbol, formatCurrency } = useCurrency();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [report, setReport] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadReport = useCallback(async (date: Date) => {
        setLoading(true);
        setError('');
        const monthStr = toYYYYMM(date);
        const res = await getMonthlyReport(monthStr);
        if (res.success && res.data) {
            setReport(res.data);
        } else {
            setError(res.message || 'Rapor yüklenemedi.');
            setReport(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadReport(currentDate);
    }, [currentDate, loadReport]);

    function shiftMonth(delta: number) {
        const d = new Date(currentDate);
        d.setMonth(d.getMonth() + delta);
        setCurrentDate(d);
    }

    const renderTrendIcon = (pct: number, inverted = false) => {
        if (pct === 0) return <Ionicons name="remove" size={16} color={COLORS.textSecondary} style={styles.trendIcon} />;
        const isPositive = pct > 0;
        const isGood = inverted ? !isPositive : isPositive;
        const color = isGood ? '#2E7D32' : '#E53935';
        const iconName = isPositive ? 'trending-up' : 'trending-down';
        return <Ionicons name={iconName} size={16} color={color} style={styles.trendIcon} />;
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name='arrow-back' size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Aylık Rapor</Text>
                <View style={styles.spacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* DATE SELECTOR */}
                <View style={styles.monthSelector}>
                    <TouchableOpacity style={styles.monthArrow} onPress={() => shiftMonth(-1)}>
                        <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.monthText}>{formatMonthYear(currentDate)}</Text>
                    <TouchableOpacity style={styles.monthArrow} onPress={() => shiftMonth(1)}>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : error ? (
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>{error}</Text>
                    </View>
                ) : report ? (
                    <>
                        {/* SUMMARY CARD */}
                        <View style={styles.card}>
                            <View style={styles.netBox}>
                                <Text style={styles.netLabel}>Net Durum</Text>
                                <Text style={styles.netValue}>
                                    {report.net_income > 0 ? '+' : ''}{formatCurrency(report.net_income)}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <View style={styles.summaryBox}>
                                    <Text style={styles.summaryLabel}>Toplam Gelir</Text>
                                    <Text style={[styles.summaryValue, styles.incomeValue]}>
                                        +{formatCurrency(report.total_income)}
                                    </Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.summaryBox}>
                                    <Text style={styles.summaryLabel}>Toplam Gider</Text>
                                    <Text style={[styles.summaryValue, styles.expenseValue]}>
                                        -{formatCurrency(report.total_expense)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* STATS CARD */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Özet İstatistikler</Text>

                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Tasarruf Oranı</Text>
                                <View style={styles.statValueBox}>
                                    <Text style={styles.statValue}>%{report.savings_rate.toFixed(1)}</Text>
                                </View>
                            </View>

                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Gelir Değişimi (Geçen Aya Göre)</Text>
                                <View style={styles.statValueBox}>
                                    <Text style={styles.statValue}>
                                        {report.comparison.income_change_pct > 0 ? '+' : ''}
                                        {report.comparison.income_change_pct.toFixed(1)}%
                                    </Text>
                                    {renderTrendIcon(report.comparison.income_change_pct)}
                                </View>
                            </View>

                            <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
                                <Text style={styles.statLabel}>Gider Değişimi (Geçen Aya Göre)</Text>
                                <View style={styles.statValueBox}>
                                    <Text style={styles.statValue}>
                                        {report.comparison.expense_change_pct > 0 ? '+' : ''}
                                        {report.comparison.expense_change_pct.toFixed(1)}%
                                    </Text>
                                    {renderTrendIcon(report.comparison.expense_change_pct, true)}
                                </View>
                            </View>
                        </View>

                        {/* CATEGORY BREAKDOWN */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Harcama Dağılımı</Text>
                            {report.category_breakdown.length === 0 ? (
                                <Text style={styles.emptyText}>Bu ay hiç harcama kaydı yok.</Text>
                            ) : (
                                report.category_breakdown.map((cat, idx) => {
                                    const meta = CAT_META[cat.category_name] ?? { tr: cat.category_name, icon: 'wallet-outline' as IoniconName };
                                    return (
                                        <View key={idx} style={styles.catRow}>
                                            <View style={styles.iconBox}>
                                                <Ionicons name={meta.icon} size={20} color={COLORS.primary} />
                                            </View>
                                            <View style={styles.catInfo}>
                                                <View style={styles.catHeader}>
                                                    <Text style={styles.catName}>{meta.tr} (%{cat.percentage.toFixed(0)})</Text>
                                                    <Text style={styles.catAmount}>{formatCurrency(cat.amount)}</Text>
                                                </View>
                                                <View style={styles.catBarBg}>
                                                    <View style={[styles.catBarFill, { width: `${cat.percentage}%` }]} />
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>

                        {/* TOP DAYS */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>En Çok Harcama Yapılan Günler</Text>
                            {report.top_days.length === 0 ? (
                                <Text style={styles.emptyText}>Bu ay hiç harcama kaydı yok.</Text>
                            ) : (
                                report.top_days.map((day, idx) => (
                                    <View key={idx} style={[styles.topDayRow, idx === report.top_days.length - 1 && { borderBottomWidth: 0 }]}>
                                        <Text style={styles.topDayDate}>
                                            {new Date(day.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                        </Text>
                                        <Text style={styles.topDayAmount}>-{formatCurrency(day.amount)}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
