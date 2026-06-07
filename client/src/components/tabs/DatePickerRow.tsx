import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface Props {
    date: Date;
    isToday: boolean;
    onPressDate?: () => void;
}

export default function DatePickerRow({ date, isToday, onPressDate }: Props) {
    return (
        <View style={styles.dateRow}>
            <TouchableOpacity style={{ flex: 1 }} onPress={onPressDate} activeOpacity={0.7} disabled={!onPressDate}>
                <Text style={styles.dateText}>
                    {isToday
                        ? 'Bugün'
                        : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.surfaceContainerLow,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    dateArrow: {
        padding: 2,
    },
    dateText: {
        flex: 1,
        fontFamily: 'HankenGrotesk_500Medium',
        fontSize: 15,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
});
