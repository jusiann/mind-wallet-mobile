import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEngineStore } from '../../../store/useEngineStore';
import { COLORS } from '../../../constants/theme';

interface Props {
    styles: any;
}

export default function ChatInput({ styles }: Props) {
    const [input, setInput] = useState('');
    const { sendChat, isTyping, isActionPending } = useEngineStore();

    const handleSend = () => {
        if (!input.trim() || isTyping || isActionPending) return;
        sendChat(input);
        setInput('');
        // Keyboard will stay open because we don't call Keyboard.dismiss()
    };

    return (
        <View style={styles.inputRow}>
            <TextInput
                style={styles.inputField}
                value={input}
                onChangeText={setInput}
                placeholder="Mindy'e sor..."
                placeholderTextColor={COLORS.placeholderText}
                multiline
                maxLength={500}
                returnKeyType="default"
                editable={true} // Keep editable true so keyboard doesn't dismiss
            />
            <TouchableOpacity
                style={[
                    styles.sendBtn,
                    (!input.trim() || isTyping || isActionPending) && styles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!input.trim() || isTyping || isActionPending}
            >
                <Ionicons name="send" size={18} color={COLORS.white} />
            </TouchableOpacity>
        </View>
    );
}
