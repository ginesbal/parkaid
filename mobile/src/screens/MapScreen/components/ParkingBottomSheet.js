import { MaterialCommunityIcons } from '@expo/vector-icons';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandLoader from '../../../components/BrandLoader';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import ParkingListItem from '../../../components/ParkingList/ParkingListItem';
import { MOTION, RADIUS, SPACING, TOKENS, alpha } from '../../../constants/theme';
import { getDistanceLabel } from '../../../utils/parkingHelpers';
import {
    getRateDisplay,
    getSpotName,
    getWalkLabel,
    getZoneLabel,
} from '../../../utils/spotPresentation';
import { SCREEN_HEIGHT } from '../constants';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const SHEET_BOTTOM_OFFSET = 10;
const SHEET_EXPANDED_TOP_GAP = 18;

// Inset row separator — aligns under the address text, not the walk-time anchor.
// The walk block (44) + row padding (20) + gap (10) = 74. Letting the walk column
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

const ParkingBottomSheet = forwardRef(({
    spots,
    loading = false,
    selectedSpot,
    featuredSpot,
    searchMode,
    searchRadius,
    onItemPress,
    onViewSpot,
    onClearPin,
    onPeekHeightChange,
    tabBarHeight = 80,
    topInset = 0,
}, ref) => {
    const insets = useSafeAreaInsets();
    const listRef = useRef(null);
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

    // Under reduce motion the sheet snaps instead of springing.
    const reduceMotion = useReduceMotion();

    // Tighter spring for expand (user is waiting to see content)
    const expandTo = useCallback((velocity = 0) => {
        if (reduceMotion) {
            translateY.stopAnimation();
            translateY.setValue(EXPANDED_Y);
            return;
        }
        Animated.spring(translateY, {
            toValue: EXPANDED_Y,
            velocity,
            ...MOTION.spring,
            useNativeDriver: true,
        }).start();
    }, [translateY, reduceMotion]);

    // Slightly faster spring for collapse — exit should feel snappier than enter
    const collapseTo = useCallback((velocity = 0) => {
        if (reduceMotion) {
            translateY.stopAnimation();
            translateY.setValue(PEEK_Y);
        } else {
            Animated.spring(translateY, {
                toValue: PEEK_Y,
                velocity,
                ...MOTION.springExit,
                useNativeDriver: true,
            }).start();
        }

        // Coordinate scroll-to-top with collapse — slight delay so both
        // motions feel like one gesture, not a jump-then-slide
        setTimeout(() => {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 80);
    }, [translateY, PEEK_Y, reduceMotion]);

    // The pan responder is created once; it reads these through a ref so it
    // always snaps to the measured peek, not the first render's estimate.
    const latest = useRef({});
    latest.current = { PEEK_Y, HIDDEN_Y, expandTo, collapseTo };

    useImperativeHandle(ref, () => ({
        present: () => expandTo(),
        dismiss: () => collapseTo(),
    }));

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
                    dragStartY.current = cur ?? latest.current.PEEK_Y;
                });
            },
            onPanResponderMove: (_, g) => {
                const raw = dragStartY.current + g.dy;

                // Rubber-band damping when pulling past the top boundary
                if (raw < EXPANDED_Y) {
                    const overPull = EXPANDED_Y - raw;
                    const damped = EXPANDED_Y - (overPull * RUBBER_BAND_FACTOR);
                    translateY.setValue(damped);
                } else {
                    translateY.setValue(clamp(raw, EXPANDED_Y, latest.current.HIDDEN_Y));
                }
            },
            onPanResponderRelease: (_, g) => {
                isDragging.current = false;

                const finalY = clamp(dragStartY.current + g.dy, EXPANDED_Y, latest.current.HIDDEN_Y);
                const velocity = Math.abs(g.vy);

                // Momentum-based snap: a quick flick should decide regardless of position
                if (velocity > VELOCITY_THRESHOLD) {
                    if (g.vy < 0) {
                        latest.current.expandTo(g.vy);
                    } else {
                        latest.current.collapseTo(g.vy);
                    }
                    return;
                }

                // Position-based snap for slow drags
                const mid = (latest.current.PEEK_Y + EXPANDED_Y) / 2;
                if (finalY <= mid) {
                    latest.current.expandTo(g.vy);
                } else {
                    latest.current.collapseTo(g.vy);
                }
            },
        })
    ).current;

    const renderItem = useCallback(({ item }) => (
        <ParkingListItem
            spot={item}
            isSelected={selectedSpot?.id === item.id}
            onPress={() => onItemPress(item)}
        />
    ), [onItemPress, selectedSpot?.id]);

    const pinned = searchMode === 'pinned';
    const within = getDistanceLabel(searchRadius);
    let countLine;
    if (loading && spots.length === 0) countLine = 'Finding spots\u2026';
    else if (loading) countLine = 'Updating for this area\u2026';
    else if (spots.length === 0) countLine = `No places within ${within}`;
    else countLine = `${spots.length} ${spots.length === 1 ? 'place' : 'places'} within ${within}`;

    const featured = featuredSpot ? {
        reason: selectedSpot?.id === featuredSpot.id ? 'Selected' : 'Closest to you',
        name: getSpotName(featuredSpot).title,
        // Zone and walk fit one line; the maximum stay is on Details.
        meta: [getZoneLabel(featuredSpot), getWalkLabel(featuredSpot)]
            .filter(Boolean)
            .join(' \u00B7 '),
        rate: getRateDisplay(featuredSpot),
    } : null;

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
                <View style={styles.handle} />

                <View style={styles.headerContent}>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle} accessibilityRole="header">
                            {pinned ? 'Parking around your pin' : 'Parking around you'}
                        </Text>
                        <Text style={styles.headerSubtitle} numberOfLines={1}>
                            {countLine}
                        </Text>
                    </View>

                    {pinned && onClearPin && (
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
                            />
                            <Text style={styles.clearButtonText}>Clear pin</Text>
                        </Pressable>
                    )}
                </View>

                {/* Featured spot: the selected marker, else the closest suggestion.
                    Part of the measured peek, so it shows while collapsed. */}
                {featured ? (
                    <View style={styles.featuredWrap}>
                        <View
                            style={styles.featured}
                            accessible
                            accessibilityLabel={`${featured.reason}. ${featured.name}. ${featured.meta}. ${featured.rate.amount ? `${featured.rate.amount} per hour` : featured.rate.note}.`}
                        >
                            <View style={styles.featuredInfo}>
                                <Text style={styles.featuredReason}>{featured.reason}</Text>
                                <Text style={styles.featuredName} numberOfLines={1}>{featured.name}</Text>
                                {featured.meta ? (
                                    <Text style={styles.featuredMeta} numberOfLines={1}>{featured.meta}</Text>
                                ) : null}
                            </View>
                            {featured.rate.amount ? (
                                <Text style={styles.featuredPrice}>
                                    {featured.rate.amount}
                                    <Text style={styles.featuredUnit}>{'\n'}{featured.rate.unit}</Text>
                                </Text>
                            ) : (
                                <Text style={styles.featuredNote}>{featured.rate.short}</Text>
                            )}
                        </View>
                        <Pressable
                            onPress={() => onViewSpot(featuredSpot)}
                            style={({ pressed }) => [styles.viewButton, pressed && styles.viewButtonPressed]}
                            accessibilityRole="button"
                            accessibilityLabel={`View parking at ${featured.name}`}
                        >
                            <Text style={styles.viewButtonText}>View parking</Text>
                        </Pressable>
                    </View>
                ) : null}
            </View>

            {loading && spots.length === 0 ? (
                <View style={styles.emptyState}>
                    <BrandLoader size={56} label="Finding spots around here" delay={150} />
                </View>
            ) : spots.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <MaterialCommunityIcons
                            name={searchMode === 'pinned' ? 'map-marker-remove' : 'parking'}
                            size={28}
                            color={TOKENS.textFaint}
                        />
                    </View>
                    <Text style={styles.emptyTitle}>No spots in this area</Text>
                    <Text style={styles.emptyHint}>
                        {searchMode === 'pinned'
                            ? 'Move your pin or widen the radius'
                            : 'Pan or zoom the map to search elsewhere'}
                    </Text>
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
        </Animated.View>
    );
});

ParkingBottomSheet.displayName = 'ParkingBottomSheet';

const styles = StyleSheet.create({
    sheetContainer: {
        position: 'absolute',
        left: 10,
        right: 10,
        borderRadius: 18,
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
        // Dragging the header moves the sheet; never start a text selection (web).
        userSelect: 'none',
        paddingTop: 12,
        paddingBottom: 14,
        backgroundColor: TOKENS.surface,
        // Closing hairline below the header. Living on the header (not as a
        // separate sibling) means it's part of the measured peek height, so
        // the list never peeks through when collapsed.
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: TOKENS.divider,
    },
    handle: {
        alignSelf: 'center',
        backgroundColor: alpha(TOKENS.text, 0.12),
        width: 36,
        height: 3,
        borderRadius: 2,
        marginBottom: 12,
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
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.primaryBorder,
    },
    // Scale-based press feedback instead of opacity-only.
    // Emil: "Buttons must feel responsive. Add scale(0.97) on active."
    clearButtonPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.8,
    },
    clearButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: TOKENS.textMuted,
    },
    headerTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: -0.2,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '400',
        color: TOKENS.textMuted,
        lineHeight: 18,
    },
    featuredWrap: {
        paddingHorizontal: 20,
        paddingTop: SPACING.md,
        gap: SPACING.md,
    },
    featured: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.surfaceMuted,
    },
    featuredInfo: {
        flex: 1,
        minWidth: 0,
    },
    featuredReason: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '600',
        color: TOKENS.primaryInk,
    },
    featuredName: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: '600',
        color: TOKENS.text,
    },
    featuredMeta: {
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.textMuted,
    },
    featuredPrice: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: '600',
        color: TOKENS.text,
        textAlign: 'right',
        fontVariant: ['tabular-nums'],
    },
    featuredUnit: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400',
        color: TOKENS.textMuted,
    },
    featuredNote: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.textMuted,
    },
    viewButton: {
        minHeight: 48,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewButtonPressed: {
        opacity: 0.85,
    },
    viewButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.surface,
    },
    listContent: {
        paddingTop: 4,
    },
    // Inset so the line begins where the address text begins —
    // padding(20) + walkBlock(44) + gap(10) = 74.
    rowSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: TOKENS.divider,
        marginLeft: 74,
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
        borderRadius: 12,
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
});

export default ParkingBottomSheet;
