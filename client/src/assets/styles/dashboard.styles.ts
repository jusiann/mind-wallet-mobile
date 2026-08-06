import { Dimensions, StyleSheet } from 'react-native';

export const SCREEN_WIDTH = Dimensions.get('window').width;

export const CHART_COLORS = [
    '#6750A4',
    '#9B8EC4',
    '#C5B8E6',
    '#4F46E5',
    '#A855F7',
    '#EC4899',
    '#F59E0B',
    '#10B981',
    '#EF4444',
    '#6B7280',
];

export const CHART_SIZE = Math.min(Math.round((SCREEN_WIDTH - 80) * 0.35), 100);
export const OUTER_R = CHART_SIZE / 2;
export const INNER_R = OUTER_R * 0.6;

const createStyles = (COLORS: any) =>
    StyleSheet.create({
        safe: {
            flex: 1,
            backgroundColor: COLORS.background,
        },
        center: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: COLORS.background,
        },
        errorText: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: 0,
            color: COLORS.error,
        },
        headerAvatar: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: COLORS.textPrimary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
        },
        headerAvatarText: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 13,
            color: COLORS.white,
        },
        scroll: {
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 100,
            gap: 20,
        },
        topSection: {
            gap: 6,
        },
        topScrollView: {
            marginHorizontal: -20,
        },
        topCardWrapper: {
            width: SCREEN_WIDTH,
            paddingHorizontal: 20,
            flexDirection: 'column',
            height: 195,
        },
        balanceCard: {
            flex: 1,
            backgroundColor: COLORS.textPrimary,
            borderRadius: 24,
            padding: 28,
            justifyContent: 'space-between',
        },
        balanceTop: {
            gap: 4,
        },
        balanceLabel: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 13,
            letterSpacing: 1.5,
            color: 'rgba(255,255,255,0.6)',
        },
        balanceAmount: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 44,
            lineHeight: 48,
            letterSpacing: -0.8,
            color: COLORS.white,
            marginTop: 8,
        },
        cardBottomRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        trendBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            alignSelf: 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
            backgroundColor: 'rgba(103,80,164,0.2)',
        },
        trendText: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 13,
            color: COLORS.primary,
        },
        mindyBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: COLORS.primary,
        },
        mindyBtnText: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 12,
            color: COLORS.white,
        },
        chartCard: {
            flex: 1,
            backgroundColor: COLORS.textPrimary,
            borderRadius: 24,
            padding: 24,
        },
        chartCardInner: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flex: 1,
        },
        chartCardLeft: {
            flex: 1.2,
            justifyContent: 'space-between',
            height: '100%',
            paddingRight: 10,
        },
        chartCardTop: {
            alignItems: 'flex-start',
            gap: 2,
        },
        chartCardTopLabel: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 12,
            letterSpacing: 1.5,
            color: 'rgba(255,255,255,0.6)',
        },
        chartCardTopAmount: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 36,
            letterSpacing: -0.5,
            color: COLORS.white,
        },
        chartCardRight: {
            flex: 0.9,
            alignItems: 'center',
            justifyContent: 'center',
        },
        chartPieWrap: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        chartCatList: {
            gap: 8,
            marginTop: 'auto',
            paddingRight: 20,
        },
        chartCatRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        chartCatDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        chartCatName: {
            flex: 1,
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 13,
            color: 'rgba(255,255,255,0.85)',
        },
        chartCatAmt: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 13,
            color: COLORS.white,
        },
        chartEmpty: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 13,
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            paddingVertical: 28,
        },
        dotsContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        },
        dotBtn: {
            padding: 2,
        },
        dot: {
            height: 6,
            borderRadius: 3,
            backgroundColor: COLORS.primary,
        },
        actionsRow: {
            flexDirection: 'row',
            gap: 12,
        },
        actionCard: {
            flex: 1,
            borderRadius: 24,
            paddingVertical: 20,
            alignItems: 'center',
            gap: 10,
        },
        actionCardExpense: {
            backgroundColor: COLORS.primary,
        },
        actionCardIncome: {
            backgroundColor: COLORS.primaryContainer,
        },
        actionIconCircle: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: COLORS.white,
            alignItems: 'center',
            justifyContent: 'center',
        },
        actionLabel: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 14,
        },
        txAmountIncome: {
            color: '#4CAF50',
        },
        txAmountExpense: {
            color: '#F44336',
        },
        section: {
            gap: 12,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        sectionTitle: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 20,
            lineHeight: 32,
            letterSpacing: 0,
            color: COLORS.textPrimary,
        },
        seeAllText: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: 0.14,
            color: COLORS.primary,
        },
        goalsScrollView: {
            marginHorizontal: -20,
        },
        goalsScroll: {
            paddingBottom: 8,
        },
        goalCardWrapper: {
            width: SCREEN_WIDTH,
            paddingHorizontal: 20,
        },
        goalCard: {
            flex: 1,
            backgroundColor: COLORS.white,
            borderRadius: 24,
            padding: 24,
            gap: 12,
            shadowColor: COLORS.black,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        },
        goalCardTop: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        goalDeadline: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 11,
            color: COLORS.textSecondary,
        },
        goalTitle: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 16,
            color: COLORS.textPrimary,
        },
        goalAmountsRow: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 2,
        },
        goalAmountsLeft: {
            flexDirection: 'row',
            alignItems: 'baseline',
        },
        goalCurrent: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 17,
            color: COLORS.textPrimary,
        },
        goalTarget: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 12,
            color: COLORS.textSecondary,
        },
        progressTrack: {
            height: 10,
            backgroundColor: COLORS.surfaceContainerHigh,
            borderRadius: 5,
            overflow: 'hidden',
        },
        progressFill: {
            height: 10,
            backgroundColor: COLORS.primary,
            borderRadius: 5,
        },
        txCard: {
            backgroundColor: COLORS.white,
            borderRadius: 24,
            overflow: 'hidden',
            shadowColor: COLORS.black,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        },
        txSeparator: {
            height: 1,
            backgroundColor: COLORS.border,
            marginHorizontal: 16,
        },
        txItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: 16,
        },
        txIcon: {
            width: 24,
            alignItems: 'center',
            justifyContent: 'center',
        },
        txInfo: {
            flex: 1,
            gap: 2,
        },
        txDesc: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 15,
            color: COLORS.textPrimary,
        },
        txDate: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 12,
            color: COLORS.textSecondary,
        },
        txAmount: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 15,
        },
    });

export default createStyles;
