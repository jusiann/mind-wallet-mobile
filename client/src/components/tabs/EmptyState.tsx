import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface Props {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    hint: string;
}

export default function EmptyState({ icon, title, hint }: Props) {
    return (
        <View style={styles.emptyCard}>
            <Ionicons name={icon} size={32} color={COLORS.textSecondary} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptyHint}>{hint}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    emptyCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.inputBackground,
        borderStyle: 'dashed',
        marginHorizontal: 20,
    },
    emptyTitle: {
        fontFamily: 'HankenGrotesk_700Bold',
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    emptyHint: {
        fontFamily: 'HankenGrotesk_500Medium',
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});
