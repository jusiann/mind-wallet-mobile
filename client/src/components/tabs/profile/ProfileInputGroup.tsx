import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/theme';

interface Props {
    label: string;
    value: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    editable?: boolean;
}

export default function ProfileInputGroup({ label, value, onChangeText, placeholder, autoCapitalize, editable = true }: Props) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, !editable && styles.inputDisabled]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={COLORS.placeholderText}
                autoCapitalize={autoCapitalize}
                editable={editable}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.surfaceContainerLow,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    inputDisabled: {
        color: COLORS.textSecondary,
        backgroundColor: COLORS.background,
    },
});
