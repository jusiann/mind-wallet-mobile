import { StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

export default StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingVertical: 32,
        justifyContent: 'center',
    },

    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingTop: 28,
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    logoText: {
        fontFamily: 'HankenGrotesk_700Bold',
        fontSize: 34,
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },

    header: {
        alignItems: 'center',
        marginBottom: 28,
    },
    title: {
        fontFamily: 'HankenGrotesk_700Bold',
        fontSize: 34,
        lineHeight: 42,
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        ...TYPOGRAPHY.bodyMd,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },

    card: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 24,
        padding: 24,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 24,
        gap: 16,
    },

    inputGroup: {
        gap: 6,
    },
    inputLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inputLabel: {
        fontFamily: 'HankenGrotesk_500Medium',
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    forgotPasswordLink: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 13,
        color: COLORS.textPrimary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 54,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 16,
        color: COLORS.textPrimary,
        height: 54,
    },
    eyeButton: {
        padding: 4,
        marginLeft: 8,
    },

    submitButton: {
        backgroundColor: COLORS.black,
        borderRadius: 14,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 4,
    },
    submitButtonText: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 16,
        color: COLORS.white,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },

    // email + send button row (forgot-password ekranı)
    inputRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    inputRowInput: {
        flex: 1,
    },
    sendButton: {
        width: 54,
        height: 54,
        borderRadius: 14,
        backgroundColor: COLORS.black,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    sendButtonSent: {
        backgroundColor: COLORS.primary,
    },

    errorBox: {
        backgroundColor: COLORS.errorContainer,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    errorText: {
        fontFamily: 'HankenGrotesk_500Medium',
        fontSize: 13,
        color: COLORS.error,
        textAlign: 'center',
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        ...TYPOGRAPHY.bodyMd,
        color: COLORS.textSecondary,
    },
    footerLink: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 16,
        color: COLORS.textPrimary,
    },
});
