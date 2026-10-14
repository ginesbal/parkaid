import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CARD_WIDTH = Math.min(SCREEN_WIDTH - 20, 430);
// The tallest the card gets; most fronts are shorter (see cardStyles).
export const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.63, 460);
// The shortest the card gets, so the back still shows a few rows.
export const CARD_MIN_HEIGHT = 360;

// for horizontal page sizing
export const CONTENT_PAD = 20;
export const CONTENT_WIDTH = CARD_WIDTH - CONTENT_PAD * 2;

export { SCREEN_HEIGHT, SCREEN_WIDTH };
