// The map, per platform. On phones it's react-native-maps (Google Maps);
// the web build gets index.web.js instead: MapLibre with free OpenStreetMap
// tiles, behind the same API, so the map screen runs unchanged on both.
export { default, Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
