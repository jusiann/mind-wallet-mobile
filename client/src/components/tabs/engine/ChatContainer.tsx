import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEngineStore } from '../../../store/useEngineStore';
import { getFirstName } from '../../../store/auth';
import MessageBubble from './MessageBubble';
import ActionCard from './ActionCard';
import TypingIndicator from './TypingIndicator';
import { COLORS } from '../../../constants/theme';

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
            {messages.length === 0 && (
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
                        için buradayım. İşlem eklemek veya hedeflerini görmek için bana yazabilirsin.
                    </Text>
                </View>
            )}

            {messages.map((msg, index) => {
                const isLatestMessage = index === messages.length - 1;
                const isLocked = lockedMessageIds.has(msg.id) || !isLatestMessage;
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
