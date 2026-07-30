import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEngineStore } from '../../../store/useEngineStore';
import { getFirstName } from '../../../store/auth';
import MessageBubble from './MessageBubble';
import ActionCard from './ActionCard';
import TypingIndicator from './TypingIndicator';
import { COLORS } from '../../../constants/theme';
import { ENGINE_CHIPS } from '../../../constants/engine.chips';

interface Props {
    styles: any;
}

function getGreeting(): { text: string; icon: string } {
    const h = new Date().getHours();
    if (h >= 5 && h < 12)  return { text: 'Günaydın', icon: 'sunny-outline' };
    if (h >= 12 && h < 18) return { text: 'İyi günler', icon: 'partly-sunny-outline' };
    if (h >= 18 && h < 22) return { text: 'İyi akşamlar', icon: 'moon-outline' };
    return { text: 'İyi geceler', icon: 'cloudy-night-outline' };
}

export default function ChatContainer({ styles }: Props) {
    const scrollRef = useRef<ScrollView>(null);
    const { messages, isTyping, isActionPending, lockedMessageIds, selectedByMessage, sendChat, sendAction } = useEngineStore();

    const scrollToBottom = () => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages.length, isTyping]);

    const showSuggestions = messages.length === 0;

    const greeting = useMemo(() => getGreeting(), []);
    const firstName = useMemo(() => getFirstName(), []);

    return (
        <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
        >
            {showSuggestions && (
                <>
                    <View style={styles.welcomeCard}>
                        <View style={styles.welcomeHeaderRow}>
                            <Text style={styles.welcomeTitle}>
                                {greeting.text}{firstName ? `, ${firstName}` : ''}! {'\n'}
                                Ben <Text style={styles.welcomeTitleAccent}>Mindy</Text>
                            </Text>
                            <View style={styles.welcomeIconRow}>
                                <Ionicons name="sparkles" size={28} color={COLORS.white} />
                            </View>
                        </View>
                        <Text style={styles.welcomeText}>
                            Finansal alışkanlıklarını analiz edip sana önerilerde bulunmak
                            için buradayım. Ne hakkında konuşmak istersin?
                        </Text>
                    </View>

                    <View style={styles.suggestionsWrap}>
                        {ENGINE_CHIPS.map((chip) => (
                            <TouchableOpacity
                                key={chip.label}
                                style={styles.suggestionChip}
                                onPress={() => sendAction(chip.payload)}
                            >
                                {chip.icon && <Ionicons name={chip.icon as any} size={16} color={COLORS.primary} style={{ marginRight: 6 }} />}
                                <Text style={styles.suggestionText}>{chip.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}

            {messages.map((msg) => {
                const isLocked = lockedMessageIds.has(msg.id);
                return (
                    <View key={msg.id} style={{ gap: 8, marginBottom: 8 }}>
                        <MessageBubble message={msg} styles={styles} />
                        <ActionCard
                            buttons={msg.buttons || []}
                            classification={msg.classification || null}
                            warning={msg.warning}
                            messageId={msg.id}
                            isLocked={isLocked}
                            selectedButtonId={selectedByMessage[msg.id]}
                            onPress={sendAction}
                            isActionPending={isActionPending}
                            styles={styles}
                        />
                    </View>
                );
            })}

            {isTyping && <TypingIndicator styles={styles} />}
        </ScrollView>
    );
}
