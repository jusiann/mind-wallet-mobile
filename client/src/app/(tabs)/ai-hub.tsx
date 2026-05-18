import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { pendingMessage } from '../../store/pendingMessage';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EngineButton, analyzeEngine } from '../../store/engine';
import { COLORS } from '../../constants/theme';
import styles from '../../assets/styles/ai-hub.styles';

interface ChatMessage {
    id: string;
    role: 'user' | 'mindy';
    content: string;
    buttons?: EngineButton[];
}

const SUGGESTIONS = [
    'Harcamalarımı analiz et',
    'Bu ay nasıl gidiyorum?',
    'Hedeflerime ne kadar kaldı?',
    'Tasarruf önerileri ver',
];

export default function MindyScreen() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
    const scrollRef = useRef<ScrollView>(null);
    const sendRef = useRef(send);

    useEffect(() => {
        sendRef.current = send;
    });

    useFocusEffect(
        useCallback(() => {
            const pending = pendingMessage.take();
            if (pending) setTimeout(() => sendRef.current?.(pending), 150);
            return () => {
                setMessages([]);
                setInput('');
                setActiveButtonId(null);
            };
        }, []),
    );

    async function send(
        text?: string,
        payload?: Record<string, unknown>,
        buttonId?: string,
    ) {
        if (!text?.trim() && !payload) return;
        if (loading) return;

        if (payload?.action === 'cancel' || payload?.action === 'done') {
            setMessages([]);
            setActiveButtonId(null);
            return;
        }

        if (buttonId) setActiveButtonId(buttonId);

        const historySnapshot = messages
            .map((m) => ({
                role: m.role === 'user' ? ('user' as const) : ('model' as const),
                content: m.content,
            }))
            .slice(-20);

        if (text?.trim()) {
            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), role: 'user', content: text.trim() },
            ]);
            setInput('');
        }

        setLoading(true);
        const res = await analyzeEngine({
            input: text?.trim() || undefined,
            history: historySnapshot,
            buttonPayload: payload,
        });
        if (res.success) {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'mindy',
                    content: res.data!.message,
                    buttons: res.data!.buttons ?? undefined,
                },
            ]);
        } else {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'mindy',
                    content: 'Bir hata oluştu. Lütfen tekrar dene.',
                },
            ]);
        }
        setActiveButtonId(null);
        setLoading(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }

    return (
        <SafeAreaView style={styles.safe} edges={[]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* MESSAGES */}
                <ScrollView
                    ref={scrollRef}
                    style={styles.flex}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
                    keyboardShouldPersistTaps='handled'
                >
                    {messages.length === 0 && (
                        <>
                            {/* WELCOME CARD */}
                            <View style={styles.welcomeCard}>
                                <Ionicons name='sparkles' size={32} color={COLORS.white} />
                                <Text style={styles.welcomeTitle}>
                                    Merhaba, ben{' '}
                                    <Text style={styles.welcomeTitleAccent}>Mindy</Text>
                                </Text>
                                <Text style={styles.welcomeText}>
                                    Finansal alışkanlıklarını analiz edip sana önerilerde bulunmak
                                    için buradayım. Ne hakkında konuşmak istersin?
                                </Text>
                            </View>

                            {/* SUGGESTIONS */}
                            <View style={styles.suggestionsWrap}>
                                {SUGGESTIONS.map((s) => (
                                    <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => send(s)}>
                                        <Text style={styles.suggestionText}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    {/* CHAT BUBBLES */}
                    {messages.map((msg) => (
                        <View
                            key={msg.id}
                            style={[
                                styles.msgRow,
                                msg.role === 'user' ? styles.msgRowUser : styles.msgRowMindy,
                            ]}
                        >
                            {msg.role === 'mindy' && (
                                <View style={styles.mindyAvatar}>
                                    <Ionicons name='sparkles' size={13} color={COLORS.white} />
                                </View>
                            )}
                            <View style={styles.bubbleCol}>
                                <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleMindy]}>
                                    <Text
                                        style={[
                                            styles.bubbleText,
                                            msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextMindy,
                                        ]}
                                    >
                                        {msg.content}
                                    </Text>
                                </View>
                                {msg.buttons && msg.buttons.length > 0 && (
                                    <View style={styles.buttonsWrap}>
                                        {msg.buttons.map((btn) => {
                                            const isActive = activeButtonId === btn.id;
                                            return (
                                                <TouchableOpacity
                                                    key={btn.id}
                                                    style={[styles.actionBtn, isActive && styles.actionBtnActive]}
                                                    onPress={() => send(undefined, btn.payload, btn.id)}
                                                    disabled={loading}
                                                >
                                                    <Text style={[styles.actionBtnText, isActive && styles.actionBtnTextActive]}>
                                                        {btn.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}

                    {/* TYPING INDICATOR */}
                    {loading && (
                        <View style={[styles.msgRow, styles.msgRowMindy]}>
                            <View style={styles.mindyAvatar}>
                                <Ionicons name='sparkles' size={13} color={COLORS.white} />
                            </View>
                            <View style={[styles.bubble, styles.bubbleMindy, styles.typingBubble]}>
                                <ActivityIndicator size='small' color={COLORS.primary} />
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* INPUT ROW */}
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.inputField}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Mindy'e sor..."
                        placeholderTextColor={COLORS.placeholderText}
                        multiline
                        maxLength={500}
                        returnKeyType='send'
                        submitBehavior='blurAndSubmit'
                        onSubmitEditing={() => send(input)}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                        onPress={() => send(input)}
                        disabled={!input.trim() || loading}
                    >
                        <Ionicons name='send' size={18} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
