import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EngineButton, useEngineStore } from '../../../store/useEngineStore';
import { COLORS } from '../../../constants/theme';

interface Props {
    buttons: EngineButton[];
    classification: string | null;
    warning: string | null | undefined;
    messageId: string;
    isLocked: boolean;
    selectedButtonId: string | undefined;
    onPress: (payload: Record<string, unknown>, buttonId: string, msgId: string) => void;
    isActionPending: boolean;
    styles: any;
}

const AGENT_THEMES: Record<string, { borderColor: string; activeColor: string; icon: any }> = {
    TRANSACTION:        { borderColor: COLORS.info, activeColor: COLORS.info, icon: 'swap-horizontal' },
    GOAL_CREATION:      { borderColor: COLORS.success, activeColor: COLORS.success, icon: 'flag' },
    GOAL_CONTRIBUTION:  { borderColor: COLORS.success, activeColor: COLORS.success, icon: 'flag' },
    GOAL_STATUS:        { borderColor: COLORS.success, activeColor: COLORS.success, icon: 'flag' },
    ANALYSIS:           { borderColor: COLORS.primary, activeColor: COLORS.primary, icon: 'analytics' },
};

export default function ActionCard({
    buttons,
    classification,
    warning,
    messageId,
    isLocked,
    selectedButtonId,
    onPress,
    isActionPending,
    styles,
}: Props) {
    const { pendingActionSourceId } = useEngineStore();

    if (!buttons || buttons.length === 0) return null;

    let theme = AGENT_THEMES[classification || ''] || AGENT_THEMES.ANALYSIS;
    if (warning) {
        theme = { borderColor: COLORS.warning, activeColor: COLORS.warning, icon: 'warning' };
    }

    return (
        <View style={styles.buttonsWrap}>
            {buttons.map((btn) => {
                const isSelected = selectedButtonId === btn.id;
                const showDisabled = isLocked && !isSelected;
                const pendingThis = isActionPending && isSelected && (pendingActionSourceId === messageId);

                return (
                    <TouchableOpacity
                        key={btn.id}
                        style={[
                            styles.actionBtn,
                            { borderColor: theme.borderColor },
                            isSelected && { backgroundColor: theme.activeColor },
                            showDisabled && styles.actionBtnDisabled,
                        ]}
                        onPress={() => onPress(btn.payload, btn.id, messageId)}
                        disabled={isLocked || isActionPending}
                    >
                        {pendingThis ? (
                            <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 4 }} />
                        ) : null}
                        {!pendingThis && isSelected ? (
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
                        ) : !pendingThis && btn.icon ? (
                            <Ionicons name={btn.icon as any} size={14} color={showDisabled ? COLORS.placeholderText : theme.activeColor} style={{ marginRight: 4 }} />
                        ) : null}
                        <Text
                            style={[
                                styles.actionBtnText,
                                { color: theme.activeColor },
                                isSelected && styles.actionBtnTextActive,
                                showDisabled && styles.actionBtnTextDisabled,
                            ]}
                        >
                            {btn.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
