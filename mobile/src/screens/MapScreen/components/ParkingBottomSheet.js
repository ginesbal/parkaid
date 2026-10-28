import { MaterialCommunityIcons } from '@expo/vector-icons';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import BrandLoader from '../../../components/BrandLoader';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import SpotRow from '../../../components/SpotRow';
import { LAYOUT, MOTION, RADIUS, SPACING, TOKENS, alpha } from '../../../constants/theme';
import { describeSaved, getLoadError } from '../../../utils/loadStatus';
import { getDistanceLabel } from '../../../utils/parkingHelpers';
import {
    getCaution,
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

// What to try when an area has no parking. The web map has no pin to move
// and no filters, so there it is always the map itself.
const EMPTY_HINT = {
    current: 'Drag the map, then tap Search this area.',
    pinned: Platform.OS === 'web'
        ? 'Drag the map, then tap Search this area.'
        : 'Move your pin, or pick a wider distance in the filters.',
};

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
    // Why the last load failed ('offline', 'timeout', 'server'; see
    // utils/loadStatus), and how old the shown spots are.
    error = null,
    savedAt = null,
    stale = null,
    onRetry,
    selectedSpot,
    featuredSpot,
    // The time cautions are for (useMinute).
    now = Date.now(),
    searchMode,
    // The search is around downtown, not the driver (see MapScreen).
    fromDowntown = false,
    // "Parkades only" when the list is narrowed to one type (utils/filters).
    typeNote = null,
    searchRadius,
    onItemPress,
    onViewSpot,
    onClearPin,
    onPeekHeightChange,
    tabBarHeight = 80,
    topInset = 0,
    // Height of the screen area the sheet lives in (the tab scene, above the
    // tab bar). Falls back to the window minus the tab bar until measured.
    containerHeight = null,
}, ref) => {
    const listRef = useRef(null);
    const wide = useWindowDimensions().width >= LAYOUT.wide;
    // Start conservatively low — onLayout will set the real height on first
    // paint. Undershooting is safer than overshooting: a slightly-too-short
    // peek is corrected upward once measured; a too-tall peek would leak the
    // list through before correction.
    const [headerHeight, setHeaderHeight] = useState(72);
    const previousPeekY = useRef(null);
    const isDragging = useRef(false);

    const peekHeight = headerHeight;
    const maxHeight = useMemo(() => {
        const sceneHeight = containerHeight ?? (SCREEN_HEIGHT - tabBarHeight);
        const availableHeight = Math.max(
            peekHeight,
            sceneHeight - topInset - SHEET_EXPANDED_TOP_GAP - SHEET_BOTTOM_OFFSET
        );
        return Math.min(Math.round(peekHeight + 420), availableHeight);
    }, [peekHeight, topInset, containerHeight, tabBarHeight]);

    // The featured block's last measured height, reserved while loading or
    // empty so the peek (and the map padding that follows it) does not jump.
    // 151 = top gap 12 + card 79 + gap 12 + button 48, until first measured.
    const [featuredHeight, setFeaturedHeight] = useState(151);

    const PEEK_Y = Math.max(0, maxHeight - peekHeight);
    const HIDDEN_Y = maxHeight + 48;
    const translateY = useRef(new Animated.Value(PEEK_Y)).current;
    const dragStartY = useRef(PEEK_Y);

    // Under reduce motion the sheet snaps instead of springing.
    const reduceMotion = useReduceMotion();

    // Whether the list is open; said by the handle and the Show all button.
    const [expanded, setExpanded] = useState(false);

    // Tighter spring for expand (user is waiting to see content)
    const expandTo = useCallback((velocity = 0) => {
        setExpanded(true);
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
        setExpanded(false);
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

    // Not only by dragging: a tap on the handle or Show all, or a screen
    // reader's expand and collapse actions.
    const toggle = useCallback(() => (expanded ? collapseTo() : expandTo()), [expanded, expandTo, collapseTo]);
    const handleAccessibilityAction = useCallback((event) => {
        const action = event.nativeEvent.actionName;
        if (action === 'expand') expandTo();
        else if (action === 'collapse') collapseTo();
        else if (action === 'activate') toggle();
    }, [expandTo, collapseTo, toggle]);

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
                // 10pt, about a touch slop: a tap that wobbles a little stays a tap.
                Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
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

    const renderItem = useCallback(({ item, index }) => (
        <SpotRow
            spot={item}
            selected={selectedSpot?.id === item.id}
            onPress={onItemPress}
            first={index === 0}
            last={index === spots.length - 1}
            inset={16}
            now={now}
        />
    ), [onItemPress, selectedSpot?.id, spots.length, now]);

    const pinned = searchMode === 'pinned';
    // The count says how far its places really are: the radius, or the
    // farthest place (to the next 50 m) if one lies beyond it.
    const farthest = Math.max(0, ...spots.map((s) => Number(s.distance) || 0));
    const within = getDistanceLabel(Math.max(searchRadius, Math.ceil(farthest / 50) * 50));
    const failure = error && !loading && spots.length === 0 ? getLoadError(error) : null;
    const saved = describeSaved({ savedAt, stale });
    let countLine;
    if (loading && spots.length === 0) countLine = 'Finding parking\u2026';
    else if (loading) countLine = 'Updating for this area\u2026';
    else if (failure) countLine = failure.title;
    else if (spots.length === 0) countLine = `No parking within ${within}`;
    else if (saved) countLine = `${spots.length} ${spots.length === 1 ? 'spot' : 'spots'} \u00B7 ${saved}`;
    else countLine = `${spots.length} ${spots.length === 1 ? 'spot' : 'spots'} within ${within}`;
    // A list narrowed to one type says so ("Parkades only").
    if (typeNote && !loading && !failure) countLine = `${countLine} \u00B7 ${typeNote}`;

    const featured = featuredSpot ? {
        reason: selectedSpot?.id === featuredSpot.id
            ? 'Selected'
            : pinned ? 'Closest to your pin' : fromDowntown ? 'Closest to downtown' : 'Closest to you',
        name: getSpotName(featuredSpot).title,
        // Zone and walk; a maximum stay under 2 hours too, since it changes
        // the choice. Longer ones are on Details.
        meta: [getZoneLabel(featuredSpot), getWalkLabel(featuredSpot)]
            .filter(Boolean)
            .join(' \u00B7 '),
        limit: getCaution(featuredSpot, now),
        rate: getRateDisplay(featuredSpot, now),
    } : null;

    return (
        <Animated.View
            style={[
                styles.sheetContainer,
                wide && styles.sheetPanel,
                {
                    bottom: SHEET_BOTTOM_OFFSET,
                    height: maxHeight,
                    transform: [{ translateY }],
                }
            ]}
        >
            <View style={styles.header} onLayout={handleHeaderLayout} {...panResponder.panHandlers}>
                <Pressable
                    onPress={toggle}
                    style={styles.grabber}
                    hitSlop={{ top: 12, bottom: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Parking list"
                    accessibilityHint={expanded ? 'Hides the list' : 'Shows the list'}
                    aria-expanded={expanded}
                    accessibilityActions={[
                        { name: 'activate' },
                        { name: 'expand', label: 'Show all spots' },
                        { name: 'collapse', label: 'Hide the list' },
                    ]}
                    onAccessibilityAction={handleAccessibilityAction}
                >
                    <View style={styles.handle} />
                </Pressable>

                <View style={styles.headerContent}>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle} accessibilityRole="header">
                            {pinned ? 'Parking around your pin' : fromDowntown ? 'Parking around downtown' : 'Parking around you'}
                        </Text>
                        <Text style={styles.headerSubtitle} numberOfLines={1}>
                            {countLine}
                        </Text>
                    </View>

                    {/* A round ×, as maps close a dropped pin, so the title keeps one line */}
                    {pinned && onClearPin && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.clearButton,
                                pressed && styles.clearButtonPressed
                            ]}
                            onPress={onClearPin}
                            accessibilityRole="button"
                            accessibilityLabel="Clear pin"
                            accessibilityHint="Lists parking around you again"
                        >
                            <MaterialCommunityIcons name="close-circle" size={26} color={TOKENS.textMuted} />
                        </Pressable>
                    )}
                </View>

                {/* Featured spot: the selected marker, else the closest suggestion.
                    Part of the measured peek, so it shows while collapsed. */}
                {featured ? (
                    <View
                        style={styles.featuredWrap}
                        onLayout={(e) => {
                            const h = Math.ceil(e.nativeEvent.layout.height);
                            if (h > 0) setFeaturedHeight((cur) => (Math.abs(cur - h) > 1 ? h : cur));
                        }}
                    >
                        <View
                            style={styles.featured}
                            accessible
                            accessibilityLabel={`${[featured.reason, featured.name, featured.meta, featured.limit, featured.rate.spoken].filter(Boolean).join('. ')}.`}
                        >
                            <View style={styles.featuredInfo}>
                                <Text style={styles.featuredReason}>{featured.reason}</Text>
                                <Text style={styles.featuredName} numberOfLines={1}>{featured.name}</Text>
                                {featured.meta ? (
                                    <Text style={styles.featuredMeta} numberOfLines={2}>
                                        {featured.meta}
                                        {featured.limit ? <Text style={styles.featuredLimit}>{` · ${featured.limit}`}</Text> : null}
                                    </Text>
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
                            accessibilityLabel={`View spot: ${featured.name}`}
                        >
                            <Text style={styles.viewButtonText}>View spot</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={[styles.featuredWrap, styles.statusSlot, loading && styles.statusLoading, { minHeight: featuredHeight }]}>
                        {loading ? (
                            <BrandLoader size={40} label="Finding parking around here" delay={150} />
                        ) : failure ? (
                            <>
                                <Text style={styles.emptyHint}>{failure.body}</Text>
                                {onRetry ? (
                                    <Pressable
                                        onPress={onRetry}
                                        style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.retryText}>Try again</Text>
                                    </Pressable>
                                ) : null}
                            </>
                        ) : (
                            <>
                                <Text style={styles.emptyTitle}>No parking in this area</Text>
                                <Text style={styles.emptyHint}>{EMPTY_HINT[pinned ? 'pinned' : 'current']}</Text>
                            </>
                        )}
                    </View>
                )}

                {/* The list, by a tap as well as a drag */}
                {spots.length > 1 ? (
                    <Pressable
                        onPress={toggle}
                        style={({ pressed }) => [styles.showAll, pressed && styles.showAllPressed]}
                        accessibilityRole="button"
                        aria-expanded={expanded}
                    >
                        <Text style={styles.showAllText}>
                            {expanded ? 'Hide the list' : `Show all ${spots.length} spots`}
                        </Text>
                        <MaterialCommunityIcons
                            name={expanded ? 'chevron-down' : 'chevron-up'}
                            size={18}
                            color={TOKENS.primaryInk}
                        />
                    </Pressable>
                ) : null}
            </View>

            <Animated.FlatList
                ref={listRef}
                data={spots}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={[
                    styles.listContent,
                    // The scene already ends above the tab bar.
                    { paddingBottom: SHEET_BOTTOM_OFFSET + 16 },
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
    // On a wide window: a panel on the left, as maps do in a browser, so the
    // map keeps the rest of the width.
    sheetPanel: {
        left: SPACING.lg,
        right: undefined,
        width: LAYOUT.panel,
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
    // A visible handle that also toggles the list; 44 pt tall with its slop.
    // 44 pt to the finger: hitSlop on the phones. The web has no hitSlop, so
    // there the box itself is taller, with margins that keep the handle put.
    grabber: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: { height: 44, marginTop: -22, marginBottom: -6 },
            default: { height: 24, marginTop: -12, marginBottom: 4 },
        }),
    },
    handle: {
        backgroundColor: alpha(TOKENS.text, 0.28),
        width: 40,
        height: 5,
        borderRadius: 3,
    },
    showAll: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minHeight: 44,
        marginTop: 4,
        marginBottom: -10,
    },
    showAllPressed: {
        opacity: 0.6,
    },
    showAllText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.primaryInk,
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
    // 44 pt to the finger; the icon's edge lines up with the sheet's padding.
    clearButton: {
        width: 44,
        height: 44,
        marginRight: -9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Scale-based press feedback instead of opacity-only.
    // Emil: "Buttons must feel responsive. Add scale(0.97) on active."
    clearButtonPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.8,
    },
    headerTitle: {
        fontSize: 20,
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
    // Sits straight on the sheet, not in a grey card inside it.
    featured: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
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
        fontSize: 14,
        lineHeight: 18,
        color: TOKENS.textMuted,
    },
    // A short maximum stay, in the warning colour: it changes the choice.
    featuredLimit: {
        fontWeight: '500',
        color: TOKENS.warningInk,
    },
    featuredPrice: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: '500',
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
        fontSize: 14,
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
        paddingTop: 12,
    },
    // Empty and failed: said from the left edge, as on Home. The loader sits
    // in the middle.
    statusSlot: {
        justifyContent: 'center',
    },
    statusLoading: {
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.text,
        marginBottom: 6,
    },
    emptyHint: {
        fontSize: 14,
        lineHeight: 18,
        color: TOKENS.textMuted,
    },
    // A text button, lined up with the message above it.
    retry: {
        alignSelf: 'flex-start',
        minHeight: 44,
        marginTop: SPACING.xs,
        justifyContent: 'center',
    },
    retryPressed: {
        opacity: 0.6,
    },
    retryText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.primaryInk,
    },
});

export default ParkingBottomSheet;
