import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import createStyles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';

interface Props {
    children: React.ReactNode;
    header?: React.ReactNode;
}

export default function AuthScreenWrapper({ children, header }: Props) {
    const styles = createStyles(COLORS);
    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            {header}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {children}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
