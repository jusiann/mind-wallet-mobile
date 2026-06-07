import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { Transaction } from '../../store/transactions';
import { useCurrency } from '../../hooks/useCurrency';

interface CatMeta {
    tr: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
}

interface Props {
    tx: Transaction;
    meta: CatMeta;
    onPress: () => void;
}

export default function TransactionRow({ tx, meta, onPress }: Props) {
    const { formatCurrencyShort } = useCurrency();
    const isIncome = tx.type === 'INCOME';

    return (
        <TouchableOpacity style={styles.txRow} onPress={onPress}>
            <View style={[styles.txIcon, isIncome && styles.txIconIncome]}>
                <Ionicons name={meta.icon} size={22} color={COLORS.textPrimary} />
            </View>
            <View style={styles.txInfo}>
                <Text style={styles.txDesc} numberOfLines={1}>
                    {meta.tr}
                </Text>
                {!!tx.description && <Text style={styles.txMeta}>{tx.description}</Text>}
            </View>
            <Text style={[styles.txAmount, isIncome ? styles.amountIncome : styles.amountExpense]}>
                {isIncome ? '+' : '-'}{formatCurrencyShort(parseFloat(String(tx.amount)))}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
        gap: 12,
    },
    txIcon: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    txIconIncome: {},
    txInfo: {
        flex: 1,
    },
    txDesc: {
        fontFamily: 'HankenGrotesk_500Medium',
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    txMeta: {
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    txAmount: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 15,
    },
    amountExpense: {
        color: '#E53935',
    },
    amountIncome: {
        color: '#2E7D32',
    },
});
