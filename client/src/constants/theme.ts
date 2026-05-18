export const COLORS = {
    primary: '#6750A4',
    primaryDark: '#4F378B',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',

    secondary: '#625B71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',

    background: '#FEF7FF',
    surface: '#FEF7FF',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F7F2FA',
    surfaceContainer: '#F3EDF7',
    surfaceContainerHigh: '#ECE6F0',
    surfaceContainerHighest: '#E6E0E9',

    textPrimary: '#1C1B1F',
    textSecondary: '#49454F',
    textDark: '#1C1B1F',
    placeholderText: '#79747E',

    border: '#CAC4D0',
    borderStrong: '#79747E',

    inputBackground: '#F7F2FA',

    cardBackground: '#FFFFFF',

    error: '#B3261E',
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',

    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
} as const;

export const TYPOGRAPHY = {
    displayLg: {
        fontFamily: 'HankenGrotesk_700Bold',
        fontSize: 48,
        lineHeight: 56,
        letterSpacing: -0.96,
    },
    headlineLg: {
        fontFamily: 'HankenGrotesk_700Bold',
        fontSize: 32,
        lineHeight: 40,
        letterSpacing: -0.32,
    },
    headlineMd: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 24,
        lineHeight: 32,
        letterSpacing: 0,
    },
    bodyLg: {
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 18,
        lineHeight: 28,
        letterSpacing: 0,
    },
    bodyMd: {
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: 0,
    },
    labelMd: {
        fontFamily: 'HankenGrotesk_500Medium',
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0.14,
    },
    numericXl: {
        fontFamily: 'HankenGrotesk_700Bold',
        fontSize: 40,
        lineHeight: 48,
        letterSpacing: -0.8,
    },
} as const;

export const SPACING = {
    unit: 8,
    stackSm: 8,
    stackMd: 16,
    stackLg: 32,
    containerPaddingMobile: 20,
    gutter: 16,
} as const;

export type ColorKey = keyof typeof COLORS;
