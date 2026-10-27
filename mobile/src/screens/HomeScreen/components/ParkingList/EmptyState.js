import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { TOKENS, alpha } from '../../../../constants/theme';
import { getLoadError } from '../../../../utils/loadStatus';
import { getDistanceLabel } from '../../../../utils/parkingHelpers';
import { styles } from './styles';

/**
 * EmptyState - Shown when no parking spots are available or loading fails.
 * A failure is said once, by what went wrong (`error`: 'offline', 'timeout'
 * or 'server'), with a neutral icon and two ways forward: try again, or start
 * a session on Park with the zone on the sign, which needs no data.
 */
const MAX_RADIUS = 1000;

const EmptyState = ({ onExpandSearch, onViewMap, onStartSession, onRetry, error, type = 'all', searchRadius }) => {
    const isError = Boolean(error);
    const parkades = type === 'parkade';
    // At the widest radius there is nothing left to expand; the map is the next step.
    const canExpand = !isError && searchRadius < MAX_RADIUS;
    const within = getDistanceLabel(searchRadius);
    const failure = isError ? getLoadError(error) : null;

    let title = 'Nothing nearby right now';
    let body = 'Search farther away, or look around the next block on the map.';
    if (isError) {
        title = failure.title;
        body = `${failure.body} Already parked? You can still start a session with the zone on the sign.`;
    } else if (parkades) {
        title = `No parkades within ${within}`;
        body = canExpand
            ? 'Parkades are few and far between. Widen the search, or look on the map.'
            : 'Try the map, or pick another parking type in Filters.';
    } else if (!canExpand) {
        title = `Nothing within ${within}`;
        body = 'Switch to the map to look around a different area.';
    }

    return (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                    name={isError ? failure.icon : 'parking'}
                    size={40}
                    color={alpha(TOKENS.text, 0.25)}
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
                    >
                        <MaterialCommunityIcons
                            name={isError ? 'refresh' : 'radar'}
                            size={18}
                            color={TOKENS.surface}
                        />
                        <Text style={styles.emptyButtonText}>
                            {isError ? 'Try again' : `Search ${getDistanceLabel(MAX_RADIUS)}`}
                        </Text>
                    </Pressable>
                ) : null}

                {/* The map needs the same connection, so after a failure the
                    way out is a session with the zone on the sign. */}
                <Pressable
                    style={({ pressed }) => [
                        styles.emptyButton,
                        styles.emptyButtonSecondary,
                        pressed && styles.emptyButtonPressed,
                    ]}
                    onPress={isError ? onStartSession : onViewMap}
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons
                        name={isError ? 'timer-outline' : 'map-search-outline'}
                        size={18}
                        color={TOKENS.primaryInk}
                    />
                    <Text style={[styles.emptyButtonText, styles.emptyButtonTextSecondary]}>
                        {isError ? 'Start a session' : 'View map'}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

export default EmptyState;
