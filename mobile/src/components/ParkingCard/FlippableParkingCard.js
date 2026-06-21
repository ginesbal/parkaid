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

    const flipAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.96)).current;
    const translateYAnim = useRef(new Animated.Value(12)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

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
                flipAnim.setValue(0);
                scaleAnim.setValue(0.96);
                translateYAnim.setValue(12);
            }, 200);
        }
    }, [fadeAnim, flipAnim, scaleAnim, spot, translateYAnim, visible]);

    const flip = () => {
        const toValue = isFlipped ? 0 : 1;
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
    const access = getAccess(spot);
    const price = getPriceInfo(spot);
    const hours = getHours(spot);
    const rush = getRushRestriction(spot);
    const addr = parseAddress(spot);
    const distance = formatDistance(spot.distance);
    const walk = Number.isFinite(spot.walkingTime) ? spot.walkingTime : null;
    const isPublic = access.kind === 'public';

    // Pricing / hours / convenience as skimmable, icon-anchored rows.
    const away = distance.unit ? `${distance.value} ${distance.unit} away` : `${distance.value} away`;
    const walkText = walk != null ? `${walk} ${walk === 1 ? 'minute' : 'minutes'} walk` : null;

    // Front shows the 3 most decision-relevant facts; the full breakdown lives
    // on the flipped details view.
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
    facts.push({
        key: 'walk',
        icon: 'walk',
        label: 'Getting there',
        value: walkText ? `${walkText} · ${away}` : away,
    });

    // Back-of-card detail sections, rendered as one vertical spec sheet.
    const sections = getDetailsPages(spot).filter((s) => s.items.length > 0);

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
                            <MaterialCommunityIcons name={type.icon} size={14} color="#FFFFFF" />
                            <Text style={styles.spotTypeText}>{type.label}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialCommunityIcons name="close" size={20} color={TOKENS.textMuted} />
                        </TouchableOpacity>
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
                                    color={access.tone === 'danger' ? TOKENS.danger : TOKENS.warning}
                                />
                                <View style={styles.accessTextWrap}>
                                    <Text
                                        style={[
                                            styles.accessLabel,
                                            { color: access.tone === 'danger' ? TOKENS.danger : TOKENS.warning },
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

                        {/* Pricing / hours / convenience — skimmable icon rows */}
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

                {/* back of card — one calm, vertically-scrolling spec sheet */}
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
                        <Text style={styles.backTitle} numberOfLines={1}>
                            {spot.address || spot.address_desc || 'Details'}
                        </Text>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                                                    onPress={() => Linking.openURL(item.link)}
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
                        <TouchableOpacity style={styles.navBtnFullLarge} onPress={onNavigate} activeOpacity={0.85}>
                            <MaterialCommunityIcons name="navigation-variant" size={22} color="#FFFFFF" />
                            <Text style={styles.navBtnTextLarge}>Navigate to spot</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </>
    );
}

export default FlippableParkingCard;
