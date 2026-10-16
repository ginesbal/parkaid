import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { TOKENS, alpha } from '../../../../constants/theme';
import { getDistanceLabel } from '../../../../utils/parkingHelpers';
import { styles } from './styles';

/**
 * EmptyState - Shown when no parking spots are available or loading fails
 */
const MAX_RADIUS = 1000;

const EmptyState = ({ onExpandSearch, onViewMap, onRetry, errorMessage, view, searchRadius }) => {
    const isError = Boolean(errorMessage);
    const covered = view === 'covered';
    // At the widest radius there is nothing left to expand; the map is the next step.
    const canExpand = !isError && searchRadius < MAX_RADIUS;
    const within = getDistanceLabel(searchRadius);

    let title = 'Nothing nearby right now';
    let body = 'Try widening the search radius, or switch to the map to look around the next block.';
    if (isError) {
        title = 'Can\u2019t reach parking data';
        body = `${String(errorMessage).replace(/\.?$/, '.')} Try again, or switch to the map to browse a different area.`;
    } else if (covered) {
        title = `No parkades within ${within}`;
        body = canExpand
            ? 'Parkades are few and far between. Widen the search, or look on the map.'
            : 'Try the map, or switch to Near me for street and surface parking.';
    } else if (!canExpand) {
        title = `Nothing within ${within}`;
        body = 'Switch to the map to look around a different area.';
    }

    return (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, isError && styles.emptyIconError]}>
                <MaterialCommunityIcons
                    name={isError ? 'wifi-alert' : 'parking'}
                    size={64}
                    color={isError ? TOKENS.danger : alpha(TOKENS.text, 0.15)}
                />
            </View>

            <Text style={styles.emptyText} accessibilityRole="header">{title}</Text>
            <Text style={styles.emptySubtext}>{body}</Text>

            <View style={styles.emptyActions}>
                {isError || canExpand ? (
                    <Pressable
                        style={({ pressed }) => [
                            styles.emptyButton,
                            pressed && styles.emptyButtonPressed,
                        ]}
                        onPress={isError ? onRetry : onExpandSearch}
                        accessibilityRole="button"
                        accessibilityLabel={isError ? 'Retry loading parking spots' : 'Expand search radius'}
                    >
                        <MaterialCommunityIcons
                            name={isError ? 'refresh' : 'radar'}
                            size={16}
                            color="#fff"
                        />
                        <Text style={styles.emptyButtonText}>
                            {isError ? 'Retry' : `Search ${getDistanceLabel(MAX_RADIUS)}`}
                        </Text>
                    </Pressable>
                ) : null}

                <Pressable
                    style={({ pressed }) => [
                        styles.emptyButton,
                        styles.emptyButtonSecondary,
                        pressed && styles.emptyButtonPressed,
                    ]}
                    onPress={onViewMap}
                    accessibilityRole="button"
                    accessibilityLabel="View parking map"
                >
                    <MaterialCommunityIcons
                        name="map-search-outline"
                        size={16}
                        color={TOKENS.text}
                    />
                    <Text style={[styles.emptyButtonText, styles.emptyButtonTextSecondary]}>
                        View Map
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

export default EmptyState;
