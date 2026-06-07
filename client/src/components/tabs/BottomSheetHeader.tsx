import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Props {
    title: string;
}

export default function BottomSheetHeader({ title }: Props) {
    return (
        <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    modalHeader: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        paddingTop: 0,
    },
    modalTitle: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 17,
        color: COLORS.textPrimary,
    },
});
