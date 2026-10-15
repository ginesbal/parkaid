// src/components/ParkingCard/FlippableParkingCard.js

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { NATIVE_DRIVER, TOKENS } from '../../constants/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { logger } from '../../utils/loggers';
import {
    getAccess,
    getHours,
    getLotInfo,
    getPriceInfo,
    getRushRestriction,
    parseAddress,
} from '../../utils/spotInfo';
import {
    CARD_HEIGHT,
    CARD_WIDTH,
    SCREEN_HEIGHT,
    SCREEN_WIDTH
} from './cardConstants';
import { getDetailsPages } from './cardHelpers';
import { styles } from './cardStyles';

const HERO_COLOR = {
    paid: TOKENS.text,
    free: TOKENS.success,
    no_parking: TOKENS.danger,
    zone: TOKENS.textMuted,
    unknown: TOKENS.textMuted,
};
// A price or a clear yes/no leads the card; "Rate on signs" or "Loading zone"
// isn't an answer, so it sits a size down.
const QUIET_HERO = new Set(['zone', 'unknown']);

function FlippableParkingCard({
    visible = false,
    spot = null,
    position = { x: 0, y: 0 },
    topBoundary = 60,
    bottomBoundary = SCREEN_HEIGHT - 140,
    // The map area's width: the screen on a phone, a narrower column in a
    // wide browser window.
    areaWidth = SCREEN_WIDTH,
    onClose = () => { },
    onNavigate = () => { },
    onParkHere = null,
}) {
    const [isFlipped, setIsFlipped] = useState(false);
    // When the middle of the front has to scroll (small phones), a hairline
    // above the buttons shows there's more beneath.
    const [frontFit, setFrontFit] = useState({ box: 0, content: 0 });
    const frontOverflows = frontFit.content > frontFit.box + 1;
    // With Reduce Motion on, the 180° 3D flip becomes a crossfade and the
    // entrance/exit drop their scale and slide — fades only.
    const reduceMotion = useReducedMotion();

    const flipAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.96)).current;
    const translateYAnim = useRef(new Animated.Value(12)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    // Pending post-exit reset. Held in a ref so a reopen can cancel it.
    const resetTimerRef = useRef(null);

    useEffect(() => () => clearTimeout(resetTimerRef.current), []);

    // Web: browsers ignore the modal props phones use (accessibilityViewIsModal,
    // the escape gesture), so the card does that work itself. Focus moves into
    // the card, Tab stays inside it, Escape closes it, and focus goes back to
    // what opened it. The face that's turned away is inert.
    const containerRef = useRef(null);
    const frontRef = useRef(null);
    const backRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const isOpen = visible && Boolean(spot);
    useEffect(() => {
        if (Platform.OS !== 'web' || !isOpen) return undefined;
        const card = containerRef.current;
        const opener = document.activeElement;
        card?.focus?.();
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onCloseRef.current();
                return;
            }
            if (event.key !== 'Tab' || !card) return;
            const stops = [...card.querySelectorAll('[tabindex="0"], button, a[href], input')]
                .filter((el) => !el.closest('[inert]'));
            if (!stops.length) return;
            const first = stops[0];
            const last = stops[stops.length - 1];
            const active = document.activeElement;
            if (!card.contains(active) || (event.shiftKey && (active === first || active === card))) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            if (opener && document.contains(opener)) opener.focus?.();
        };
    }, [isOpen]);
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        if (frontRef.current) frontRef.current.inert = isFlipped;
        if (backRef.current) backRef.current.inert = !isFlipped;
    }, [isFlipped, isOpen]);

    useEffect(() => {
        if (visible && spot) {
            // Tapping a new marker while a card is closing reopens the card
            // inside the 200ms exit window. Without cancelling the pending
            // reset, it would fire mid-entrance and snap the new card back to
            // its start pose. Do the reset now, synchronously, instead.
            if (resetTimerRef.current) {
                clearTimeout(resetTimerRef.current);
                resetTimerRef.current = null;
                setIsFlipped(false);
                flipAnim.setValue(0);
            }

            logger.logSpotData(spot, 'FlippableParkingCard opened');

            const fadeIn = Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 220,
                useNativeDriver: NATIVE_DRIVER,
            });

            if (reduceMotion) {
                scaleAnim.setValue(1);
                translateYAnim.setValue(0);
                fadeIn.start();
            } else {
                Animated.parallel([
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        tension: 60,
                        friction: 8,
                        useNativeDriver: NATIVE_DRIVER,
                    }),
                    Animated.spring(translateYAnim, {
                        toValue: 0,
                        tension: 70,
                        friction: 9,
                        useNativeDriver: NATIVE_DRIVER,
                    }),
                    fadeIn,
                ]).start();
            }
        } else if (!visible) {
            const fadeOut = Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 180,
                useNativeDriver: NATIVE_DRIVER,
            });

            if (reduceMotion) {
                fadeOut.start();
            } else {
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 0.98,
                        duration: 180,
                        useNativeDriver: NATIVE_DRIVER,
                    }),
                    Animated.timing(translateYAnim, {
                        toValue: 14,
                        duration: 180,
                        useNativeDriver: NATIVE_DRIVER,
                    }),
                    fadeOut,
                ]).start();
            }
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = setTimeout(() => {
                resetTimerRef.current = null;
                setIsFlipped(false);
                flipAnim.setValue(0);
                scaleAnim.setValue(0.96);
                translateYAnim.setValue(12);
            }, 200);
        }
    }, [fadeAnim, flipAnim, reduceMotion, scaleAnim, spot, translateYAnim, visible]);

    const flip = () => {
        const toValue = isFlipped ? 0 : 1;
        // Reduced motion: a short crossfade (the face opacities already key
        // off flipAnim) with no rotation applied — see the face transforms.
        const animation = reduceMotion
            ? Animated.timing(flipAnim, { toValue, duration: 200, useNativeDriver: NATIVE_DRIVER })
            : Animated.spring(flipAnim, { toValue, tension: 65, friction: 9, useNativeDriver: NATIVE_DRIVER });
        animation.start();
        setIsFlipped(!isFlipped);
    };

    if (!visible || !spot) return null;

    // Center card horizontally, clamped to the map area's edges
    const cardX = Math.min(
        Math.max(10, (areaWidth - CARD_WIDTH) / 2),
        areaWidth - CARD_WIDTH - 10
    );
    // The card is as tall as its front needs, up to CARD_HEIGHT. Its top sits
    // where a full-height card would be centred between header and sheet, so
    // a short card just ends sooner instead of jumping once it's measured.
    const safeTop = Math.max(16, topBoundary);
    const safeBottom = Math.max(safeTop + CARD_HEIGHT, bottomBoundary);
    const availableHeight = safeBottom - safeTop;
    const cardY = safeTop + Math.max(0, (availableHeight - CARD_HEIGHT) / 2);

    const frontRotateY = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
    const backRotateY = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
    const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
    const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

    // Everything the front shows comes from one shared source of truth.
    const access = getAccess(spot);
    const price = getPriceInfo(spot);
    const hours = getHours(spot);
    // The rate schedule's own "right now" line when there is one, so the
    // status never disagrees with the price above it.
    const status = price.status || hours.status;
    const rush = getRushRestriction(spot);
    const addr = parseAddress(spot);
    const walk = Number.isFinite(spot.walkingTime) ? spot.walkingTime : null;
    const isPublic = access.kind === 'public';
    // A timer only makes sense where a visitor can actually park.
    const canPark = isPublic && typeof onParkHere === 'function';

    // Where it is, then how far: "From 2 St SW to 4 St SW · 1-minute walk".
    const eta = walk != null ? `${walk}-minute walk` : null;
    const subtitle = [addr.secondary, eta].filter(Boolean).join(' · ');

    // The rules under the answer, as label/value rows in the same language as
    // the back. "Paid hours" only where it's actually paid parking.
    const facts = [];
    if (isPublic) {
        if (price.kind !== 'free' && hours.schedule) {
            const paid = price.kind === 'paid' || price.kind === 'unknown';
            facts.push({ key: 'hours', label: paid ? 'Paid hours' : 'Hours', value: hours.schedule });
        }
        // A tow-away window outranks the max stay — you'd get towed, not ticketed.
        if (rush) {
            facts.push({ key: 'rush', tone: 'danger', label: rush.label, value: rush.value });
        } else if (hours.maxStay) {
            facts.push({ key: 'max', label: 'Max stay', value: hours.maxStay.text });
        }
    } else if (hours.schedule) {
        // Residents / no-parking: when the permit is in effect.
        facts.push({ key: 'permit', label: 'In effect', value: hours.schedule });
    }
    // Lots: the name drivers know it by, and whether it's covered.
    const lot = getLotInfo(spot);
    if (lot?.name) facts.push({ key: 'lot-name', label: 'Name', value: lot.name });
    if (lot?.kind) facts.push({ key: 'lot-kind', label: 'Type', value: lot.kind });

    // Back-of-card detail sections, rendered as one vertical spec sheet.
    const sections = getDetailsPages(spot).filter((s) => s.items.length > 0);

    return (
        <>
            {visible && (
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close details"
                    // On the web the backdrop is for the mouse only; the
                    // card's own close button and Escape cover the keyboard.
                    {...(Platform.OS === 'web' ? { tabIndex: -1, 'aria-hidden': true } : null)}
                >
                    <View />
                </TouchableOpacity>
            )}

            <Animated.View
                style={[
                    styles.container,
                    {
                        position: 'absolute',
                        left: cardX,
                        top: cardY,
                        transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
                        opacity: fadeAnim,
                    },
                    // The card itself takes focus on the web, as a dialog: no
                    // square outline around it; its buttons keep their rings.
                    Platform.OS === 'web' && { outlineStyle: 'none' },
                ]}
                pointerEvents="box-none"
                // iOS: keep VoiceOver inside the card while it's open, and let
                // the two-finger "scrub" escape gesture close it.
                accessibilityViewIsModal
                onAccessibilityEscape={onClose}
                ref={containerRef}
                {...(Platform.OS === 'web'
                    ? { role: 'dialog', 'aria-modal': true, 'aria-label': addr.primary, tabIndex: -1 }
                    : null)}
            >
                {/* front of card — both faces stay mounted for the flip, so the
                    hidden one must also be removed from touch and from the
                    accessibility tree, not just faded to opacity 0. */}
                <Animated.View
                    style={[
                        styles.card,
                        styles.cardFront,
                        {
                            opacity: frontOpacity,
                            transform: reduceMotion ? [] : [{ perspective: 1000 }, { rotateY: frontRotateY }],
                        },
                    ]}
                    pointerEvents={isFlipped ? 'none' : 'auto'}
                    accessibilityElementsHidden={isFlipped}
                    importantForAccessibility={isFlipped ? 'no-hide-descendants' : 'auto'}
                    ref={frontRef}
                >
                    {/* Where: the street, then the block and the walk. */}
                    <View style={styles.frontHeader}>
                        <View style={styles.titleBlock}>
                            <Text
                                style={styles.addressPrimary}
                                numberOfLines={2}
                                accessibilityRole="header"
                                aria-level={2}
                            >
                                {addr.primary}
                            </Text>
                            {subtitle ? (
                                <Text style={styles.addressSecondary} numberOfLines={2}>
                                    {subtitle}
                                </Text>
                            ) : null}
                        </View>
                        <Pressable
                            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityRole="button"
                            accessibilityLabel="Close details"
                        >
                            <MaterialCommunityIcons name="close" size={20} color={TOKENS.textMuted} />
                        </Pressable>
                    </View>

                    {/* Scrolls only when a small phone can't fit it all. */}
                    <ScrollView
                        style={styles.frontScroll}
                        contentContainerStyle={styles.frontBody}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        onLayout={(e) => {
                            const box = e.nativeEvent.layout.height;
                            setFrontFit((fit) => (fit.box === box ? fit : { ...fit, box }));
                        }}
                        onContentSizeChange={(w, content) => {
                            setFrontFit((fit) => (fit.content === content ? fit : { ...fit, content }));
                        }}
                    >
                        {/* The answer: what it costs, and whether you pay right now. */}
                        {isPublic ? (
                            <View style={styles.headline}>
                                <View style={styles.priceRow}>
                                    <Text
                                        style={[
                                            styles.priceValue,
                                            QUIET_HERO.has(price.kind) && styles.priceValueQuiet,
                                            { color: HERO_COLOR[price.kind] || TOKENS.textMuted },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {price.value}
                                    </Text>
                                    {price.unit ? (
                                        <Text style={styles.priceUnit}>{price.unit}</Text>
                                    ) : null}
                                </View>
                                {status ? (
                                    <Text style={styles.statusLine}>
                                        <Text style={status.state === 'free' ? styles.statusFree : styles.statusPaid}>
                                            {status.label}
                                        </Text>
                                        {status.detail ? ` · ${status.detail}` : ''}
                                    </Text>
                                ) : price.kind === 'free' ? (
                                    <Text style={[styles.statusLine, styles.statusFree]}>Free to park</Text>
                                ) : price.note ? (
                                    <Text style={styles.statusLine}>{price.note}</Text>
                                ) : null}
                            </View>
                        ) : (
                            // Not public: say so in plain words, in the same place a price goes.
                            <View style={styles.headline}>
                                <Text
                                    style={[
                                        styles.accessLabel,
                                        // Ink tones: the base hues are too light for text.
                                        { color: access.tone === 'danger' ? TOKENS.dangerInk : TOKENS.warningInk },
                                    ]}
                                >
                                    {access.label}
                                </Text>
                                {access.detail ? (
                                    <Text style={styles.statusLine}>{access.detail}</Text>
                                ) : null}
                            </View>
                        )}

                        {/* The rules, as rows like the back's, ending in the way there. */}
                        <View style={styles.factList}>
                            {facts.map((f) => (
                                <View key={f.key} style={[styles.detailRow, styles.detailRowDivider]}>
                                    <Text style={styles.detailLabel} numberOfLines={2}>{f.label}</Text>
                                    <Text
                                        style={[styles.detailValue, f.tone === 'danger' && styles.factValueDanger]}
                                        numberOfLines={3}
                                    >
                                        {f.value}
                                    </Text>
                                </View>
                            ))}
                            <Pressable
                                style={({ pressed }) => [styles.moreRow, pressed && styles.moreRowPressed]}
                                onPress={flip}
                                accessibilityRole="button"
                                accessibilityLabel="Show all details"
                            >
                                <Text style={styles.moreText}>All details</Text>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={TOKENS.primary} />
                            </Pressable>
                        </View>
                    </ScrollView>

                    {/* One filled button. Park here sits beside it, outlined,
                        only where a visitor can actually park. */}
                    <View style={[styles.actions, frontOverflows && styles.actionsDivided]}>
                        {canPark ? (
                            <Pressable
                                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                                onPress={onParkHere}
                                accessibilityRole="button"
                                accessibilityLabel="Park here"
                                accessibilityHint="Starts a parking timer for this spot"
                            >
                                <Text style={styles.secondaryBtnText} numberOfLines={1}>Park here</Text>
                            </Pressable>
                        ) : null}
                        <Pressable
                            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                            onPress={onNavigate}
                            accessibilityRole="button"
                            accessibilityLabel={eta ? `Navigate, ${eta}` : 'Navigate'}
                            accessibilityHint="Opens walking directions in Google Maps"
                        >
                            <Text style={styles.primaryBtnText} numberOfLines={1}>Navigate</Text>
                        </Pressable>
                    </View>
                </Animated.View>

                {/* back of card — one calm, vertically-scrolling spec sheet */}
                <Animated.View
                    style={[
                        styles.card,
                        styles.cardBack,
                        {
                            opacity: backOpacity,
                            transform: reduceMotion ? [] : [{ perspective: 1000 }, { rotateY: backRotateY }],
                        },
                    ]}
                    pointerEvents={isFlipped ? 'auto' : 'none'}
                    accessibilityElementsHidden={!isFlipped}
                    importantForAccessibility={isFlipped ? 'auto' : 'no-hide-descendants'}
                    ref={backRef}
                >
                    <View style={styles.cardHeaderBack}>
                        <TouchableOpacity
                            onPress={flip}
                            style={styles.backBtn}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityRole="button"
                            accessibilityLabel="Back to summary"
                        >
                            <MaterialCommunityIcons name="arrow-left" size={20} color={TOKENS.text} />
                        </TouchableOpacity>
                        <Text style={styles.backTitle} numberOfLines={1} accessibilityRole="header" aria-level={2}>
                            {addr.primary}
                        </Text>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityRole="button"
                            accessibilityLabel="Close details"
                        >
                            <MaterialCommunityIcons name="close" size={20} color={TOKENS.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.detailsScroll}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.detailsScrollContent}
                    >
                        {sections.length > 0 ? (
                            sections.map((section, si) => (
                                <View
                                    key={section.title}
                                    style={[styles.detailSection, si === 0 && styles.detailSectionFirst]}
                                >
                                    <Text style={styles.detailSectionTitle}>{section.title}</Text>
                                    {section.items.map((item, idx) => (
                                        <View
                                            key={`${item.label}-${idx}`}
                                            style={[
                                                styles.detailRow,
                                                idx < section.items.length - 1 && styles.detailRowDivider,
                                            ]}
                                        >
                                            <Text style={styles.detailLabel} numberOfLines={2}>
                                                {item.label}
                                            </Text>
                                            {item.link ? (
                                                <Text
                                                    style={[styles.detailValue, styles.linkText]}
                                                    numberOfLines={2}
                                                    accessibilityRole="link"
                                                    // City URLs come from open data; a malformed one
                                                    // must not surface as an unhandled rejection.
                                                    onPress={() => Linking.openURL(item.link).catch(() => {
                                                        logger.log('detail_link_open_failed', { link: item.link }, 'WARN');
                                                    })}
                                                >
                                                    {item.value || 'Open link'}
                                                </Text>
                                            ) : (
                                                <Text
                                                    style={[
                                                        styles.detailValue,
                                                        item.highlight && styles.detailValueStrong,
                                                    ]}
                                                    numberOfLines={3}
                                                >
                                                    {item.value || 'Not listed'}
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noDataText}>No additional details available.</Text>
                        )}
                    </ScrollView>

                    <View style={styles.backFooter}>
                        <TouchableOpacity
                            style={styles.navBtnFullLarge}
                            onPress={onNavigate}
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityHint="Opens walking directions in Google Maps"
                        >
                            <MaterialCommunityIcons name="navigation-variant" size={22} color={TOKENS.onPrimary} />
                            <Text style={styles.navBtnTextLarge}>Navigate to spot</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </>
    );
}

export default FlippableParkingCard;
