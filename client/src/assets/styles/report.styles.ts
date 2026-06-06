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
            color: COLORS.textPrimary,
        },
        spacer: {
            width: 40,
        },
        center: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        scroll: {
            padding: 20,
            paddingBottom: 40,
            gap: 16,
        },
        monthSelector: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: COLORS.white,
            borderRadius: 20,
            padding: 16,
            marginBottom: 8,
        },
        monthArrow: {
            padding: 8,
        },
        monthText: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 18,
            color: COLORS.textPrimary,
        },
        card: {
            backgroundColor: COLORS.white,
            borderRadius: 24,
            padding: 20,
            gap: 16,
        },
        cardTitle: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 16,
            color: COLORS.textPrimary,
            marginBottom: 8,
        },
        summaryRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        summaryBox: {
            flex: 1,
            gap: 4,
        },
        summaryLabel: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 13,
            color: COLORS.textSecondary,
        },
        summaryValue: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 20,
            color: COLORS.textPrimary,
        },
        incomeValue: {
            color: '#2E7D32',
        },
        expenseValue: {
            color: '#E53935',
        },
        divider: {
            width: 1,
            backgroundColor: COLORS.inputBackground,
            marginHorizontal: 16,
        },
        netBox: {
            backgroundColor: COLORS.inputBackground,
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            gap: 4,
        },
        netLabel: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 14,
            color: COLORS.textSecondary,
        },
        netValue: {
            fontFamily: 'HankenGrotesk_700Bold',
            fontSize: 28,
            color: COLORS.textPrimary,
        },
        statRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.inputBackground,
        },
        statLabel: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 15,
            color: COLORS.textPrimary,
        },
        statValueBox: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        statValue: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 15,
            color: COLORS.textPrimary,
        },
        trendIcon: {
            marginLeft: 4,
        },
        trendPositive: {
            color: '#2E7D32',
        },
        trendNegative: {
            color: '#E53935',
        },
        catRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
        },
        catInfo: {
            flex: 1,
            marginLeft: 12,
        },
        catHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
        },
        catName: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 15,
            color: COLORS.textPrimary,
        },
        catAmount: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 15,
            color: COLORS.textPrimary,
        },
        catBarBg: {
            height: 6,
            backgroundColor: COLORS.inputBackground,
            borderRadius: 3,
            overflow: 'hidden',
        },
        catBarFill: {
            height: '100%',
            backgroundColor: COLORS.primary,
            borderRadius: 3,
        },
        iconBox: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.surfaceContainerLow,
            alignItems: 'center',
            justifyContent: 'center',
        },
        topDayRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.inputBackground,
        },
        topDayDate: {
            fontFamily: 'HankenGrotesk_500Medium',
            fontSize: 15,
            color: COLORS.textPrimary,
        },
        topDayAmount: {
            fontFamily: 'HankenGrotesk_600SemiBold',
            fontSize: 15,
            color: '#E53935',
        },
        emptyText: {
            fontFamily: 'HankenGrotesk_400Regular',
            fontSize: 14,
            color: COLORS.textSecondary,
            textAlign: 'center',
            padding: 16,
        }
    });

export default createStyles;
