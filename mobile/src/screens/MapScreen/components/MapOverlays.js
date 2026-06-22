import { memo } from 'react';
import { View } from 'react-native';
import { Circle, Marker } from 'react-native-maps';
import { TOKENS, alpha } from '../../../constants/theme';
import { styles } from '../styles';

function MapOverlays({
    searchCenter,
    searchRadius,
    searchMode,
    pinnedLocation,
    placingPin,
    spots,
    selectedSpot,
    onSelectSpot,
}) {
    return (
        <>
            {/* Radius ring — hidden while placing, when the center is moving and
                the reticle alone communicates the target. Shown for a settled
                current/pinned search so the area reads clearly. */}
            {!placingPin && searchCenter && (
                <Circle
                    center={searchCenter}
                    radius={searchRadius}
                    fillColor={alpha(TOKENS.primary, 0.06)}
                    strokeColor={alpha(TOKENS.primary, 0.22)}
                    strokeWidth={2}
                />
            )}

            {/* Confirmed pin — a static marker (no entrance spring, so it is
                safe with tracksViewChanges=false). The animated drop now lives
                on the screen-fixed reticle, not here. */}
            {!placingPin && pinnedLocation && searchMode === 'pinned' && (
                <Marker
                    coordinate={pinnedLocation}
                    anchor={{ x: 0.5, y: 1 }}
                    tracksViewChanges={false}
                >
                    <View style={styles.pinMarker}>
                        <View style={styles.pinHead}>
                            <View style={styles.pinInner} />
                        </View>
                        <View style={styles.pinStem} />
                    </View>
                </Marker>
            )}

            {spots.map(spot => {
                if (!spot.coordinates) return null;
                const coords = {
                    latitude: spot.coordinates.coordinates[1],
                    longitude: spot.coordinates.coordinates[0],
                };
                const isSelected = selectedSpot?.id === spot.id;

                return (
                    <Marker
                        key={spot.id}
                        coordinate={coords}
                        onPress={() => onSelectSpot(spot)}
                        tracksViewChanges={false}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.marker}>
                            <View
                                style={[
                                    isSelected ? styles.markerDotSelected : styles.markerDot,
                                    !isSelected && spot.no_stopping && { backgroundColor: TOKENS.danger },
                                ]}
                            />
                        </View>
                    </Marker>
                );
            })}
        </>
    );
}

export default memo(MapOverlays);
