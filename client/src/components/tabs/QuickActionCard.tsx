import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface Props {
    title: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    onPress: () => void;
    iconColor?: string;
}

export default function QuickActionCard({ title, icon, onPress, iconColor = COLORS.primary }: Props) {
    return (
        <TouchableOpacity style={styles.actionItem} onPress={onPress}>
            <Ionicons name={icon} size={20} color={iconColor} />
            <Text style={styles.actionText}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    actionItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    actionText: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 14,
        color: COLORS.textPrimary,
    },
});
