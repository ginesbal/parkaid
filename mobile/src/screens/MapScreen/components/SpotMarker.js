// SpotMarker — a spot on the native map, drawn as a SpotPill; GroupMarker,
// several spots too close to tell apart (utils/mapGroups), as a GroupPill.
//
// react-native-maps snapshots custom marker views. The view is tracked until
// the pin image has loaded (else the snapshot can miss it), then frozen for
// performance. Selection remounts the marker (key in MapOverlays) so it
// re-snapshots with its new look.

import { memo, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { getBlockSide, getCoordinates, getSpotName } from '../../../utils/spotPresentation';
import SpotPill, { GroupBadge, GroupPill, SpotBadge, getGroupDescription, getMarkerDescription } from './SpotPill';

// See SpotBadge: Android crops custom markers to 100x100 px.
const MarkerBody = Platform.OS === 'android' ? SpotBadge : SpotPill;
const GroupBody = Platform.OS === 'android' ? GroupBadge : GroupPill;

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
            accessibilityLabel={[title, getBlockSide(spot), getMarkerDescription(spot, now)].filter(Boolean).join(', ')}
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

// A tap zooms in on the group (MapScreen openGroup). Text only, so it is
// tracked for a moment and then frozen.
export const GroupMarker = memo(function GroupMarker({ group, onPress, now = Date.now() }) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setReady(true), READY_FALLBACK_MS);
        return () => clearTimeout(t);
    }, []);

    return (
        <Marker
            coordinate={group.coordinate}
            onPress={() => onPress(group)}
            tracksViewChanges={!ready}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={2}
            accessibilityLabel={getGroupDescription(group.spots, now)}
            accessibilityHint="Zooms in to show them apart"
        >
            <View style={Platform.OS === 'ios' ? styles.target : null}>
                <GroupBody spots={group.spots} now={now} />
            </View>
        </Marker>
    );
});

const styles = StyleSheet.create({
    target: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default memo(SpotMarker);
