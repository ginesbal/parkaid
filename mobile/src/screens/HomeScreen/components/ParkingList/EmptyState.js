import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { TOKENS, alpha } from '../../../../constants/theme';
import { styles } from './styles';

/**
 * EmptyState - Shown when no parking spots are available or loading fails
 */
const EmptyState = ({ onExpandSearch, onViewMap, onRetry, errorMessage, expandLabel, hint }) => {
    const isError = Boolean(errorMessage);
    // The primary action is the most useful next step: retry after an error,
    // otherwise widen the search — unless there's nothing left to widen, in
    // which case the map becomes the primary action.
    const hasPrimary = isError || Boolean(expandLabel);

    return (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, isError && styles.emptyIconError]}>
                <MaterialCommunityIcons
                    name={isError ? 'wifi-alert' : 'parking'}
                    size={64}
                    color={isError ? TOKENS.danger : alpha(TOKENS.text, 0.15)}
                />
            </View>

            <Text style={styles.emptyText}>
                {isError ? 'Can\u2019t reach parking data' : 'Nothing nearby right now'}
            </Text>
            <Text style={styles.emptySubtext}>
                {isError
                    ? `${errorMessage} Try again, or switch to the map to browse a different area.`
                    : hint}
            </Text>

            <View style={styles.emptyActions}>
                {hasPrimary ? (
                    <Pressable
                        style={({ pressed }) => [
                            styles.emptyButton,
                            pressed && styles.emptyButtonPressed,
                        ]}
                        onPress={isError ? onRetry : onExpandSearch}
                        accessibilityRole="button"
                        accessibilityLabel={isError ? 'Retry loading parking spots' : expandLabel}
                    >
                        <MaterialCommunityIcons
                            name={isError ? 'refresh' : 'radar'}
                            size={16}
                            color={TOKENS.onPrimary}
                        />
                        <Text style={styles.emptyButtonText}>
                            {isError ? 'Retry' : expandLabel}
                        </Text>
                    </Pressable>
                ) : null}

                <Pressable
                    style={({ pressed }) => [
                        styles.emptyButton,
                        hasPrimary && styles.emptyButtonSecondary,
                        pressed && styles.emptyButtonPressed,
                    ]}
                    onPress={onViewMap}
                    accessibilityRole="button"
                    accessibilityLabel="View parking map"
                >
                    <MaterialCommunityIcons
                        name="map-search-outline"
                        size={16}
                        color={hasPrimary ? TOKENS.text : TOKENS.onPrimary}
                    />
                    <Text style={[styles.emptyButtonText, hasPrimary && styles.emptyButtonTextSecondary]}>
                        View Map
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

export default EmptyState;
