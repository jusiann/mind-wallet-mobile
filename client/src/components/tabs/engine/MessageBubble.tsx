import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/theme';
import { ChatMessage, useEngineStore } from '../../../store/useEngineStore';

interface Props {
    message: ChatMessage;
    styles: any;
}

export default function MessageBubble({ message, styles }: Props) {
    if (message.status === 'error') {
        return (
            <View style={[styles.msgRow, styles.msgRowMindy]}>
                <View style={styles.mindyAvatar}>
                    <Ionicons name="sparkles" size={13} color={COLORS.white} />
                </View>
                <View style={styles.bubbleCol}>
                    <View style={[styles.bubble, styles.bubbleMindy, { borderWidth: 1, borderColor: COLORS.error }]}>
                        <Text style={[styles.bubbleText, styles.bubbleTextMindy]}>{message.content}</Text>
                    </View>
                    <TouchableOpacity onPress={() => useEngineStore.getState().retryLastChat()}>
                        <Text style={{ color: COLORS.error, fontSize: 13, marginTop: 4 }}>
                            ↻ Tekrar Dene
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const getBubbleStyle = () => {
        if (message.role === 'user') return styles.bubbleUser;
        if (message.warning) return styles.bubbleWarning;
        if (message.classification === 'TRANSACTION') return styles.bubbleTransaction;
        if (message.classification?.includes('GOAL')) return styles.bubbleGoal;
        return styles.bubbleMindy;
    };

    const getTextStyle = () => {
        if (message.role === 'user') return styles.bubbleTextUser;
        if (message.warning) return styles.bubbleWarningText;
        if (message.classification === 'TRANSACTION') return styles.bubbleTransactionText;
        if (message.classification?.includes('GOAL')) return styles.bubbleGoalText;
        return styles.bubbleTextMindy;
    };

    const getAvatarStyle = () => {
        if (message.warning) return { backgroundColor: COLORS.warning };
        if (message.classification === 'TRANSACTION') return { backgroundColor: COLORS.info };
        if (message.classification?.includes('GOAL')) return { backgroundColor: COLORS.success };
        return { backgroundColor: COLORS.primary };
    };

    return (
        <View
            style={[
                styles.msgRow,
                message.role === 'user' ? styles.msgRowUser : styles.msgRowMindy,
            ]}
        >
            {message.role === 'mindy' && (
                <View style={[styles.mindyAvatar, getAvatarStyle()]}>
                    <Ionicons name="sparkles" size={13} color={COLORS.white} />
                </View>
            )}
            <View style={styles.bubbleCol}>
                <View style={[styles.bubble, getBubbleStyle()]}>
                    <Text style={[styles.bubbleText, getTextStyle()]}>
                        {message.content}
                    </Text>
                </View>
            </View>
        </View>
    );
}
