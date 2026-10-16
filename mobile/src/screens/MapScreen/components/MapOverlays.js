import { memo } from 'react';
import { Animated, View } from 'react-native';
import { Circle, Marker } from 'react-native-maps';
import { TOKENS, alpha } from '../../../constants/theme';
import { styles } from '../styles';
import SpotMarker from './SpotMarker';

function MapOverlays({
    searchCenter,
    searchRadius,
    searchMode,
    pinnedLocation,
    pinDropAnim,
    spots,
    selectedSpot,
    onSelectSpot,
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

            {spots.map((spot) => {
                const isSelected = selectedSpot?.id === spot.id;
                // Key on selection so the marker remounts and re-snapshots its new look.
                return (
                    <SpotMarker
                        key={`${spot.id}:${isSelected ? 'on' : 'off'}`}
                        spot={spot}
                        selected={isSelected}
                        onPress={onSelectSpot}
                    />
                );
            })}
        </>
    );
}

export default memo(MapOverlays);
