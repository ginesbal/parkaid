import { ScrollView, Text, View } from 'react-native';
import { getPayLine } from '../../../../utils/parkPlus';
import { formatClock } from '../../../../utils/sessionHelpers';
import {
    getChargeHours,
    getHourlyRate,
    getRateDisplay,
    getRatePeriods,
    getSpotKind,
    getSpotName,
    getStayLimit,
    getZoneLabel,
} from '../../../../utils/spotPresentation';
import SetupCard, { setupLimit } from './SetupCard';
import SpotPicker from './SpotPicker';
import { styles } from './styles';

/**
 * EmptyState - no active session. Sets one up for the spot handed over from
 * Details or, without one, asks where the car is: one of the closest places
 * from the last search, or somewhere else.
 *
 * spot:      the spot to set up (handed over, or picked); null for somewhere
 *            else, or before a pick
 * handedOver: true when `spot` came from Details, so there is nothing to pick
 * places:    the last search's places to offer; searchedAt, when it ran (ms)
 * nearYou:   the places are ordered by the phone's position now
 * choice:    a place's id, ELSEWHERE, or null before the driver picks
 * zone:      for somewhere else, the zone number from the sign ('' for none)
 */
const EmptyState = ({
    spot = null,
    handedOver = false,
    places = [],
    searchedAt = null,
    nearYou = false,
    choice,
    onChoose,
    onPickAnother,
    zone,
    setZone,
    now,
    vehiclePlate,
    setVehiclePlate,
    selectedDuration,
    setSelectedDuration,
    onStartSession,
}) => {
    const name = spot ? getSpotName(spot) : null;
    const zoneLabel = spot ? getZoneLabel(spot) : (zone ? `Zone ${zone}` : null);
    const rate = spot ? getHourlyRate(spot, now) : null;
    // The longest stay here, and why: the posted maximum, a rush-hour
    // restriction starting first, or no parking at all right now.
    const limit = setupLimit(spot ? getStayLimit(spot, now) : null);

    let subtitle;
    if (handedOver) {
        subtitle = [name.detail || getSpotKind(spot), zoneLabel].filter(Boolean).join(' · ');
    } else if (places.length) {
        subtitle = nearYou
            ? `Nearest to you first, from your search at ${formatClock(searchedAt)}`
            : `From your search at ${formatClock(searchedAt)}`;
    } else {
        subtitle = 'Use the zone on the nearest parking sign.';
    }

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.header}>
                <Text style={styles.title} accessibilityRole="header">
                    {handedOver ? `Park at ${name.title}` : 'Where are you parked?'}
                </Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
                {handedOver ? (
                    <Text style={styles.headerLink} onPress={onPickAnother} accessibilityRole="button">
                        Parked somewhere else?
                    </Text>
                ) : null}
            </View>

            <SetupCard
                where={handedOver ? null : (
                    <SpotPicker places={places} choice={choice} onChoose={onChoose} zone={zone} setZone={setZone} />
                )}
                needsPlace={!handedOver && choice === null}
                vehiclePlate={vehiclePlate}
                setVehiclePlate={setVehiclePlate}
                selectedDuration={selectedDuration}
                setSelectedDuration={setSelectedDuration}
                onStartSession={onStartSession}
                rate={rate}
                rateNote={rate === null ? getRateDisplay(spot, now).note : null}
                ratePeriods={spot ? getRatePeriods(spot) : null}
                chargeHours={spot ? getChargeHours(spot) : null}
                maxMinutes={limit.maxMinutes}
                limitNote={limit.note}
                noParkingUntil={limit.noParkingUntil}
                zoneLabel={zoneLabel}
                payLine={getPayLine({ zone: zoneLabel, lot: spot?.spot_type === 'off_street' })}
                now={now}
            />
        </ScrollView>
    );
};

export default EmptyState;
