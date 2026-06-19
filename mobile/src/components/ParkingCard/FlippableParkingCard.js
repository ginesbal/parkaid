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
import { logger } from '../../utils/loggers';
import {
    getCapacity,
    getMaxStay,
    getPriceInfo,
    getRestrictions,
    getSpotType,
} from '../../utils/spotInfo';
import {
    CARD_HEIGHT,
    CARD_WIDTH,
    CONTENT_WIDTH,
    SCREEN_HEIGHT,
    SCREEN_WIDTH
} from './cardConstants';
import { getDetailsPages } from './cardHelpers';
import { styles } from './cardStyles';

const HERO_STYLE = {
    paid: styles.priceHeroPaid,
    free: styles.priceHeroFree,
    permit: styles.priceHeroPermit,
    unknown: styles.priceHeroUnknown,
};
const HERO_COLOR = {
    paid: TOKENS.text,
    free: TOKENS.success,
    permit: TOKENS.warning,
    unknown: TOKENS.textMuted,
};
const BADGE_STYLE = { danger: styles.badgeDanger, warning: styles.badgeWarning, info: styles.badgeInfo };
const BADGE_TEXT = { danger: styles.badgeTextDanger, warning: styles.badgeTextWarning, info: styles.badgeTextInfo };
const BADGE_ICON = { danger: TOKENS.danger, warning: TOKENS.warning, info: TOKENS.textMuted };

const formatDistance = (meters) => {
    const m = Number(meters);
    if (!Number.isFinite(m)) return { value: '—', unit: '' };
    if (m < 1000) return { value: String(m), unit: m === 1 ? 'meter' : 'meters' };
    const km = (m / 1000).toFixed(1);
    return { value: km, unit: km === '1.0' ? 'kilometer' : 'kilometers' };
};

function FlippableParkingCard({
    visible = false,
    spot = null,
    position = { x: 0, y: 0 },
    topBoundary = 60,
    bottomBoundary = SCREEN_HEIGHT - 140,
    onClose = () => { },
    onNavigate = () => { },
}) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);

    const flipAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.96)).current;
    const translateYAnim = useRef(new Animated.Value(12)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const pagesScrollRef = useRef(null);
    const pageWidth = CONTENT_WIDTH;

    const detailsPages = spot ? getDetailsPages(spot) : [];

    const scrollToPage = (i) => {
        const safe = Math.max(0, Math.min(i, detailsPages.length - 1));
        setCurrentPage(safe);
        pagesScrollRef.current?.scrollTo({ x: safe * pageWidth, y: 0, animated: true });
    };

    const goPrev = () => scrollToPage(currentPage - 1);
    const goNext = () => scrollToPage(currentPage + 1);

    useEffect(() => {
        if (visible && spot) {
            logger.logSpotData(spot, 'FlippableParkingCard opened');

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
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ]).start();
        } else if (!visible) {
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
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start();
            setTimeout(() => {
                setIsFlipped(false);
                setCurrentPage(0);
                flipAnim.setValue(0);
                scaleAnim.setValue(0.96);
                translateYAnim.setValue(12);
            }, 200);
        }
    }, [fadeAnim, flipAnim, scaleAnim, spot, translateYAnim, visible]);

    const flip = () => {
        const toValue = isFlipped ? 0 : 1;

        // Reset horizontal pager to first page on any flip
        pagesScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
        setCurrentPage(0);

        Animated.spring(flipAnim, {
            toValue,
            tension: 65,
            friction: 9,
            useNativeDriver: true,
        }).start();
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
    const price = getPriceInfo(spot);
    const maxStay = getMaxStay(spot);
    const capacity = getCapacity(spot);
    const distance = formatDistance(spot.distance);
    const walk = Number.isFinite(spot.walkingTime) ? spot.walkingTime : null;

    // Restrictions, minus max-stay (it already has its own stat cell).
    const badges = getRestrictions(spot).filter((b) => b.key !== 'max').slice(0, 3);

    // The third stat falls back gracefully: max stay -> capacity -> spot type.
    const thirdStat = maxStay
        ? { value: maxStay.value, unit: maxStay.unit, label: 'Max stay' }
        : capacity
            ? { value: String(capacity), unit: capacity === 1 ? 'space' : 'spaces', label: 'Capacity' }
            : { value: type.label, unit: '', label: 'Type' };

    return (
        <>
            {visible && (
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
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
            >
                {/* front of card */}
                <Animated.View
                    style={[
                        styles.card,
                        styles.cardFront,
                        {
                            opacity: frontOpacity,
                            transform: [{ perspective: 1000 }, { rotateY: frontRotateY }],
                        },
                    ]}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.spotTypeTag}>
                            <MaterialCommunityIcons name={type.icon} size={14} color={TOKENS.primary} />
                            <Text style={styles.spotTypeText}>{type.label}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.frontContent}>
                        <Text style={styles.address} numberOfLines={2}>
                            {spot.address || spot.address_desc || 'Parking spot'}
                        </Text>

                        {/* Price hero — the biggest, most-glanced answer. */}
                        <View style={[styles.priceHero, HERO_STYLE[price.kind]]}>
                            <View style={styles.priceHeroLeft}>
                                <Text style={[styles.priceHeroValue, { color: HERO_COLOR[price.kind] }]}>
                                    {price.value}
                                </Text>
                                {price.unit ? (
                                    <Text style={styles.priceHeroUnit}>{price.unit}</Text>
                                ) : null}
                            </View>
                            {price.note ? (
                                <Text style={styles.priceHeroNote} numberOfLines={2}>{price.note}</Text>
                            ) : null}
                        </View>

                        {/* Three quick facts */}
                        <View style={styles.statRow}>
                            <View style={styles.statCell}>
                                <View style={styles.statValueRow}>
                                    <Text style={styles.statValue}>{walk ?? '—'}</Text>
                                    {walk != null ? (
                                        <Text style={styles.statValueUnit}>{walk === 1 ? 'minute' : 'minutes'}</Text>
                                    ) : null}
                                </View>
                                <Text style={styles.statLabel}>Walk</Text>
                            </View>

                            <View style={styles.statCellDivider} />

                            <View style={styles.statCell}>
                                <View style={styles.statValueRow}>
                                    <Text style={styles.statValue}>{distance.value}</Text>
                                    {distance.unit ? (
                                        <Text style={styles.statValueUnit}>{distance.unit}</Text>
                                    ) : null}
                                </View>
                                <Text style={styles.statLabel}>Away</Text>
                            </View>

                            <View style={styles.statCellDivider} />

                            <View style={styles.statCell}>
                                <View style={styles.statValueRow}>
                                    <Text style={styles.statValue} numberOfLines={1}>{thirdStat.value}</Text>
                                    {thirdStat.unit ? (
                                        <Text style={styles.statValueUnit}>{thirdStat.unit}</Text>
                                    ) : null}
                                </View>
                                <Text style={styles.statLabel}>{thirdStat.label}</Text>
                            </View>
                        </View>

                        {badges.length > 0 && (
                            <View style={styles.badgesRow}>
                                {badges.map((badge) => (
                                    <View key={badge.key} style={[styles.badge, BADGE_STYLE[badge.tone]]}>
                                        <MaterialCommunityIcons
                                            name={badge.icon}
                                            size={14}
                                            color={BADGE_ICON[badge.tone]}
                                        />
                                        <Text style={[styles.badgeText, BADGE_TEXT[badge.tone]]} numberOfLines={1}>
                                            {badge.text}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.actionsLarge}>
                        <TouchableOpacity style={styles.detailsBtnLarge} onPress={flip} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="information-outline" size={20} color={TOKENS.text} />
                            <Text style={styles.detailsBtnTextLarge}>Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navBtnLarge} onPress={onNavigate} activeOpacity={0.85}>
                            <MaterialCommunityIcons name="navigation-variant" size={22} color="#FFFFFF" />
                            <Text style={styles.navBtnTextLarge}>Navigate</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* back of card */}
                <Animated.View
                    style={[
                        styles.card,
                        styles.cardBack,
                        {
                            opacity: backOpacity,
                            transform: [{ perspective: 1000 }, { rotateY: backRotateY }],
                        },
                    ]}
                >
                    <View style={styles.cardHeaderBack}>
                        <TouchableOpacity
                            onPress={flip}
                            style={styles.backBtn}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={20} color={TOKENS.text} />
                        </TouchableOpacity>
                        <View style={styles.pageTitleTag}>
                            <Text style={styles.spotTypeText}>
                                {detailsPages[currentPage]?.title || 'Details'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* horizontal pager for detail pages */}
                    <ScrollView
                        ref={pagesScrollRef}
                        horizontal
                        pagingEnabled
                        decelerationRate="fast"
                        snapToInterval={pageWidth}
                        snapToAlignment="start"
                        disableIntervalMomentum
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const page = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
                            setCurrentPage(page);
                        }}
                        style={styles.pagesContainer}
                    >
                        {detailsPages.map((page, pageIndex) => (
                            <View key={pageIndex} style={[styles.detailPage, { width: CONTENT_WIDTH }]}>
                                <ScrollView
                                    style={styles.detailsListLarge}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.detailsContent}
                                >
                                    {page.items.length > 0 ? (
                                        page.items.map((item, idx) => (
                                            <View
                                                key={idx}
                                                style={[
                                                    styles.detailRowLarge,
                                                    item.highlight && styles.detailRowHighlightLarge
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.detailLabelLarge,
                                                        item.highlight && styles.detailLabelHighlight
                                                    ]}
                                                    numberOfLines={2}
                                                >
                                                    {item.label}
                                                </Text>
                                                {item.link ? (
                                                    <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
                                                        <Text
                                                            style={[
                                                                styles.detailValueLarge,
                                                                item.highlight && styles.detailValueHighlight,
                                                                styles.linkText,
                                                            ]}
                                                            numberOfLines={3}
                                                        >
                                                            {item.value || 'Open link'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <Text
                                                        style={[
                                                            styles.detailValueLarge,
                                                            item.highlight && styles.detailValueHighlight
                                                        ]}
                                                        numberOfLines={3}
                                                    >
                                                        {item.value || 'Not listed'}
                                                    </Text>
                                                )}
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.noDataText}>No additional details available.</Text>
                                    )}
                                </ScrollView>
                            </View>
                        ))}
                    </ScrollView>

                    {detailsPages.length > 1 && (
                        <View style={styles.pagerContainer}>
                            <TouchableOpacity
                                style={[styles.pagerArrow, currentPage === 0 && styles.pagerArrowDisabled]}
                                onPress={goPrev}
                                disabled={currentPage === 0}
                            >
                                <MaterialCommunityIcons
                                    name="chevron-left"
                                    size={20}
                                    color={currentPage === 0 ? TOKENS.textMuted : TOKENS.text}
                                />
                            </TouchableOpacity>

                            <View style={styles.pagerDots}>
                                {detailsPages.map((_, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => scrollToPage(idx)}
                                        style={[styles.pagerDot, currentPage === idx && styles.pagerDotActive]}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Go to page ${idx + 1}`}
                                    />
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.pagerArrow,
                                    currentPage === detailsPages.length - 1 && styles.pagerArrowDisabled,
                                ]}
                                onPress={goNext}
                                disabled={currentPage === detailsPages.length - 1}
                            >
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={20}
                                    color={currentPage === detailsPages.length - 1 ? TOKENS.textMuted : TOKENS.text}
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    {detailsPages.length === 1 && (
                        <View style={styles.backActionsLarge}>
                            <TouchableOpacity style={styles.navBtnFullLarge} onPress={onNavigate} activeOpacity={0.85}>
                                <MaterialCommunityIcons name="navigation-variant" size={22} color="#FFFFFF" />
                                <Text style={styles.navBtnTextLarge}>Navigate to spot</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </Animated.View>
        </>
    );
}

export default FlippableParkingCard;
