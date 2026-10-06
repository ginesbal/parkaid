import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { TOKENS, alpha } from '../../../../constants/theme';
import { styles } from './styles';

/**
 * EmptyState - Shown when no parking spots are available or loading fails.
 * Says what happened in plain words — never the raw error — and offers the
 * most useful next step.
 */
const EmptyState = ({ onExpandSearch, onViewMap, onRetry, hasError, title, expandLabel, hint }) => {
    // The primary action is the most useful next step: try again after an
    // error, otherwise widen the search — unless there's nothing left to
    // widen, in which case the map becomes the primary action.
    const hasPrimary = hasError || Boolean(expandLabel);

    return (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, hasError && styles.emptyIconError]}>
                <MaterialCommunityIcons
                    name={hasError ? 'wifi-alert' : 'parking'}
                    size={64}
                    color={hasError ? TOKENS.danger : alpha(TOKENS.text, 0.15)}
                />
            </View>

            <Text style={styles.emptyText}>
                {hasError ? 'Couldn’t load parking' : title || 'No spots nearby'}
            </Text>
            <Text style={styles.emptySubtext}>
                {hasError
                    ? 'Check your connection and try again, or browse the map.'
                    : hint}
            </Text>

            <View style={styles.emptyActions}>
                {hasPrimary ? (
                    <Pressable
                        style={({ pressed }) => [
                            styles.emptyButton,
                            pressed && styles.emptyButtonPressed,
                        ]}
                        onPress={hasError ? onRetry : onExpandSearch}
                        accessibilityRole="button"
                        accessibilityLabel={hasError ? 'Try loading parking again' : expandLabel}
                    >
                        <MaterialCommunityIcons
                            name={hasError ? 'refresh' : 'radar'}
                            size={16}
                            color={TOKENS.onPrimary}
                        />
                        <Text style={styles.emptyButtonText}>
                            {hasError ? 'Try again' : expandLabel}
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
                        View map
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

export default EmptyState;
