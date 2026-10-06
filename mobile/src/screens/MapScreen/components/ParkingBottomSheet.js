import { MaterialCommunityIcons } from '@expo/vector-icons';
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ParkingListItem from '../../../components/ParkingList/ParkingListItem';
import { RADIUS_OPTIONS, metersToWalkMinutes } from '../../../constants/parking';
import { TOKENS, alpha } from '../../../constants/theme';
import { getDistanceLabel } from '../../../utils/parkingHelpers';
import { SCREEN_HEIGHT } from '../constants';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const SHEET_BOTTOM_OFFSET = 10;
const SHEET_EXPANDED_TOP_GAP = 18;

// Inset row separator — aligns under the address text, not the walk-time anchor.
// The walk block (56) + row padding (20) + gap (10) = 86. Letting the walk column
// "run free" vertically makes it read as the anchor for each row.
const RowSeparator = () => <View style={styles.rowSeparator} />;

// Momentum threshold — a quick flick should snap regardless of drag distance.
// Emil: "Don't require dragging past a threshold. If velocity exceeds ~0.11, dismiss."
const VELOCITY_THRESHOLD = 0.11;

// Rubber-band damping factor for over-pull at top boundary.
// Emil: "Things in real life don't suddenly stop; they slow down first."
const RUBBER_BAND_FACTOR = 0.35;

// Fully-expanded translateY. Hoisted to module scope so expandTo's useCallback
// keeps a stable identity across renders — prevents the selectedSpot effect
// that depends on expandTo from re-running on every parent re-render.
const EXPANDED_Y = 0;

// The widest preset — what the empty state offers when nothing is in range.
const WIDEST_RADIUS = RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1].value;

// Radius pills render ~29pt tall; extend the touch area to the 44pt minimum
// for one-handed use without enlarging them. Vertical only — the pills sit
// 8pt apart, so horizontal slop would overlap the neighbouring pill.
const CHIP_HIT_SLOP = { top: 8, bottom: 8 };

// Memoized: the map screen re-renders on every pan settle, and none of the
// sheet's props change then — so the sheet and its list skip that work.
const ParkingBottomSheet = memo(forwardRef(({
    spots,
    selectedSpot,
    searchMode,
    searchRadius,
    onRadiusChange,
    loading = false,
    error = null,
    onRetry,
    getCurrentPrice,
    onItemPress,
    onClearPin,
    onPeekHeightChange,
    tabBarHeight = 80,
    topInset = 0,
}, ref) => {
    const insets = useSafeAreaInsets();
    const listRef = useRef(null);
    // Mirrors the snap state for screen readers: the list below the peek is
    // only exposed to them when it's actually on screen.
    const [isExpanded, setIsExpanded] = useState(false);
    // Start conservatively low — onLayout will set the real height on first
    // paint. Undershooting is safer than overshooting: a slightly-too-short
    // peek is corrected upward once measured; a too-tall peek would leak the
    // list through before correction.
    const [headerHeight, setHeaderHeight] = useState(72);
    const previousPeekY = useRef(null);
    const isDragging = useRef(false);

    const peekHeight = headerHeight;
    const maxHeight = useMemo(() => {
        const availableHeight = Math.max(
            peekHeight,
            SCREEN_HEIGHT - topInset - SHEET_EXPANDED_TOP_GAP - SHEET_BOTTOM_OFFSET
        );
        return Math.min(Math.round(peekHeight + 420), availableHeight);
    }, [peekHeight, topInset]);

    const PEEK_Y = Math.max(0, maxHeight - peekHeight);
    const HIDDEN_Y = maxHeight + 48;
    const translateY = useRef(new Animated.Value(PEEK_Y)).current;
    const dragStartY = useRef(PEEK_Y);

    // Tighter spring for expand (user is waiting to see content)
    const expandTo = useCallback((velocity = 0) => {
        setIsExpanded(true);
        Animated.spring(translateY, {
            toValue: EXPANDED_Y,
            velocity,
            tension: 68,
            friction: 9,
            useNativeDriver: true,
        }).start();
    }, [translateY]);

    // Slightly faster spring for collapse — exit should feel snappier than enter
    const collapseTo = useCallback((velocity = 0) => {
        setIsExpanded(false);
        Animated.spring(translateY, {
            toValue: PEEK_Y,
            velocity,
            tension: 76,
            friction: 10,
            useNativeDriver: true,
        }).start();

        // Coordinate scroll-to-top with collapse — slight delay so both
        // motions feel like one gesture, not a jump-then-slide
        setTimeout(() => {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 80);
    }, [translateY, PEEK_Y]);

    useImperativeHandle(ref, () => ({
        present: () => expandTo(),
        dismiss: () => collapseTo(),
    }));

    // The PanResponder below is created once, so it must read layout and
    // snap functions through refs. Capturing them directly froze the first
    // render's values: on shorter phones, where the sheet height is capped,
    // PEEK_Y changes once the header is measured, and a drag-to-collapse
    // would land at the stale position and cut the header off.
    const gestureRef = useRef({ PEEK_Y, HIDDEN_Y, expandTo, collapseTo });
    gestureRef.current = { PEEK_Y, HIDDEN_Y, expandTo, collapseTo };

    const toggleExpanded = useCallback(() => {
        if (isExpanded) collapseTo();
        else expandTo();
    }, [collapseTo, expandTo, isExpanded]);

    const handleHeaderLayout = useCallback((event) => {
        // Use the header's true measured height — no artificial floor.
        // A floor larger than the real header would expose the listSeparator
        // and first list row through the collapsed peek.
        const measuredHeight = Math.ceil(event.nativeEvent.layout.height);
        if (measuredHeight <= 0) return;
        setHeaderHeight((currentHeight) => (
            Math.abs(currentHeight - measuredHeight) > 1 ? measuredHeight : currentHeight
        ));
    }, []);

    useEffect(() => {
        onPeekHeightChange?.(peekHeight);
    }, [onPeekHeightChange, peekHeight]);

    useEffect(() => {
        const lastPeekY = previousPeekY.current;

        if (lastPeekY == null) {
            translateY.setValue(PEEK_Y);
            dragStartY.current = PEEK_Y;
            previousPeekY.current = PEEK_Y;
            return;
        }

        translateY.stopAnimation((currentValue) => {
            const isMostlyCollapsed = currentValue >= lastPeekY - 16;

            if (isMostlyCollapsed) {
                translateY.setValue(PEEK_Y);
                dragStartY.current = PEEK_Y;
            } else {
                dragStartY.current = currentValue;
            }

            previousPeekY.current = PEEK_Y;
        });
    }, [PEEK_Y, translateY]);

    // When a marker is tapped, expand the sheet first, then scroll to the item.
    // Without this, the scroll fires behind the collapsed sheet — invisible.
    useEffect(() => {
        if (!selectedSpot?.id || !spots.length) {
            return;
        }

        const selectedIndex = spots.findIndex((spot) => spot?.id === selectedSpot.id);
        if (selectedIndex < 0) {
            return;
        }

        // Expand sheet, then scroll after the spring has mostly settled
        expandTo();
        const timer = setTimeout(() => {
            listRef.current?.scrollToIndex({
                index: selectedIndex,
                animated: true,
                viewPosition: 0.45,
            });
        }, 280);

        return () => clearTimeout(timer);
    }, [selectedSpot?.id, spots, expandTo]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) =>
                Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
            onPanResponderGrant: () => {
                // Multi-touch protection: ignore if already dragging
                if (isDragging.current) return;
                isDragging.current = true;

                translateY.stopAnimation((cur) => {
                    dragStartY.current = cur ?? gestureRef.current.PEEK_Y;
                });
            },
            onPanResponderMove: (_, g) => {
                const { HIDDEN_Y: hiddenY } = gestureRef.current;
                const raw = dragStartY.current + g.dy;

                // Rubber-band damping when pulling past the top boundary
                if (raw < EXPANDED_Y) {
                    const overPull = EXPANDED_Y - raw;
                    const damped = EXPANDED_Y - (overPull * RUBBER_BAND_FACTOR);
                    translateY.setValue(damped);
                } else {
                    translateY.setValue(clamp(raw, EXPANDED_Y, hiddenY));
                }
            },
            onPanResponderRelease: (_, g) => {
                isDragging.current = false;

                const { PEEK_Y: peekY, HIDDEN_Y: hiddenY, expandTo: expand, collapseTo: collapse } =
                    gestureRef.current;
                const finalY = clamp(dragStartY.current + g.dy, EXPANDED_Y, hiddenY);
                const velocity = Math.abs(g.vy);

                // Momentum-based snap: a quick flick should decide regardless of position
                if (velocity > VELOCITY_THRESHOLD) {
                    if (g.vy < 0) {
                        expand(g.vy);
                    } else {
                        collapse(g.vy);
                    }
                    return;
                }

                // Position-based snap for slow drags
                const mid = (peekY + EXPANDED_Y) / 2;
                if (finalY <= mid) {
                    expand(g.vy);
                } else {
                    collapse(g.vy);
                }
            },
            // The system took the gesture mid-drag (e.g. an incoming call
            // banner). Clear the multi-touch guard and settle to the nearest
            // snap point instead of leaving the sheet stranded halfway.
            onPanResponderTerminate: () => {
                isDragging.current = false;
                translateY.stopAnimation((cur) => {
                    const { PEEK_Y: peekY, expandTo: expand, collapseTo: collapse } = gestureRef.current;
                    if ((cur ?? peekY) <= (peekY + EXPANDED_Y) / 2) expand();
                    else collapse();
                });
            },
        })
    ).current;

    const renderItem = useCallback(({ item }) => (
        <ParkingListItem
            spot={item}
            price={getCurrentPrice(item)}
            isSelected={selectedSpot?.id === item.id}
            onPress={() => onItemPress(item)}
        />
    ), [getCurrentPrice, onItemPress, selectedSpot?.id]);

    // The title is the one line always visible in the peek, so it carries the
    // load state too — "0 spots nearby" while loading or offline would read
    // as an answer when it's really "we don't know yet".
    const headerTitle = spots.length === 0 && loading
        ? 'Finding parking…'
        : error
            ? "Couldn't load parking"
            : `${spots.length} ${spots.length === 1 ? 'spot' : 'spots'} nearby`;

    return (
        <Animated.View
            style={[
                styles.sheetContainer,
                {
                    bottom: SHEET_BOTTOM_OFFSET,
                    height: maxHeight,
                    transform: [{ translateY }],
                }
            ]}
        >
            <View style={styles.header} onLayout={handleHeaderLayout} {...panResponder.panHandlers}>
                {/* Dragging is the only visual way to open the list, so give
                    screen readers an equivalent: the handle is a button. */}
                <View
                    style={styles.handleHit}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={isExpanded ? 'Collapse spot list' : 'Expand spot list'}
                    accessibilityActions={[{ name: 'activate' }]}
                    onAccessibilityAction={(event) => {
                        if (event.nativeEvent.actionName === 'activate') toggleExpanded();
                    }}
                >
                    <View style={styles.handle} />
                </View>

                <View style={styles.headerContent}>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle} accessibilityLiveRegion="polite">
                            {headerTitle}
                        </Text>
                        <Text style={styles.headerSubtitle} numberOfLines={1}>
                            {error
                                ? 'Check your connection and try again'
                                : selectedSpot?.address
                                    ? `Selected: ${selectedSpot.address}`
                                    : searchMode === 'pinned'
                                        ? 'Around your pinned location'
                                        : 'Near your current location'}
                        </Text>
                    </View>

                    {/* The peek is all most people see, so a failed load is
                        recoverable from here without expanding the sheet. */}
                    {error && onRetry ? (
                        <Pressable
                            style={({ pressed }) => [
                                styles.clearButton,
                                pressed && styles.clearButtonPressed
                            ]}
                            onPress={onRetry}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Try loading parking again"
                        >
                            <MaterialCommunityIcons name="refresh" size={14} color={TOKENS.primary} />
                            <Text style={styles.clearButtonText}>Try again</Text>
                        </Pressable>
                    ) : searchMode === 'pinned' && onClearPin && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.clearButton,
                                pressed && styles.clearButtonPressed
                            ]}
                            onPress={onClearPin}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Clear pinned search location"
                        >
                            <MaterialCommunityIcons
                                name="close-circle"
                                size={14}
                                color={TOKENS.primary}
                                shadowColor={TOKENS.primary}
                            />
                            <Text style={styles.clearButtonText}>Clear pin</Text>
                        </Pressable>
                    )}
                </View>

                {/* Search radius — four familiar presets, right beside the
                    count they change. Switching filters already-fetched spots
                    client-side, so it responds instantly. */}
                {onRadiusChange && (
                    <View style={styles.radiusRow}>
                        <Text style={styles.radiusLabel}>Within</Text>
                        {RADIUS_OPTIONS.map((option) => {
                            const isActive = searchRadius === option.value;
                            return (
                                <Pressable
                                    key={option.value}
                                    style={({ pressed }) => [
                                        styles.radiusChip,
                                        isActive && styles.radiusChipActive,
                                        pressed && styles.radiusChipPressed,
                                    ]}
                                    onPress={() => onRadiusChange(option.value)}
                                    hitSlop={CHIP_HIT_SLOP}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: isActive }}
                                    accessibilityLabel={`Within ${getDistanceLabel(option.value)}, about a ${metersToWalkMinutes(option.value)} minute walk`}
                                >
                                    <Text style={[
                                        styles.radiusChipText,
                                        isActive && styles.radiusChipTextActive,
                                    ]}>
                                        {option.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Below the peek: hidden from screen readers while collapsed, so
                focus never lands on rows that are off screen. */}
            <View
                style={styles.body}
                accessibilityElementsHidden={!isExpanded}
                importantForAccessibility={isExpanded ? 'auto' : 'no-hide-descendants'}
            >
            {spots.length === 0 && loading ? (
                <View style={styles.emptyState}>
                    <ActivityIndicator color={TOKENS.primary} />
                </View>
            ) : spots.length === 0 && error ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <MaterialCommunityIcons name="wifi-off" size={26} color={TOKENS.textMuted} />
                    </View>
                    <Text style={styles.emptyHint}>
                        Spots will show up here as soon as the connection is back.
                    </Text>
                </View>
            ) : spots.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <MaterialCommunityIcons
                            name={searchMode === 'pinned' ? 'map-marker-remove' : 'parking'}
                            size={26}
                            color={TOKENS.textMuted}
                        />
                    </View>
                    <Text style={styles.emptyTitle}>
                        No spots within {getDistanceLabel(searchRadius)}
                    </Text>
                    <Text style={styles.emptyHint}>
                        {searchMode === 'pinned'
                            ? 'Try a wider radius, or move your pin.'
                            : 'Try a wider radius, or set a pin to search somewhere else.'}
                    </Text>
                    {onRadiusChange && searchRadius < WIDEST_RADIUS ? (
                        <Pressable
                            style={({ pressed }) => [
                                styles.emptyAction,
                                pressed && styles.clearButtonPressed,
                            ]}
                            onPress={() => onRadiusChange(WIDEST_RADIUS)}
                            accessibilityRole="button"
                        >
                            <Text style={styles.emptyActionText}>
                                Search within {getDistanceLabel(WIDEST_RADIUS)}
                            </Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : (
                <Animated.FlatList
                    ref={listRef}
                    data={spots}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    ItemSeparatorComponent={RowSeparator}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + tabBarHeight + 16 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    onScrollToIndexFailed={({ index }) => {
                        setTimeout(() => {
                            listRef.current?.scrollToIndex({
                                index,
                                animated: true,
                                viewPosition: 0.45,
                            });
                        }, 120);
                    }}
                />
            )}
            </View>
        </Animated.View>
    );
}));

ParkingBottomSheet.displayName = 'ParkingBottomSheet';

const styles = StyleSheet.create({
    sheetContainer: {
        position: 'absolute',
        left: 10,
        right: 10,
        borderRadius: 22,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        overflow: 'hidden',
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    header: {
        paddingTop: 12,
        paddingBottom: 14,
        backgroundColor: TOKENS.surface,
        // Closing hairline below the header. Living on the header (not as a
        // separate sibling) means it's part of the measured peek height, so
        // the list never peeks through when collapsed.
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: TOKENS.divider,
    },
    // Padding gives the accessibility focus frame some size; the negative
    // top margin cancels it so the handle sits exactly where it did.
    handleHit: {
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingVertical: 6,
        marginTop: -6,
        marginBottom: 6,
    },
    handle: {
        backgroundColor: alpha(TOKENS.text, 0.12),
        width: 36,
        height: 3,
        borderRadius: 2,
    },
    body: {
        flex: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        gap: 12,
    },
    headerInfo: {
        gap: 4,
        flex: 1,
    },
    // Radius presets — same pill recipe as the map header's filter chips.
    radiusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        marginTop: 12,
    },
    radiusLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: TOKENS.textMuted,
        marginRight: 2,
    },
    radiusChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },
    radiusChipActive: {
        backgroundColor: TOKENS.primary,
        borderColor: TOKENS.primary,
    },
    radiusChipPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
    radiusChipText: {
        fontSize: 12,
        fontWeight: '500',
        color: TOKENS.text,
    },
    radiusChipTextActive: {
        color: TOKENS.onPrimary,
        fontWeight: '600',
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.primaryBorder,
    },
    // Scale-based press feedback instead of opacity-only.
    // Emil: "Buttons must feel responsive. Add scale(0.97) on active."
    clearButtonPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
    clearButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: TOKENS.textMuted,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: TOKENS.text,
        letterSpacing: -0.2,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '400',
        color: TOKENS.textMuted,
        lineHeight: 18,
    },
    listContent: {
        paddingTop: 4,
    },
    // Inset so the line begins where the address text begins —
    // padding(20) + walkBlock(56) + gap(10) = 86.
    rowSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: TOKENS.divider,
        marginLeft: 86,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: TOKENS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.text,
        marginBottom: 6,
    },
    emptyHint: {
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.textMuted,
        textAlign: 'center',
        maxWidth: 260,
    },
    // The next best action, not just "nothing here".
    emptyAction: {
        marginTop: 16,
        minHeight: 44,
        paddingHorizontal: 18,
        justifyContent: 'center',
        borderRadius: 999,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.primaryBorder,
    },
    emptyActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.primary,
    },
});

export default ParkingBottomSheet;
