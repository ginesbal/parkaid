// src/components/ParkingCard/cardStyles.js
//
// Card design language:
//   - One thing dominates each card: the price. It gets a tinted slab and the
//     largest type so a glance answers "what will this cost me".
//   - Three quick facts (walk / distance / max stay) sit in an open row with
//     the same vertical-rule signature as the list, tying the two views together.
//   - Hairline borders, near-invisible shadows, one cerulean accent.
//   - 16px rhythm within the card; touch targets >= 52px.

import { StyleSheet } from 'react-native';
import { TOKENS, alpha } from '../../constants/theme';
import { CARD_HEIGHT, CARD_WIDTH } from './cardConstants';

export const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: alpha(TOKENS.shadow, 0.2),
    zIndex: 1500,
    elevation: 15,
  },

  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    zIndex: 2000,
    elevation: 20,
  },

  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TOKENS.hairline,
    backfaceVisibility: 'hidden',
    shadowColor: TOKENS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
  },

  cardFront: {
    padding: 22,
    zIndex: 2,
  },

  cardBack: {
    padding: 22,
    zIndex: 1,
  },

  // --- Header rows (front + back) ---
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  cardHeaderBack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },

  // Type chip — small tinted pill so the spot category reads instantly.
  spotTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 9999,
    backgroundColor: TOKENS.primaryWash,
  },

  pageTitleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  spotTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TOKENS.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: TOKENS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Front content ---
  frontContent: {
    flex: 1,
  },

  address: {
    fontSize: 22,
    fontWeight: '600',
    color: TOKENS.text,
    marginBottom: 16,
    lineHeight: 27,
    letterSpacing: -0.4,
  },

  // Price hero — the single most important answer, so it gets the slab + big type.
  priceHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  priceHeroPaid: {
    backgroundColor: TOKENS.primaryWash,
    borderColor: TOKENS.primaryHairline,
  },
  priceHeroFree: {
    backgroundColor: TOKENS.successSoft,
    borderColor: alpha(TOKENS.success, 0.22),
  },
  priceHeroPermit: {
    backgroundColor: TOKENS.warningSoft,
    borderColor: alpha(TOKENS.warning, 0.22),
  },
  priceHeroUnknown: {
    backgroundColor: TOKENS.surfaceMuted,
    borderColor: TOKENS.hairline,
  },
  priceHeroLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 1,
  },
  priceHeroValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  priceHeroUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: TOKENS.textMuted,
    marginLeft: 4,
  },
  priceHeroNote: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: TOKENS.textMuted,
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '46%',
  },

  // Three quick facts, open row with vertical rules (same signature as the list).
  statRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  statCellDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: TOKENS.divider,
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
    color: TOKENS.text,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  statValueUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: TOKENS.textMuted,
    marginLeft: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: TOKENS.textMuted,
    letterSpacing: 0.1,
  },

  // Restriction badges — only the rules a driver would get ticketed for.
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeDanger: {
    backgroundColor: TOKENS.dangerSoft,
    borderColor: alpha(TOKENS.danger, 0.22),
  },
  badgeWarning: {
    backgroundColor: TOKENS.warningSoft,
    borderColor: alpha(TOKENS.warning, 0.22),
  },
  badgeInfo: {
    backgroundColor: TOKENS.surfaceMuted,
    borderColor: TOKENS.hairline,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  badgeTextDanger: { color: TOKENS.danger },
  badgeTextWarning: { color: TOKENS.warning },
  badgeTextInfo: { color: TOKENS.textMuted },

  // Action buttons — 54px touch targets.
  actionsLarge: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  detailsBtnLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TOKENS.hairlineStrong,
    borderRadius: 14,
    gap: 7,
  },
  detailsBtnTextLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: TOKENS.text,
  },
  navBtnLarge: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    backgroundColor: TOKENS.primary,
    borderRadius: 14,
    gap: 8,
  },
  navBtnTextLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // --- Back: horizontal pager ---
  pagesContainer: {
    flex: 1,
  },

  detailPage: {
    flexShrink: 0,
  },

  detailsListLarge: {
    flex: 1,
  },

  detailsContent: {
    paddingBottom: 4,
  },

  detailRowLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TOKENS.divider,
  },

  detailRowHighlightLarge: {
    backgroundColor: 'transparent',
  },

  detailLabelLarge: {
    fontSize: 14,
    lineHeight: 19,
    color: TOKENS.textMuted,
    flex: 1,
    fontWeight: '400',
  },

  detailLabelHighlight: {
    color: TOKENS.text,
    fontWeight: '600',
  },

  detailValueLarge: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
    color: TOKENS.text,
    textAlign: 'right',
    paddingLeft: 16,
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },

  detailValueHighlight: {
    fontSize: 15,
    fontWeight: '600',
    color: TOKENS.primary,
  },

  // Pager nav
  pagerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TOKENS.divider,
  },

  pagerArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TOKENS.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pagerArrowDisabled: {
    opacity: 0.3,
  },

  pagerDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  pagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: TOKENS.hairlineStrong,
  },

  pagerDotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: TOKENS.primary,
  },

  linkText: {
    textDecorationLine: 'underline',
    color: TOKENS.primary,
  },

  noDataText: {
    fontSize: 15,
    color: TOKENS.textMuted,
    textAlign: 'center',
    paddingVertical: 32,
  },

  backActionsLarge: {
    marginTop: 'auto',
    paddingTop: 12,
  },

  navBtnFullLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    backgroundColor: TOKENS.primary,
    borderRadius: 14,
    gap: 8,
  },
});
