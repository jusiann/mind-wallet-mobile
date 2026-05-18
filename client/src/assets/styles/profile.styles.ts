import { StyleSheet } from 'react-native';

const createStyles = (COLORS: any) =>
    StyleSheet.create({
        safe: {
            flex: 1,
            backgroundColor: COLORS.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        backBtn: {
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerTitle: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 18,
            lineHeight: 32,
            letterSpacing: 0,
            color: COLORS.textPrimary,
        },
        scroll: {
            padding: 20,
            gap: 16,
            paddingBottom: 20,
        },
        avatarSection: {
            alignItems: 'center',
            gap: 8,
            paddingVertical: 8,
        },
        avatar: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: COLORS.textPrimary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        avatarText: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 30,
            color: COLORS.white,
        },
        userName: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 20,
            color: COLORS.textPrimary,
        },
        userEmail: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 14,
            color: COLORS.textSecondary,
        },
        card: {
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 20,
            gap: 14,
            shadowColor: COLORS.black,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        },
        cardTitle: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 16,
            color: COLORS.textPrimary,
        },
        inputGroup: {
            gap: 6,
        },
        label: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 13,
            color: COLORS.textSecondary,
        },
        input: {
            backgroundColor: COLORS.inputBackground,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 15,
            color: COLORS.textPrimary,
        },
        inputDisabled: {
            color: COLORS.placeholderText,
        },
        inputRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: COLORS.inputBackground,
            borderRadius: 12,
        },
        inputInRow: {
            flex: 1,
            backgroundColor: 'transparent',
        },
        eyeBtn: {
            paddingHorizontal: 12,
            paddingVertical: 10,
        },
        msg: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 13,
        },
        msgSuccess: {
            color: '#4CAF50',
        },
        msgError: {
            color: COLORS.error,
        },
        btn: {
            backgroundColor: COLORS.textPrimary,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
        },
        btnDisabled: {
            opacity: 0.6,
        },
        btnText: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 15,
            color: COLORS.white,
        },
        bottomActionsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        logoutBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 4,
            paddingVertical: 10,
        },
        logoutText: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 14,
            color: COLORS.error,
        },
        deleteAccountToggle: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 10,
            paddingHorizontal: 4,
        },
        deleteAccountToggleText: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 14,
            color: COLORS.textSecondary,
        },
        deleteSection: {
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 16,
            gap: 12,
            borderWidth: 1,
            borderColor: COLORS.error,
        },
        deleteSectionHint: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 13,
            color: COLORS.textSecondary,
            lineHeight: 20,
        },
        deleteConfirmBtn: {
            backgroundColor: COLORS.error,
            borderRadius: 12,
            paddingVertical: 13,
            alignItems: 'center',
        },
        deleteConfirmText: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 15,
            color: COLORS.white,
        },
        spacer: {
            width: 40,
        },
        kbdAvoid: {
            flex: 1,
        },
    });

export default createStyles;
