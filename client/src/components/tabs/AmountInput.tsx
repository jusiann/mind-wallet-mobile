import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Props {
    symbol: string;
    value: string;
    onChangeText: (text: string) => void;
    onEndEditing: () => void;
}

export default function AmountInput({ symbol, value, onChangeText, onEndEditing }: Props) {
    return (
        <View style={styles.amountRow}>
            <Text style={styles.amountSymbol}>{symbol}</Text>
            <TextInput
                style={styles.amountInput}
                value={value}
                onChangeText={onChangeText}
                onEndEditing={onEndEditing}
                placeholder="0,00"
                placeholderTextColor={COLORS.border}
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={12}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 20,
    },
    amountSymbol: {
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 32,
        color: COLORS.textSecondary,
    },
    amountInput: {
        fontFamily: 'HankenGrotesk_700Bold',
        fontSize: 48,
        color: COLORS.textPrimary,
        minWidth: 120,
        textAlign: 'center',
    },
});
