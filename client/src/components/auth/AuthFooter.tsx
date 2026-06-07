import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import createStyles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';

interface Props {
    text: string;
    linkText: string;
    onPress: () => void;
    isBack?: boolean;
}

export default function AuthFooter({ text, linkText, onPress, isBack }: Props) {
    const styles = createStyles(COLORS);
    
    if (isBack) {
        return (
            <TouchableOpacity style={styles.footer} onPress={onPress}>
                <Ionicons name="arrow-back-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.footerText}>{text}</Text>
            </TouchableOpacity>
        );
    }
    
    return (
        <View style={styles.footer}>
            <Text style={styles.footerText}>{text}</Text>
            <TouchableOpacity onPress={onPress}>
                <Text style={styles.footerLink}>{linkText}</Text>
            </TouchableOpacity>
        </View>
    );
}
