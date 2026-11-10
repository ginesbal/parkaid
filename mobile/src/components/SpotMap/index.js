// SpotMap — the spot on a real, still map (iOS and Android), with the brand
// pin's tip on its coordinate: the same pin as the map's markers. Not
// interactive and hidden from screen readers; the text around it says where.
// Web has no map renderer here and shows nothing (index.web.js).

import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { RADIUS, TOKENS } from '../../constants/theme';
import { getCoordinates } from '../../utils/spotPresentation';
import { PIN, PIN_FRAME } from '../BrandPin';

// Android draws custom markers into a 100 px bitmap; 30 pt fits at 3x.
const PIN_SIZE = Platform.OS === 'android' ? 30 : 40;
// About a block and a half across.
const SPAN = 0.004;
// In case the pin's onLoad never fires (cached images on some Android builds).
const READY_FALLBACK_MS = 600;

export default function SpotMap({ spot, width, height, style }) {
    const coordinate = getCoordinates(spot);
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setReady(true), READY_FALLBACK_MS);
        return () => clearTimeout(t);
    }, []);

    if (!coordinate) return <View style={style} />;

    return (
        <View
            style={[styles.frame, { width, height }, style]}
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <MapView
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFill}
                initialRegion={{ ...coordinate, latitudeDelta: SPAN * (height / width), longitudeDelta: SPAN }}
                liteMode
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                toolbarEnabled={false}
                showsPointsOfInterest={false}
            >
                <Marker
                    coordinate={coordinate}
                    anchor={{ x: PIN_FRAME.tipX, y: PIN_FRAME.tipY }}
                    tracksViewChanges={!ready}
                >
                    <Image
                        source={PIN}
                        style={{ width: PIN_SIZE, height: PIN_SIZE }}
                        resizeMode="contain"
                        onLoad={() => setReady(true)}
                    />
                </Marker>
            </MapView>
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
