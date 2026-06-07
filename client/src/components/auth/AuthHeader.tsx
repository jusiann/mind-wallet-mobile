import React from 'react';
import { View, Text } from 'react-native';
import createStyles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';

interface Props {
    title: string;
    subtitle: string;
}

export default function AuthHeader({ title, subtitle }: Props) {
    const styles = createStyles(COLORS);
    return (
        <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
}
