import { ScrollView, Text, View } from 'react-native';
import BrandPin from '../../../../components/BrandPin';
import { getPayLine } from '../../../../utils/parkPlus';
import { formatClock } from '../../../../utils/sessionHelpers';
import {
    getHourlyRate,
    getMaxStayMinutes,
    getRateDisplay,
    getSpotKind,
    getSpotName,
    getZoneLabel,
} from '../../../../utils/spotPresentation';
import SetupCard from './SetupCard';
import SpotPicker from './SpotPicker';
import { styles } from './styles';

/**
 * EmptyState - no active session. Sets one up for the spot handed over from
 * Details or, without one, asks where the car is: one of the closest places
 * from the last search, or somewhere else.
 *
 * spot:      the spot to set up (handed over, or picked); null for somewhere else
 * handedOver: true when `spot` came from Details, so there is nothing to pick
 * places:    the last search's closest places; searchedAt, when it ran (ms)
 * zone:      for somewhere else, the zone number from the sign ('' for none)
 */
const EmptyState = ({
    spot = null,
    handedOver = false,
    places = [],
    searchedAt = null,
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
    const rate = spot ? getHourlyRate(spot) : null;

    let subtitle;
    if (handedOver) {
        subtitle = [name.detail || getSpotKind(spot), zoneLabel].filter(Boolean).join(' · ');
    } else if (places.length) {
        subtitle = `Closest to your search at ${formatClock(searchedAt)}`;
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
                <View style={styles.iconContainer}>
                    <BrandPin size={64} />
                </View>
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
                vehiclePlate={vehiclePlate}
                setVehiclePlate={setVehiclePlate}
                selectedDuration={selectedDuration}
                setSelectedDuration={setSelectedDuration}
                onStartSession={onStartSession}
                rate={rate}
                rateNote={rate === null ? getRateDisplay(spot).note : null}
                maxMinutes={spot ? getMaxStayMinutes(spot) : null}
                zoneLabel={zoneLabel}
                payLine={getPayLine({ zone: zoneLabel, lot: spot?.spot_type === 'off_street' })}
                now={now}
            />
        </ScrollView>
    );
};

export default EmptyState;
