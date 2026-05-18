import { Dimensions, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

// ─── Exported constants (used in component + SVG math) ───────────────────────

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

export const CHART_SIZE = Math.min(Math.round((SCREEN_WIDTH - 80) * 0.44), 140);
export const OUTER_R    = CHART_SIZE / 2 - 2;
export const INNER_R    = OUTER_R * 0.55;

// ─── Styles ───────────────────────────────────────────────────────────────────

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: { ...TYPOGRAPHY.bodyMd, color: COLORS.error },

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

  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 20 },

  // ─── Top cards scroll (Balance ↔ Chart) ────────────────────────────────────
  topSection: { gap: 6 },
  topScrollView: { marginHorizontal: -20 },
  topCardWrapper: { width: SCREEN_WIDTH, paddingHorizontal: 20, flexDirection: 'column', alignSelf: 'stretch' },

  // ─── Balance card ───────────────────────────────────────────────────────────
  balanceCard: {
    flex: 1,
    backgroundColor: COLORS.textPrimary,
    borderRadius: 24,
    padding: 28,
    justifyContent: 'space-between',
  },
  balanceTop: { gap: 4 },
  balanceLabel: {
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 13,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.6)',
  },
  balanceAmount: { ...TYPOGRAPHY.numericXl, fontSize: 44, color: COLORS.white },
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

  // ─── Chart card (slide 2) ───────────────────────────────────────────────────
  chartCard: {
    flex: 1,
    backgroundColor: COLORS.textPrimary,
    borderRadius: 24,
    padding: 28,
    justifyContent: 'center',
  },
  chartCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  chartPieWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPieCenter: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPieCenterAmt: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 13,
    color: COLORS.white,
  },
  chartPieCenterLbl: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  chartCatList: {
    flex: 1,
    gap: 12,
  },
  chartCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartCatDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chartCatName: {
    flex: 1,
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  chartCatAmt: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 14,
    color: COLORS.white,
  },
  chartEmpty: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingVertical: 28,
  },

  // ─── Dots ───────────────────────────────────────────────────────────────────
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotBtn: { padding: 2 },
  dot: { height: 6, borderRadius: 3, backgroundColor: COLORS.primary },

  // ─── Quick actions ──────────────────────────────────────────────────────────
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
  },
  actionCardExpense: { backgroundColor: COLORS.primary },
  actionCardIncome: { backgroundColor: COLORS.primaryContainer },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14 },
  txAmountIncome: { color: '#4CAF50' },
  txAmountExpense: { color: '#F44336' },

  // ─── Section ────────────────────────────────────────────────────────────────
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...TYPOGRAPHY.headlineMd,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  seeAllText: { ...TYPOGRAPHY.labelMd, color: COLORS.primary },

  // ─── Goals scroll ───────────────────────────────────────────────────────────
  goalsScrollView: { marginHorizontal: -20 },
  goalsScroll: { paddingBottom: 8 },
  goalCardWrapper: { width: SCREEN_WIDTH, paddingHorizontal: 20 },
  goalCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    gap: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalDeadline: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  goalTitle: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  goalPct: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 13,
    color: COLORS.primary,
  },
  progressTrack: {
    height: 5,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: 5, backgroundColor: COLORS.primary, borderRadius: 3 },
  goalAmounts: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // ─── Transactions ───────────────────────────────────────────────────────────
  txCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
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
    marginHorizontal: 14,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  txIcon: { width: 24, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, gap: 2 },
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
  txAmount: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15 },
});
