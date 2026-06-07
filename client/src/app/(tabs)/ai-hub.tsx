import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import createStyles from '../../assets/styles/ai-hub.styles';
import { COLORS } from '../../constants/theme';
import { useEngineStore } from '../../store/useEngineStore';
import ChatContainer from '../../components/tabs/engine/ChatContainer';
import ChatInput from '../../components/tabs/engine/ChatInput';

export default function MindyScreen() {
    const styles = createStyles(COLORS);
    const { sendChat, resetConversation, takePendingChat } = useEngineStore();

    useFocusEffect(
        useCallback(() => {
            const pending = takePendingChat();
            if (pending) setTimeout(() => sendChat(pending), 150);
            return () => resetConversation();
        }, [])
    );

    return (
        <SafeAreaView style={styles.safe} edges={[]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
            >
                <ChatContainer styles={styles} />
                <ChatInput styles={styles} />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

