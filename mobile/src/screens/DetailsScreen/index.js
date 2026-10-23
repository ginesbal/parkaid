// DetailsScreen — one parking spot, on the ink canvas. Pushed over the tabs from
// Home and Map. "Start session" hands the spot to the Park tab.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenStatusBar from '../../components/ScreenStatusBar';
import { Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapThumb from '../../components/MapThumb';
import ParkPlusActions from '../../components/ParkPlusActions';
import { TOKENS } from '../../constants/theme';
import { describeFreeNow } from '../../utils/chargeHours';
import { logger } from '../../utils/loggers';
import {
    formatEnforceableTime,
    getChargeHours,
    getDirectionsUrl,
    getMaxStayLabel,
    getRateDisplay,
    getSpotKind,
    getSpotName,
    getWalkLabel,
    getZoneLabel,
} from '../../utils/spotPresentation';
import { styles } from './styles';

function InfoLine({ icon, title, body, zone }) {
    return (
        <View style={styles.line}>
            <View style={styles.lineIcon}>
                <MaterialCommunityIcons name={icon} size={20} color={TOKENS.primaryInk} />
            </View>
            <View style={styles.lineText}>
                <Text style={styles.lineTitle}>{title}</Text>
                {body ? <Text style={styles.lineBody}>{body}</Text> : null}
                {zone ? <ParkPlusActions zone={zone} style={styles.lineActions} /> : null}
            </View>
        </View>
    );
}

// What to know before leaving the car, by kind of spot.
function buildLines(spot) {
    const lines = [];
    const walk = getWalkLabel(spot);
    if (walk) {
        lines.push({
            icon: 'walk',
            title: walk,
            body: Number.isFinite(spot?.distance) ? `About ${spot.distance} m from where you searched.` : null,
        });
    }

    if (spot?.spot_type === 'residential') {
        const zone = spot?.zone_info?.permit_zone;
        // The rate line above already says "Permit holders only".
        lines.push({
            icon: 'card-account-details-outline',
            title: zone ? `Residential permit zone ${zone}` : 'Residential permit zone',
            body: 'Without a permit for this zone you may be ticketed.',
        });
        return lines;
    }

    const maxStay = getMaxStayLabel(spot);
    if (maxStay) {
        lines.push({ icon: 'timer-outline', title: maxStay, body: 'Check posted signs before you leave the car.' });
    }

    const zone = getZoneLabel(spot);
    if (zone) {
        // ParkAid takes no payment; hand off to the City's app to pay.
        lines.push({
            icon: 'cellphone-text',
            title: `Pay at ${zone.toLowerCase()}`,
            body: 'Pay with this zone number in MyParking, the City’s ParkPlus app, or at a pay station.',
            zone,
        });
    } else if (spot?.spot_type === 'off_street') {
        lines.push({ icon: 'boom-gate-outline', title: 'Pay at the lot', body: 'Rates and hours are posted at the entrance.' });
    }

    return lines;
}

export default function DetailsScreen({ route, navigation }) {
    const spot = route?.params?.spot;
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    if (!spot) {
        // Deep link or stale param: nothing to show, go back.
        return (
            <View style={[styles.screen, styles.missing, { paddingTop: insets.top }]}>
                <Text style={styles.missingText}>This spot is no longer available.</Text>
                <Pressable onPress={() => navigation.goBack()} style={styles.primary} accessibilityRole="button">
                    <Text style={styles.primaryText}>Go back</Text>
                </Pressable>
            </View>
        );
    }

    const { title, detail } = getSpotName(spot);
    const kind = getSpotKind(spot);
    const rate = getRateDisplay(spot);
    const zone = getZoneLabel(spot);
    const paidHours = formatEnforceableTime(spot?.zone_info?.enforceable_time);
    // Outside charging hours the rate does not apply yet; say so first.
    const freeNow = rate.amount ? describeFreeNow(getChargeHours(spot)) : null;
    const lines = buildLines(spot);
    const directionsUrl = getDirectionsUrl(spot);
    const canStart = spot.spot_type !== 'residential';
    const thumbWidth = Math.min(width, 520) - 40;

    const rateBasis = rate.amount
        ? [zone ? `${zone} rate` : 'Posted rate', paidHours ? `paid ${paidHours.charAt(0).toLowerCase()}${paidHours.slice(1)}` : null]
            .filter(Boolean)
            .join(' · ')
        : paidHours;

    const handleStart = () => {
        logger.log('details_start_session', { spotId: spot.id }, 'UI_EVENT');
        navigation.navigate('Tabs', { screen: 'Park', params: { spot } });
    };

    const handleDirections = () => {
        if (!directionsUrl) return;
        logger.log('open_external_navigation', { spotId: spot.id, provider: 'google' }, 'UI_EVENT');
        Linking.openURL(directionsUrl);
    };

    return (
        <View style={styles.screen}>
            <ScreenStatusBar style="light" />
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.column}>
                    <View style={styles.nav}>
                        <Pressable
                            onPress={() => navigation.goBack()}
                            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Back"
                            hitSlop={8}
                        >
                            <MaterialCommunityIcons name="chevron-left" size={28} color={TOKENS.surface} />
                        </Pressable>
                        <Text style={styles.navTitle}>Parking details</Text>
                    </View>

                    <Text style={styles.title} accessibilityRole="header">{title}</Text>
                    <Text style={styles.subtitle}>{[detail, 'Calgary'].filter(Boolean).join(', ')}</Text>

                    <MapThumb width={thumbWidth} height={132} style={styles.thumb} />
                </View>

                <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
                    <View style={styles.column}>
                        <View style={styles.priceRow}>
                            {rate.amount ? (
                                <Text style={styles.price} accessibilityLabel={`${rate.amount} per hour`}>
                                    {rate.amount}
                                    <Text style={styles.priceUnit}> {rate.unit}</Text>
                                </Text>
                            ) : (
                                <Text style={styles.rateNote}>{rate.note}</Text>
                            )}
                            <View style={styles.kind}>
                                <Text style={styles.kindText}>{kind}</Text>
                            </View>
                        </View>
                        {freeNow ? <Text style={styles.freeNow}>{freeNow}</Text> : null}
                        {rateBasis ? <Text style={styles.rateBasis}>{rateBasis}</Text> : null}

                        <View style={styles.lines}>
                            {lines.map((l) => (
                                <InfoLine key={l.title} {...l} />
                            ))}
                        </View>

                        <View style={styles.actions}>
                            {canStart ? (
                                <Pressable
                                    onPress={handleStart}
                                    style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
                                    accessibilityRole="button"
                                    accessibilityHint="Opens the Park tab to set up a session here"
                                >
                                    <Text style={styles.primaryText}>Start session</Text>
                                </Pressable>
                            ) : null}
                            {directionsUrl ? (
                                <Pressable
                                    onPress={handleDirections}
                                    style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
                                    accessibilityRole="link"
                                    accessibilityHint="Opens directions in Google Maps"
                                >
                                    <MaterialCommunityIcons name="directions" size={18} color={TOKENS.primaryInk} />
                                    <Text style={styles.secondaryText}>Directions</Text>
                                </Pressable>
                            ) : null}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
