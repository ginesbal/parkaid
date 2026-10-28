// SpotMarker — a spot on the native map, drawn as a SpotPill.
//
// react-native-maps snapshots custom marker views. The view is tracked until
// the pin image has loaded (else the snapshot can miss it), then frozen for
// performance. Selection remounts the marker (key in MapOverlays) so it
// re-snapshots with its new look.

import { memo, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { getCoordinates, getSpotName } from '../../../utils/spotPresentation';
import SpotPill, { SpotBadge, getMarkerDescription } from './SpotPill';

// See SpotBadge: Android crops custom markers to 100x100 px.
const MarkerBody = Platform.OS === 'android' ? SpotBadge : SpotPill;

// Fallback in case onLoad never fires (cached images on some Android builds).
const READY_FALLBACK_MS = 600;

function SpotMarker({ spot, selected, onPress, now = Date.now() }) {
    const [ready, setReady] = useState(false);
    const coordinate = getCoordinates(spot);

    useEffect(() => {
        const t = setTimeout(() => setReady(true), READY_FALLBACK_MS);
        return () => clearTimeout(t);
    }, []);

    if (!coordinate) return null;

    const { title } = getSpotName(spot);

    return (
        <Marker
            coordinate={coordinate}
            onPress={() => onPress(spot)}
            tracksViewChanges={!ready}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={selected ? 10 : 1}
            accessibilityLabel={`${title}, ${getMarkerDescription(spot, now)}`}
        >
            {/* iOS: a clear 44 pt box around the pill is the tap target. Android
                cannot draw past 100 px, so there the map's own tap handler
                picks a pin within reach (MapScreen handleMapPress). */}
            <View style={Platform.OS === 'ios' ? styles.target : null}>
                <MarkerBody spot={spot} selected={selected} now={now} onImageLoad={() => setReady(true)} />
            </View>
        </Marker>
    );
}

const styles = StyleSheet.create({
    target: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default memo(SpotMarker);
