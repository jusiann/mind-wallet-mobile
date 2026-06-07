import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/theme';

interface Props {
    date: string;
    amountFormatted: string;
    isLast?: boolean;
}

export default function TopDayRow({ date, amountFormatted, isLast = false }: Props) {
    return (
        <View style={[styles.topDayRow, isLast && { borderBottomWidth: 0 }]}>
            <Text style={styles.topDayDate}>{date}</Text>
            <Text style={styles.topDayAmount}>-{amountFormatted}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    topDayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.inputBackground,
    },
    topDayDate: {
        fontFamily: 'HankenGrotesk_500Medium',
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    topDayAmount: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 15,
        color: '#E53935',
    },
});
