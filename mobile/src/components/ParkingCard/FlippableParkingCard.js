// src/components/ParkingCard/FlippableParkingCard.js

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { TOKENS } from '../../constants/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { logger } from '../../utils/loggers';
import {
    getAccess,
    getHours,
    getPriceInfo,
    getRushRestriction,
    getSpotType,
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
    unknown: TOKENS.textMuted,
};

function FlippableParkingCard({
    visible = false,
    spot = null,
    position = { x: 0, y: 0 },
    topBoundary = 60,
    bottomBoundary = SCREEN_HEIGHT - 140,
    onClose = () => { },
    onNavigate = () => { },
    onParkHere = null,
}) {
    const [isFlipped, setIsFlipped] = useState(false);
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
                useNativeDriver: true,
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
                        useNativeDriver: true,
                    }),
                    Animated.spring(translateYAnim, {
                        toValue: 0,
                        tension: 70,
                        friction: 9,
                        useNativeDriver: true,
                    }),
                    fadeIn,
                ]).start();
            }
        } else if (!visible) {
            const fadeOut = Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            });

            if (reduceMotion) {
                fadeOut.start();
            } else {
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 0.98,
                        duration: 180,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateYAnim, {
                        toValue: 14,
                        duration: 180,
                        useNativeDriver: true,
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
            ? Animated.timing(flipAnim, { toValue, duration: 200, useNativeDriver: true })
            : Animated.spring(flipAnim, { toValue, tension: 65, friction: 9, useNativeDriver: true });
        animation.start();
        setIsFlipped(!isFlipped);
    };

    if (!visible || !spot) return null;

    // Center card horizontally, clamp to screen edges
    const cardX = Math.min(
        Math.max(10, (SCREEN_WIDTH - CARD_WIDTH) / 2),
        SCREEN_WIDTH - CARD_WIDTH - 10
    );
    // Center card vertically in the safe zone between header and bottom sheet
    const safeTop = Math.max(16, topBoundary);
    const safeBottom = Math.max(safeTop + CARD_HEIGHT, bottomBoundary);
    const availableHeight = safeBottom - safeTop;
    const cardY = safeTop + Math.max(0, (availableHeight - CARD_HEIGHT) / 2);

    const frontRotateY = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
    const backRotateY = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
    const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
    const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

    // Everything the front shows comes from one shared source of truth.
    const type = getSpotType(spot);
    const access = getAccess(spot);
    const price = getPriceInfo(spot);
    const hours = getHours(spot);
    const rush = getRushRestriction(spot);
    const addr = parseAddress(spot);
    const walk = Number.isFinite(spot.walkingTime) ? spot.walkingTime : null;
    const isPublic = access.kind === 'public';
    // A timer only makes sense where a visitor can actually park.
    const canPark = isPublic && typeof onParkHere === 'function';

    // The walk-time ETA rides on the Navigate button. Minutes is the metric a
    // driver actually decides on; exact distance would just restate the same
    // fact, so it's left off the button.
    const eta = walk != null
        ? `${walk} ${walk === 1 ? 'minute' : 'minutes'} walk`
        : null;

    // Front shows the decision facts (pricing / hours); convenience is on the button.
    const facts = [];
    if (isPublic) {
        if (price.kind !== 'free' && hours.schedule) {
            facts.push({ key: 'hours', icon: 'clock-outline', label: 'Paid hours', value: hours.schedule });
        }
        // A tow-away window outranks the max stay — you'd get towed, not ticketed.
        if (rush) {
            facts.push({ key: 'rush', icon: 'tow-truck', tone: 'danger', label: rush.label, value: rush.value });
        } else if (hours.maxStay) {
            facts.push({ key: 'max', icon: 'timer-sand', label: 'Max stay', value: hours.maxStay.text });
        }
    } else if (hours.schedule) {
        // Residents / no-parking: when the permit is in effect.
        facts.push({ key: 'permit', icon: 'clock-outline', label: 'In effect', value: hours.schedule });
    }

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
                ]}
                pointerEvents="box-none"
                // iOS: keep VoiceOver inside the card while it's open, and let
                // the two-finger "scrub" escape gesture close it.
                accessibilityViewIsModal
                onAccessibilityEscape={onClose}
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
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.spotTypeTag}>
                            <MaterialCommunityIcons name={type.icon} size={14} color={TOKENS.onPrimary} />
                            <Text style={styles.spotTypeText}>{type.label}</Text>
                        </View>
                        <View style={styles.headerActions}>
                            {canPark ? (
                                <TouchableOpacity
                                    style={styles.parkBtn}
                                    onPress={onParkHere}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                                    accessibilityRole="button"
                                    accessibilityLabel="Park here"
                                    accessibilityHint="Starts a parking timer for this spot"
                                >
                                    <MaterialCommunityIcons name="timer-outline" size={16} color={TOKENS.primary} />
                                    {/* The header row is narrow; keep the pill from crowding the tag. */}
                                    <Text style={styles.parkBtnText} maxFontSizeMultiplier={1.4}>Park here</Text>
                                </TouchableOpacity>
                            ) : null}
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
                    </View>

                    <View style={styles.frontBody}>
                        <View style={styles.addressBlock}>
                            <Text style={styles.addressPrimary} numberOfLines={2}>
                                {addr.primary}
                            </Text>
                            {addr.secondary ? (
                                <Text style={styles.addressSecondary} numberOfLines={1}>
                                    {addr.secondary}
                                </Text>
                            ) : null}
                        </View>

                        {isPublic ? (
                            // Headline: what it costs + whether it's free right now.
                            <View style={styles.headline}>
                                <View style={styles.priceRow}>
                                    <Text
                                        style={[styles.priceValue, { color: HERO_COLOR[price.kind] }]}
                                        numberOfLines={1}
                                    >
                                        {price.value}
                                    </Text>
                                    {price.unit ? (
                                        <Text style={styles.priceUnit}>{price.unit}</Text>
                                    ) : null}
                                </View>

                                {hours.status ? (
                                    <View style={styles.statusRow}>
                                        <View
                                            style={[
                                                styles.statusDot,
                                                hours.status.state === 'free' ? styles.dotFree : styles.dotPaid,
                                            ]}
                                        />
                                        <Text
                                            style={[
                                                styles.statusLabel,
                                                hours.status.state === 'free' ? styles.statusLabelFree : styles.statusLabelPaid,
                                            ]}
                                        >
                                            {hours.status.label}
                                        </Text>
                                        <Text style={styles.statusDetail}>· {hours.status.detail}</Text>
                                    </View>
                                ) : price.kind === 'free' ? (
                                    <View style={styles.statusRow}>
                                        <View style={[styles.statusDot, styles.dotFree]} />
                                        <Text style={[styles.statusLabel, styles.statusLabelFree]}>Free to park</Text>
                                    </View>
                                ) : price.note ? (
                                    <Text style={styles.statusDetail}>{price.note}</Text>
                                ) : null}
                            </View>
                        ) : (
                            // Not public — say so in plain language, not permit jargon.
                            <View
                                style={[
                                    styles.accessBanner,
                                    access.tone === 'danger' ? styles.bannerDanger : styles.bannerWarning,
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={access.icon}
                                    size={24}
                                    color={access.tone === 'danger' ? TOKENS.dangerInk : TOKENS.warningInk}
                                />
                                <View style={styles.accessTextWrap}>
                                    <Text
                                        style={[
                                            styles.accessLabel,
                                            // Ink tones: the base hues fail AA on the soft banner.
                                            { color: access.tone === 'danger' ? TOKENS.dangerInk : TOKENS.warningInk },
                                        ]}
                                    >
                                        {access.label}
                                    </Text>
                                    {access.detail ? (
                                        <Text style={styles.accessDetail}>{access.detail}</Text>
                                    ) : null}
                                </View>
                            </View>
                        )}

                        {/* Pricing / hours — skimmable icon rows */}
                        {facts.length > 0 && (
                            <View style={styles.facts}>
                                {facts.map((f) => (
                                    <View key={f.key} style={styles.factRow}>
                                        <View style={[styles.factIcon, f.tone === 'danger' && styles.factIconDanger]}>
                                            <MaterialCommunityIcons
                                                name={f.icon}
                                                size={19}
                                                color={f.tone === 'danger' ? TOKENS.danger : TOKENS.primary}
                                            />
                                        </View>
                                        <View style={styles.factText}>
                                            <Text style={styles.factLabel}>{f.label}</Text>
                                            <Text style={styles.factValue} numberOfLines={2}>{f.value}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.actionsLarge}>
                        <TouchableOpacity
                            style={styles.detailsBtnLarge}
                            onPress={flip}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel="Show all details"
                        >
                            <MaterialCommunityIcons name="information-outline" size={20} color={TOKENS.text} />
                            <Text style={styles.detailsBtnTextLarge}>Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.navBtnLarge}
                            onPress={onNavigate}
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityLabel={eta ? `Navigate, ${eta}` : 'Navigate'}
                            accessibilityHint="Opens walking directions in Google Maps"
                        >
                            <MaterialCommunityIcons name="navigation-variant" size={22} color={TOKENS.onPrimary} />
                            <View style={styles.navBtnTextWrap}>
                                <Text style={styles.navBtnTextLarge}>Navigate</Text>
                                {eta ? <Text style={styles.navBtnEta}>{eta}</Text> : null}
                            </View>
                        </TouchableOpacity>
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
                        <Text style={styles.backTitle} numberOfLines={1} accessibilityRole="header">
                            {spot.address || spot.address_desc || 'Details'}
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
