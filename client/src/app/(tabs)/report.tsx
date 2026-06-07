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
import LoadingState from '../../components/tabs/LoadingState';
import ErrorState from '../../components/tabs/ErrorState';
import StatRow from '../../components/tabs/report/StatRow';
import CategoryBreakdownRow from '../../components/tabs/report/CategoryBreakdownRow';
import TopDayRow from '../../components/tabs/report/TopDayRow';

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
                    <LoadingState />
                ) : error ? (
                    <ErrorState error={error} />
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

                            <StatRow 
                                label="Tasarruf Oranı" 
                                value={`%${report.savings_rate.toFixed(1)}`} 
                            />

                            <StatRow 
                                label="Günlük Ortalama Harcama" 
                                value={formatCurrency(report.daily_avg_spend)} 
                            />

                            <StatRow 
                                label="En Büyük Harcama" 
                                value={formatCurrency(report.biggest_expense)} 
                            />


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
                                        <CategoryBreakdownRow
                                            key={idx}
                                            name={meta.tr}
                                            icon={meta.icon}
                                            percentage={cat.percentage}
                                            amountFormatted={formatCurrency(cat.amount)}
                                        />
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
                                    <TopDayRow
                                        key={idx}
                                        date={new Date(day.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                        amountFormatted={formatCurrency(day.amount)}
                                        isLast={idx === report.top_days.length - 1}
                                    />
                                ))
                            )}
                        </View>
                    </>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
