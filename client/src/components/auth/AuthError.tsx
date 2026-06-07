import React from 'react';
import { View, Text } from 'react-native';
import createStyles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';

interface Props {
    error: string;
}

export default function AuthError({ error }: Props) {
    const styles = createStyles(COLORS);
    if (!error) return null;
    return (
        <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
        </View>
    );
}
