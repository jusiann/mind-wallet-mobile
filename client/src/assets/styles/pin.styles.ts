import { StyleSheet } from 'react-native';

export default function createStyles(COLORS: any) {
    return StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: COLORS.background,
        },
        flex: {
            flex: 1,
        },
        scroll: {
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
        },
        brandTitle: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 28,
            color: COLORS.textPrimary,
            textAlign: 'center',
            marginBottom: 24,
        },
        logoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
        },
        logoTextFirst: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 28,
            color: COLORS.textPrimary,
        },
        logoTextSecond: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 28,
            color: COLORS.primary,
        },
        card: {
            backgroundColor: COLORS.surface,
            borderRadius: 24,
            padding: 32,
            shadowColor: COLORS.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 2,
            alignItems: 'center',
        },
        title: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 24,
            color: COLORS.textPrimary,
            marginBottom: 8,
            textAlign: 'center',
        },
        subtitle: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 15,
            color: COLORS.textSecondary,
            textAlign: 'center',
            marginBottom: 32,
        },
        dotsContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 40,
        },
        dot: {
            width: 16,
            height: 16,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: COLORS.border,
            backgroundColor: 'transparent',
        },
        dotFilled: {
            borderColor: COLORS.primary,
            backgroundColor: COLORS.primary,
        },
        numpad: {
            width: '100%',
            maxWidth: 300,
            alignSelf: 'center',
        },
        numpadRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
        },
        numpadBtn: {
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: COLORS.background,
            justifyContent: 'center',
            alignItems: 'center',
        },
        numpadBtnText: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 28,
            color: COLORS.textPrimary,
        },
        numpadBtnEmpty: {
            backgroundColor: 'transparent',
        },
        errorText: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 14,
            color: COLORS.error,
            marginTop: -20,
            marginBottom: 20,
            textAlign: 'center',
        },
        logoutBtn: {
            marginTop: 24,
            padding: 12,
        },
        logoutText: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 15,
            color: COLORS.error,
            textAlign: 'center',
        },
    });
}
