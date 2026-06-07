import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import createStyles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';

interface Props {
    title: string;
    loading?: boolean;
    onPress: () => void;
    icon?: React.ComponentProps<typeof Ionicons>['name'];
    style?: StyleProp<ViewStyle>;
}

export default function AuthSubmitButton({ title, loading, onPress, icon = 'arrow-forward', style }: Props) {
    const styles = createStyles(COLORS);
    return (
        <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled, style]}
            onPress={onPress}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
                <>
                    <Text style={styles.submitButtonText}>{title}</Text>
                    {icon && <Ionicons name={icon} size={18} color={COLORS.white} />}
                </>
            )}
        </TouchableOpacity>
    );
}
