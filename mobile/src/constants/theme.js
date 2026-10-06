// Design tokens — minimalist redesign.
// Driven by .agents/skills/: minimalist-ui, quieter, distill, typeset, design-taste-frontend.
// Principles:
//   - One accent (cerulean), no competing color ramps
//   - Hairline borders instead of heavy shadows
//   - Tinted near-black ink (never pure #000)
//   - 3 weights total: 400 body, 500 numerics, 600 titles
//   - Tokens kept backward-compatible by name; values simplified

export function alpha(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Only two ramps remain: prussian (ink) and cerulean (accent).
// amber / cream / yale are collapsed into single semantic tokens below.
export const PALETTE = {
    cerulean: {
        DEFAULT: '#1d6d8b',
        50: '#edf6f9',
        100: '#d7ebf2',
        200: '#b3d6e4',
        300: '#83bad0',
        400: '#549bb8',
        500: '#1d6d8b',
        600: '#185a74',
        700: '#15495d',
        800: '#103746',
        900: '#0c2833',
    },
    prussian: {
        DEFAULT: '#0F1A26',
        50: '#ecf2f7',
        100: '#d3deea',
        200: '#aec1d3',
        300: '#80a0ba',
        400: '#587a97',
        500: '#0F1A26',
        600: '#0C1520',
        700: '#091119',
        800: '#060C12',
        900: '#03070B',
    },
};

// Single accent (cerulean ~78% saturation), near-black tinted ink, one hairline border.
// Tinted surfaces deliberately reintroduce cerulean on key interactive regions
// (header, active chips, numeric blocks) so information is visibly grouped without
// competing with the content. Stay below alpha 0.18 to preserve the calm brand voice.
export const TOKENS = {
    // canvas
    bg: '#F6F8FA',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F4F8',
    surfaceRaised: '#FFFFFF',
    surfaceOverlay: 'rgba(255, 255, 255, 0.96)',
    surfaceAccent: alpha(PALETTE.cerulean[500], 0.06),
    // Cool-tinted canvas for list separators and "info slab" backgrounds
    surfaceTint: '#EFF4F8',
    surfaceCool: '#E9F1F6',

    // borders — one hairline color, legacy aliases collapsed
    stroke: '#E6EAF0',
    strokeStrong: '#D8DEE7',
    strokeLight: '#EEF1F5',
    hairline: '#E6EAF0',
    hairlineStrong: '#D4DDE6',
    divider: '#EEF1F5',
    // Translucent cerulean outlines for tinted surfaces
    primaryHairline: alpha(PALETTE.cerulean[500], 0.18),
    primaryBorder: alpha(PALETTE.cerulean[500], 0.28),

    // text
    text: '#0F1A26',
    textMuted: '#5B6B7C',
    textLight: '#90A0B0',
    textFaint: '#90A0B0',

    // primary (single accent) — 5 tint steps, low → medium → solid
    primary: PALETTE.cerulean[500],
    primaryAlt: PALETTE.cerulean[700],
    primaryInk: PALETTE.cerulean[700],
    primaryDeep: PALETTE.cerulean[800],
    primaryWash: alpha(PALETTE.cerulean[500], 0.06),   // barely-there
    primarySoft: alpha(PALETTE.cerulean[500], 0.10),   // quiet tint
    primaryTint: alpha(PALETTE.cerulean[500], 0.14),   // visible tint — header, slabs
    primaryFill: alpha(PALETTE.cerulean[500], 0.18),   // confident fill — active chips
    primaryGlass: 'rgba(237, 246, 249, 0.94)',         // cerulean[50] as overlay
    accent: PALETTE.cerulean[500],
    accentAlt: PALETTE.cerulean[400],

    // content (text, icons) sitting on a solid fill — cerulean, a semantic
    // color, or ink. White halos on the map use `surface`, not these.
    onPrimary: '#FFFFFF',
    onPrimaryMuted: 'rgba(255, 255, 255, 0.82)',

    // semantic — base hue for dots, fills, borders and large text.
    // The *Ink variants are for small/medium TEXT, where the base hue falls
    // short of WCAG AA: warning is 3.3:1 on white, danger 4.4:1 on its soft
    // banner. Ink keeps the hue but darkens it to pass on both grounds.
    danger: '#B5524A',
    dangerInk: '#9E4038',      // 6.5:1 on white, 5.8:1 on dangerSoft
    dangerSoft: 'rgba(181, 82, 74, 0.08)',
    success: '#2C7A6B',        // 5.1:1 on white — already passes as text
    successSoft: 'rgba(44, 122, 107, 0.08)',
    warning: '#B8832D',
    warningInk: '#8F6418',     // 5.2:1 on white, 4.8:1 on warningSoft
    warningSoft: 'rgba(184, 131, 45, 0.08)',

    shadow: '#0F1A26',
    focus: alpha(PALETTE.cerulean[500], 0.22),
    focusRing: alpha(PALETTE.cerulean[500], 0.22),
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
};

// Radii — softer corners across the board. The redesign calls for a friendlier
// shape language on cards, rows, and panels. sm/md stay for small chips & tags;
// lg/xl/2xl are for rows, panels, and the hero card respectively.
export const RADIUS = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    '2xl': 22,
    pill: 9999,
    full: 9999,
};

// Shadows whispered down to opacity < 0.05. All three levels map to the same
// near-invisible tinted drop so existing references don't break; prefer hairline
// borders for elevation going forward.
export const SHADOWS = {
    sm: {
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    md: {
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 1,
    },
    lg: {
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 1,
    },
    raised: {
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 1,
    },
};

// Deliberate 5-step type scale. Three weights only: 400 body, 500 numerics, 600 titles.
// All numeric displays use tabular-nums for alignment.
export const TYPOGRAPHY = {
    display: {
        fontSize: 28,
        lineHeight: 32,
        fontWeight: '600',
        letterSpacing: -0.6,
        color: TOKENS.text,
    },
    heading: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: '600',
        letterSpacing: -0.3,
        color: TOKENS.text,
    },
    subheading: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '600',
        letterSpacing: -0.1,
        color: TOKENS.text,
    },
    body: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400',
        color: TOKENS.text,
    },
    bodyMuted: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400',
        color: TOKENS.textMuted,
    },
    caption: {
        fontSize: 11,
        lineHeight: 14,
        fontWeight: '500',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: TOKENS.textMuted,
    },
    numLarge: {
        fontSize: 32,
        lineHeight: 34,
        fontWeight: '500',
        letterSpacing: -0.8,
        fontVariant: ['tabular-nums'],
        color: TOKENS.text,
    },
    numMedium: {
        fontSize: 20,
        lineHeight: 22,
        fontWeight: '500',
        letterSpacing: -0.4,
        fontVariant: ['tabular-nums'],
        color: TOKENS.text,
    },
    numSmall: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '500',
        fontVariant: ['tabular-nums'],
        color: TOKENS.text,
    },
};
