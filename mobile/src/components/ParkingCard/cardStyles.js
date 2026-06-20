// src/components/ParkingCard/cardStyles.js
//
// Card design language:
//   - One thing dominates the front: the price. It gets a tinted slab and the
//     largest type so a glance answers "what will this cost me".
//   - The back is a calm, vertically-scrolling spec sheet: uppercase section
//     headers (Pricing / Rules / About) over a clean two-column definition
//     list. No swiping between fragmented pages.
//   - Hairline borders, near-invisible shadows, one cerulean accent.
//   - 16px rhythm on the front; touch targets >= 54px.

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
    marginBottom: 18,
  },

  cardHeaderBack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
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

  spotTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Back header title — the address, so you keep your bearings after the flip.
  backTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: TOKENS.text,
    letterSpacing: -0.2,
  },

  // Quiet circular buttons. The close button no longer shouts in solid black;
  // the price should own the visual weight, not the dismiss control.
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: TOKENS.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TOKENS.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: TOKENS.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TOKENS.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Front content ---
  // The body fills the space between the header and the actions and centers its
  // group, so whitespace stays balanced instead of pooling into a void above
  // the buttons. One consistent gap drives the vertical rhythm.
  frontBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },

  address: {
    fontSize: 22,
    fontWeight: '600',
    color: TOKENS.text,
    lineHeight: 27,
    letterSpacing: -0.4,
  },

  // Price — the focal point, carried by size and color rather than a heavy box.
  priceBlock: {
    gap: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 33,
    lineHeight: 37,
    fontWeight: '600',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: TOKENS.textMuted,
    marginLeft: 5,
  },
  priceNote: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: TOKENS.textMuted,
  },

  // Three quick facts in a clean band, framed by hairline rules (echoes the
  // back's spec-sheet lines). No vertical dividers — even spacing carries it.
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: TOKENS.divider,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
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
    marginLeft: 3,
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
    justifyContent: 'center',
    gap: 8,
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

  // --- Back: vertical spec sheet ---
  detailsScroll: {
    flex: 1,
  },
  detailsScrollContent: {
    paddingBottom: 6,
  },

  detailSection: {
    marginTop: 20,
  },
  detailSectionFirst: {
    marginTop: 2,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: TOKENS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },

  // Two-column definition row. Label left (muted), value right (ink). Rows
  // top-align so a value that wraps to a second line still reads cleanly.
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 11,
  },
  detailRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TOKENS.divider,
  },
  detailLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: TOKENS.textMuted,
    fontWeight: '400',
    flexShrink: 0,
    maxWidth: '44%',
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    color: TOKENS.text,
    textAlign: 'right',
  },
  // The key fact in each section (rate, max stay) gets the accent.
  detailValueStrong: {
    color: TOKENS.primary,
    fontWeight: '600',
  },
  linkText: {
    textDecorationLine: 'underline',
    color: TOKENS.primary,
  },
  noDataText: {
    fontSize: 15,
    color: TOKENS.textMuted,
    textAlign: 'center',
    paddingVertical: 40,
  },

  // Persistent footer action on the back, divided from the scroll area.
  backFooter: {
    paddingTop: 14,
    marginTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TOKENS.divider,
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
