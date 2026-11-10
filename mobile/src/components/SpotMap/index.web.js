// SpotMap (web) — the spot on a still map, as on the phones: MapLibre with
// OpenFreeMap's OpenStreetMap tiles (components/WebMap), with the brand pin's
// tip on the spot. The text around it says where; the map adds the street
// grid. A thumbnail has no room for the map's credit, so small ones (Home's
// suggestion) keep the caller's spacing and show no map.

import { Image, StyleSheet, View } from 'react-native';
import { RADIUS, TOKENS } from '../../constants/theme';
import { getCoordinates } from '../../utils/spotPresentation';
import { PIN, PIN_FRAME } from '../BrandPin';
import WebMap from '../WebMap';

const PIN_SIZE = 40;
// About a block and a half across, as on the phones.
const SPAN = 280; // metres
// Narrower than this, the credit would cover the map.
const MIN_WIDTH = 200;
const EARTH_CIRCUMFERENCE = 40075016.686; // metres

// The zoom at which `meters` fill `pixels` at `latitude` (512 px tiles).
const zoomFor = (latitude, pixels, meters) =>
    Math.log2((EARTH_CIRCUMFERENCE * Math.cos((latitude * Math.PI) / 180) * pixels) / (512 * meters));

export default function SpotMap({ spot, width, height, style }) {
    const coordinate = getCoordinates(spot);
    if (!coordinate || width < MIN_WIDTH) return <View style={style} />;

    return (
        <View
            style={[styles.frame, { width, height }, style]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <WebMap
                style={StyleSheet.absoluteFill}
                center={coordinate}
                zoom={zoomFor(coordinate.latitude, width, SPAN)}
                interactive={false}
                creditCollapsed
                markers={[{
                    id: 'spot',
                    coordinate,
                    anchor: 'top-left',
                    offset: [-PIN_FRAME.tipX * PIN_SIZE, -PIN_FRAME.tipY * PIN_SIZE],
                    node: <Image source={PIN} style={{ width: PIN_SIZE, height: PIN_SIZE }} resizeMode="contain" />,
                }]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    frame: {
        overflow: 'hidden',
        borderRadius: RADIUS.xl,
        backgroundColor: TOKENS.mapLand,
    },
});
