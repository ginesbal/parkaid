// src/components/ParkingCard/cardStyles.js
//
// Card design language: one set of parts for both faces.
//   - Type does the structure: street name, then the answer (price or "who
//     can park"), then the rules as plain label/value rows split by hairlines.
//     No badges, icon circles or small-caps labels on the front.
//   - Cerulean only on what you can tap: Navigate, Park here, All details.
//   - The front is only as tall as it needs to be; the back is a scrolling
//     spec sheet of the same rows under section headers.
//   - Touch targets >= 44px; the bottom buttons are 52px.

import { StyleSheet } from 'react-native';
import { TOKENS, alpha } from '../../constants/theme';
import { CARD_HEIGHT, CARD_MIN_HEIGHT, CARD_WIDTH } from './cardConstants';

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

  // No height of its own: the front sets it (see cardFront), and the back
  // fills whatever that is.
  container: {
    width: CARD_WIDTH,
    zIndex: 2000,
    elevation: 20,
  },

  card: {
    width: CARD_WIDTH,
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

  // In the flow, so its content decides the card's height; capped so the
  // middle scrolls on small phones, with a floor that leaves the back room.
  cardFront: {
    minHeight: Math.min(CARD_MIN_HEIGHT, CARD_HEIGHT),
    maxHeight: CARD_HEIGHT,
    padding: 20,
    zIndex: 2,
  },

  cardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    zIndex: 1,
  },

  // --- Header rows (front + back) ---
  // Title block on the left, close on the right, tops aligned.
  frontHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },

  cardHeaderBack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
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

  // The app's press feedback (scale + fade) for the front face's buttons.
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },

  // --- Front content ---
  // Spacing groups the face: 4 inside the title block, 6 between a price and
  // its status, 20 between the groups (title, answer, rules, buttons).
  // Grows into any room the card's minimum height leaves, so the buttons stay
  // at the bottom; shrinks (and scrolls) when the content outgrows the card.
  frontScroll: {
    flexGrow: 1,
    flexShrink: 1,
    marginTop: 20,
  },
  frontBody: {
    gap: 20,
  },

  addressPrimary: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
    color: TOKENS.text,
    letterSpacing: -0.5,
  },
  addressSecondary: {
    fontSize: 14,
    lineHeight: 19,
    color: TOKENS.textMuted,
  },

  // The answer: the price at the largest size on the card, or who can park.
  headline: {
    gap: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  priceValueQuiet: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: TOKENS.textMuted,
    marginLeft: 6,
  },
  // "Paid right now · until 5:50 PM": the state in its colour, the rest muted.
  statusLine: {
    fontSize: 15,
    lineHeight: 20,
    color: TOKENS.textMuted,
  },
  statusPaid: {
    fontWeight: '600',
    color: TOKENS.warningInk,
  },
  statusFree: {
    fontWeight: '600',
    color: TOKENS.success,
  },
  accessLabel: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.4,
  },

  // The rules: the back's label/value rows, with a hairline above the first.
  factList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TOKENS.divider,
  },
  factValueDanger: {
    color: TOKENS.dangerInk,
    fontWeight: '600',
  },
  // The last row opens the back: a link, so it's the accent colour.
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 11,
  },
  moreRowPressed: {
    opacity: 0.6,
  },
  moreText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: TOKENS.primary,
  },

  // Buttons: one filled, one outlined, same size and shape.
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionsDivided: {
    marginTop: 0,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TOKENS.divider,
  },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: TOKENS.primary,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: TOKENS.onPrimary,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TOKENS.hairlineStrong,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: TOKENS.primary,
  },
  navBtnTextLarge: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    color: TOKENS.onPrimary,
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
    minHeight: 58,
    backgroundColor: TOKENS.primary,
    borderRadius: 14,
    gap: 8,
  },
});
