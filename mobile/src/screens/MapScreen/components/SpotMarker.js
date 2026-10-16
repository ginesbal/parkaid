// SpotMarker — a spot on the native map, drawn as a SpotPill.
//
// react-native-maps snapshots custom marker views. The view is tracked until
// the pin image has loaded (else the snapshot can miss it), then frozen for
// performance. Selection remounts the marker (key in MapOverlays) so it
// re-snapshots with its new look.

import { memo, useEffect, useState } from 'react';
import { Marker } from 'react-native-maps';
import { getCoordinates, getSpotName } from '../../../utils/spotPresentation';
import SpotPill, { getPillLabel } from './SpotPill';

// Fallback in case onLoad never fires (cached images on some Android builds).
const READY_FALLBACK_MS = 600;

function SpotMarker({ spot, selected, onPress }) {
    const [ready, setReady] = useState(false);
    const coordinate = getCoordinates(spot);

    useEffect(() => {
        const t = setTimeout(() => setReady(true), READY_FALLBACK_MS);
        return () => clearTimeout(t);
    }, []);

    if (!coordinate) return null;

    const label = getPillLabel(spot);
    const { title } = getSpotName(spot);

    return (
        <Marker
            coordinate={coordinate}
            onPress={() => onPress(spot)}
            tracksViewChanges={!ready}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={selected ? 10 : 1}
            accessibilityLabel={`${title}${label ? `, ${label} per hour` : ''}`}
        >
            <SpotPill spot={spot} selected={selected} onImageLoad={() => setReady(true)} />
        </Marker>
    );
}

export default memo(SpotMarker);
