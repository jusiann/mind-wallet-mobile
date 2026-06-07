import { Platform, StyleSheet } from 'react-native';

const createStyles = (COLORS: any) =>
    StyleSheet.create({
        safe: {
            flex: 1,
            backgroundColor: COLORS.background,
        },
        flex: {
            flex: 1,
        },
        messagesContent: {
            padding: 20,
            gap: 12,
            paddingBottom: 8,
        },
        welcomeCard: {
            backgroundColor: COLORS.textPrimary,
            borderRadius: 24,
            padding: 28,
            gap: 12,
            alignItems: 'flex-start',
            marginBottom: 4,
        },
        welcomeTitle: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 22,
            color: COLORS.white,
        },
        welcomeTitleAccent: {
            color: COLORS.primary,
        },
        welcomeText: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 14,
            lineHeight: 22,
            color: 'rgba(255,255,255,0.75)',
        },
        suggestionsWrap: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        suggestionChip: {
            backgroundColor: COLORS.primaryContainer,
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 7,
            flexDirection: 'row',
            alignItems: 'center',
        },
        suggestionText: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 13,
            color: COLORS.primary,
        },
        msgRow: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
        },
        msgRowUser: {
            justifyContent: 'flex-end',
        },
        msgRowMindy: {
            justifyContent: 'flex-start',
        },
        mindyAvatar: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        bubbleCol: {
            maxWidth: '80%',
            gap: 8,
        },
        bubble: {
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 10,
        },
        bubbleMindy: {
            backgroundColor: COLORS.primaryContainer,
            borderBottomLeftRadius: 4,
        },
        bubbleUser: {
            backgroundColor: COLORS.textPrimary,
            borderBottomRightRadius: 4,
        },
        bubbleText: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 15,
            lineHeight: 22,
        },
        bubbleTextMindy: {
            color: COLORS.onPrimaryContainer,
        },
        bubbleTransaction: {
            backgroundColor: COLORS.infoContainer,
            borderBottomLeftRadius: 4,
        },
        bubbleTransactionText: {
            color: COLORS.info,
        },
        bubbleGoal: {
            backgroundColor: COLORS.successContainer,
            borderBottomLeftRadius: 4,
        },
        bubbleGoalText: {
            color: COLORS.success,
        },
        bubbleWarning: {
            backgroundColor: COLORS.warningContainer,
            borderBottomLeftRadius: 4,
        },
        bubbleWarningText: {
            color: COLORS.warning,
        },
        bubbleTextUser: {
            color: COLORS.white,
        },
        typingBubble: {
            paddingHorizontal: 16,
            paddingVertical: 13,
        },
        buttonsWrap: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        actionBtn: {
            backgroundColor: COLORS.white,
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderWidth: 1.5,
            borderColor: COLORS.primary,
            flexShrink: 1,
            flexDirection: 'row',
            alignItems: 'center',
        },
        actionBtnActive: {
            backgroundColor: COLORS.primary,
        },
        actionBtnDisabled: {
            backgroundColor: COLORS.surfaceContainerHighest,
            borderColor: COLORS.surfaceContainerHighest,
        },
        actionBtnText: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 13,
            color: COLORS.primary,
            flexShrink: 1,
        },
        actionBtnTextActive: {
            color: COLORS.white,
        },
        actionBtnTextDisabled: {
            color: COLORS.placeholderText,
        },
        inputRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'android' ? 20 : 14,
            backgroundColor: COLORS.background,
        },
        inputField: {
            flex: 1,
            backgroundColor: COLORS.inputBackground,
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: Platform.OS === 'ios' ? 12 : 8,
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 15,
            color: COLORS.textPrimary,
            maxHeight: 100,
        },
        sendBtn: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        sendBtnDisabled: {
            backgroundColor: COLORS.surfaceContainerHighest,
        },
    });

export default createStyles;
