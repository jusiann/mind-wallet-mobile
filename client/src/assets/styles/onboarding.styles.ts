import { Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const createStyles = (COLORS: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: COLORS.surface,
        },
        slide: {
            width: SCREEN_WIDTH,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
        },

        /* ICON AREA */
        iconCircle: {
            width: 120,
            height: 120,
            borderRadius: 60,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
        },
        iconCircleAccent: {
        },

        /* EMOJI / ICON LABEL */
        iconEmoji: {
            fontSize: 52,
        },

        /* TEXTS */
        slideTitle: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 28,
            lineHeight: 36,
            color: COLORS.textPrimary,
            textAlign: 'center',
            letterSpacing: -0.3,
            marginTop: 20,
            marginBottom: 4,
        },
        slideTitleAccent: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 28,
            lineHeight: 36,
            color: COLORS.primary,
            textAlign: 'center',
            letterSpacing: -0.3,
            marginBottom: 12,
        },
        slideDescription: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 16,
            lineHeight: 26,
            color: COLORS.textSecondary,
            textAlign: 'center',
            paddingHorizontal: 8,
        },

        /* FEATURE CHIPS */
        featureRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 10,
            marginTop: 24,
        },
        featureChip: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 8,
        },
        featureChipText: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 13,
            color: COLORS.textPrimary,
        },

        /* BOTTOM AREA */
        bottomBar: {
            paddingHorizontal: 24,
            paddingBottom: 40,
            paddingTop: 16,
        },

        /* DOTS */
        dotsRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
        },
        dot: {
            height: 6,
            borderRadius: 3,
            backgroundColor: COLORS.primary,
        },

        /* BUTTON */
        nextButton: {
            backgroundColor: COLORS.black,
            borderRadius: 16,
            height: 58,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
        },
        nextButtonText: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 17,
            color: COLORS.white,
        },

        /* SKIP BUTTON */
        skipButton: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            marginTop: 4,
        },
        skipButtonText: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 14,
            color: COLORS.textSecondary,
        },

        /* LOGO AREA */
        logoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
        },
        logoText: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 26,
            color: COLORS.textPrimary,
            letterSpacing: -0.3,
        },
    });

export { SCREEN_WIDTH };
export default createStyles;
