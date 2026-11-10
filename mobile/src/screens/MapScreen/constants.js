import { Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Collapsed shows just the drag handle + "spots nearby" header
// 80px provides enough space for handle + header with proper spacing
const SHEET_MIN_HEIGHT = 80;

// Header dimensions — compact single bar, filters collapse
// Search bar + padding: ~70px (filters add ~40px when expanded)
const HEADER_CONTENT_HEIGHT = 70;

export { SCREEN_HEIGHT, SCREEN_WIDTH, SHEET_MIN_HEIGHT, HEADER_CONTENT_HEIGHT };