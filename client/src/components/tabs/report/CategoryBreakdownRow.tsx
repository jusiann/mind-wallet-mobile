import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/theme';

interface Props {
    name: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    percentage: number;
    amountFormatted: string;
}

export default function CategoryBreakdownRow({ name, icon, percentage, amountFormatted }: Props) {
    return (
        <View style={styles.catRow}>
            <View style={styles.iconBox}>
                <Ionicons name={icon} size={22} color={COLORS.textPrimary} />
            </View>
            <View style={styles.catInfo}>
                <View style={styles.catHeader}>
                    <Text style={styles.catName}>{name} (%{percentage.toFixed(0)})</Text>
                    <Text style={styles.catAmount}>{amountFormatted}</Text>
                </View>
                <View style={styles.catBarBg}>
                    <View style={[styles.catBarFill, { width: `${percentage}%` }]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    catInfo: {
        flex: 1,
        marginLeft: 12,
    },
    catHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    catName: {
        fontFamily: 'HankenGrotesk_500Medium',
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    catAmount: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    catBarBg: {
        height: 6,
        backgroundColor: COLORS.inputBackground,
        borderRadius: 3,
        overflow: 'hidden',
    },
    catBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
});
