import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/theme';

interface Props {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    show: boolean;
    onToggleShow: () => void;
    keyboardType?: 'default' | 'numeric';
    maxLength?: number;
}

export default function ProfilePasswordInput({ label, value, onChangeText, placeholder, show, onToggleShow, keyboardType = 'default', maxLength }: Props) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputRow}>
                <TextInput
                    style={[styles.input, styles.inputInRow]}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!show}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.placeholderText}
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={onToggleShow} style={styles.eyeBtn}>
                    <Ionicons
                        name={show ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </View>
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
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceContainerLow,
        borderRadius: 14,
    },
    input: {
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 15,
        color: COLORS.textPrimary,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    inputInRow: {
        flex: 1,
    },
    eyeBtn: {
        padding: 14,
    },
});
