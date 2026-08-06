import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { Goal, isGoalExpired } from '../../store/goals';
import { useCurrency } from '../../hooks/useCurrency';

interface Props {
    goal: Goal;
    onPress: () => void;
    pendingPledgeAmount?: number;
}

export default function GoalCard({ goal, onPress, pendingPledgeAmount = 0 }: Props) {
    const { formatCurrencyShort, formatCurrency } = useCurrency();
    const pct = Math.min(Number(goal.progress_pct), 100);
    const isCompleted = goal.status === 'COMPLETED';
    const isExpired = isGoalExpired(goal);

    return (
        <TouchableOpacity
            style={[styles.goalCard, isCompleted && styles.goalCardCompleted, isExpired && styles.goalCardExpired]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <View style={styles.goalHeader}>
                <View style={styles.goalHeaderContent}>
                    <Text style={styles.goalTitle} numberOfLines={1}>
                        {goal.title}
                    </Text>
                </View>

                <View style={styles.badgesWrap}>
                    <Text style={[styles.deadlineText, isExpired && styles.deadlineTextExpired]}>
                        Son tarih: {new Date(goal.deadline).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                    {isExpired && (
                        <View style={styles.expiredBadge}>
                            <Text style={styles.expiredBadgeText}>Süre Doldu</Text>
                        </View>
                    )}
                    {pendingPledgeAmount > 0 && (
                        <View style={styles.pledgeBadge}>
                            <Text style={styles.pledgeBadgeText}>
                                +{formatCurrency(pendingPledgeAmount)} söz
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.goalAmountsRow}>
                <View style={styles.goalAmountsLeft}>
                    <Text style={styles.goalCurrent}>{formatCurrencyShort(goal.current_amount)}</Text>
                    <Text style={styles.goalTarget}> / {formatCurrencyShort(goal.target_amount)}</Text>
                </View>
            </View>

            <View style={styles.progressTrack}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${pct}%` as any },
                        isCompleted && styles.progressFillCompleted,
                        isExpired && styles.progressFillExpired,
                    ]}
                />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    goalCard: {
        padding: 20,
        backgroundColor: COLORS.white,
    },
    goalCardCompleted: {
        backgroundColor: COLORS.white,
    },
    goalCardExpired: {
        backgroundColor: COLORS.white,
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    goalIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalIconWrapCompleted: {
        backgroundColor: '#43A047',
    },
    goalIconWrapExpired: {
        backgroundColor: '#E65100',
    },
    goalHeaderContent: {
        flex: 1,
        justifyContent: 'center',
    },
    goalTitle: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    deadlineText: {
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    deadlineTextExpired: {
        color: '#D32F2F',
    },
    badgesWrap: {
        alignItems: 'flex-end',
        gap: 6,
    },
    goalAmountsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    goalAmountsLeft: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    goalCurrent: {
        fontFamily: 'HankenGrotesk_700Bold',
        fontSize: 22,
        color: COLORS.textPrimary,
    },
    goalTarget: {
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    goalPct: {
        fontFamily: 'HankenGrotesk_700Bold',
        fontSize: 18,
        color: COLORS.primary,
    },
    goalPctCompleted: {
        color: '#43A047',
    },
    goalPctExpired: {
        color: '#E65100',
    },
    progressTrack: {
        height: 10,
        backgroundColor: COLORS.surfaceContainerHigh,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 5,
    },
    progressFillCompleted: {
        backgroundColor: '#43A047',
    },
    progressFillExpired: {
        backgroundColor: '#E65100',
    },
    expiredBadge: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    expiredBadgeText: {
        color: '#D32F2F',
        fontSize: 10,
        fontFamily: 'HankenGrotesk_600SemiBold',
    },
    pledgeBadge: {
        backgroundColor: COLORS.primaryContainer,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    pledgeBadgeText: {
        color: COLORS.primary,
        fontSize: 11,
        fontFamily: 'HankenGrotesk_600SemiBold',
    },
});
