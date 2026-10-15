import { Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Collapsed shows just the drag handle + "spots nearby" header
// 80px provides enough space for handle + header with proper spacing
const SHEET_MIN_HEIGHT = 80;

// Header dimensions — compact single bar, filters collapse
// Search bar + padding: ~70px (filters add ~40px when expanded)
const HEADER_CONTENT_HEIGHT = 70;

// Gap between the bottom sheet and the bottom of the map screen. The map
// screen already ends at the tab bar (React Navigation lays tab screens out
// above it), so nothing here should add the tab bar's height again.
const SHEET_BOTTOM_OFFSET = 10;

export { SCREEN_HEIGHT, SCREEN_WIDTH, SHEET_MIN_HEIGHT, HEADER_CONTENT_HEIGHT, SHEET_BOTTOM_OFFSET };