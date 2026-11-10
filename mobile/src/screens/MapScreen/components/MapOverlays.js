import { memo } from 'react';
import { Animated, View } from 'react-native';
import { Circle, Marker } from 'react-native-maps';
import { TOKENS, alpha } from '../../../constants/theme';
import { styles } from '../styles';
import SpotMarker, { GroupMarker } from './SpotMarker';
import { getGroupLabel, getMarkerKind } from './SpotPill';

function MapOverlays({
    searchCenter,
    searchRadius,
    searchMode,
    pinnedLocation,
    pinDropAnim,
    // The pins, with spots too close to tell apart grouped (utils/mapGroups).
    groups,
    selectedSpot,
    onSelectSpot,
    onOpenGroup,
    // The time the pins are drawn for (useMinute).
    now = Date.now(),
}) {
    return (
        <>
            {searchCenter && (
                <Circle
                    center={searchCenter}
                    radius={searchRadius}
                    fillColor={alpha(
                        searchMode === 'pinned' ? TOKENS.textMuted : TOKENS.primary,
                        0.06
                    )}
                    strokeColor={alpha(
                        searchMode === 'pinned' ? TOKENS.textMuted : TOKENS.primary,
                        0.22
                    )}
                    strokeWidth={2}
                    lineDashPattern={searchMode === 'pinned' ? [8, 4] : null}
                />
            )}

            {pinnedLocation && (
                <Marker coordinate={pinnedLocation} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
                    <Animated.View
                        style={[
                            styles.pinMarker,
                            {
                                transform: [
                                    { scale: pinDropAnim },
                                    { translateY: pinDropAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.pinHead}>
                            <View style={styles.pinInner} />
                        </View>
                        <View style={styles.pinStem} />
                    </Animated.View>
                </Marker>
            )}

            {groups.map((group) => {
                // Keys carry what the pin shows, so the marker remounts and
                // re-snapshots its new look (a restriction starting, say).
                if (group.spots.length > 1) {
                    return (
                        <GroupMarker
                            key={`${group.key}:${getGroupLabel(group.spots, now)}`}
                            group={group}
                            onPress={onOpenGroup}
                            now={now}
                        />
                    );
                }
                const spot = group.lead;
                const isSelected = selectedSpot?.id === spot.id;
                return (
                    <SpotMarker
                        key={`${spot.id}:${isSelected ? 'on' : 'off'}:${getMarkerKind(spot, now)}`}
                        spot={spot}
                        selected={isSelected}
                        onPress={onSelectSpot}
                        now={now}
                    />
                );
            })}
        </>
    );
}

export default memo(MapOverlays);
