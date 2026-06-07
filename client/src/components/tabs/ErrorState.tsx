import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Props {
    error: string;
}

export default function ErrorState({ error }: Props) {
    if (!error) return null;
    return (
        <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 14,
        color: COLORS.error,
        textAlign: 'center',
    },
});
