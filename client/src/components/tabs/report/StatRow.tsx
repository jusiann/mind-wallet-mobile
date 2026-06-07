import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/theme';

interface Props {
    label: string;
    value: string;
    trendPct?: number;
    invertedTrend?: boolean;
}

export default function StatRow({ label, value, trendPct, invertedTrend = false }: Props) {
    const renderTrendIcon = () => {
        if (trendPct === undefined) return null;
        if (trendPct === 0) return <Ionicons name="remove" size={16} color={COLORS.textSecondary} style={styles.trendIcon} />;
        const isPositive = trendPct > 0;
        const isGood = invertedTrend ? !isPositive : isPositive;
        const color = isGood ? '#2E7D32' : '#E53935';
        const iconName = isPositive ? 'trending-up' : 'trending-down';
        return <Ionicons name={iconName} size={16} color={color} style={styles.trendIcon} />;
    };

    return (
        <View style={styles.statRow}>
            <Text style={styles.statLabel}>{label}</Text>
            <View style={styles.statValueBox}>
                <Text style={styles.statValue}>{value}</Text>
                {renderTrendIcon()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    statLabel: {
        fontFamily: 'HankenGrotesk_500Medium',
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    statValueBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    trendIcon: {
        marginLeft: 4,
    },
});
