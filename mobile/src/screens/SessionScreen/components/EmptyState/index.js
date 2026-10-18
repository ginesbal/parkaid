import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import BrandPin3D from '../../../../components/BrandPin3D';
import LiveStage from '../../../../components/LiveStage';
import { SPLINE_SCENES } from '../../../../constants/spline';
import {
    getHourlyRate,
    getMaxStayMinutes,
    getRateDisplay,
    getSpotKind,
    getSpotName,
    getZoneLabel,
} from '../../../../utils/spotPresentation';
import InfoCard from '../shared/InfoCard';
import SetupCard from './SetupCard';
import { styles } from './styles';

/**
 * EmptyState - no active session. Sets one up, either for the spot handed
 * over from Details or, without one, as the downtown demo.
 */
const EmptyState = ({
    spot = null,
    now,
    vehiclePlate,
    setVehiclePlate,
    selectedRate,
    setSelectedRate,
    selectedDuration,
    setSelectedDuration,
    onStartSession,
}) => {
    const name = spot ? getSpotName(spot) : null;
    const zone = spot ? getZoneLabel(spot) : null;
    const subtitle = spot
        ? [name.detail || getSpotKind(spot), zone].filter(Boolean).join(' · ')
        : 'Set up a session for downtown Calgary';
    // The live pin holds its spot only while the form is unscrolled.
    const [scrolled, setScrolled] = useState(false);

    return (
        <LiveStage>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 1)}
                scrollEventThrottle={16}
            >
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <BrandPin3D scene={SPLINE_SCENES.pin} size={64} suspended={scrolled} />
                    </View>
                    <Text style={styles.title} accessibilityRole="header">
                        {spot ? `Park at ${name.title}` : 'You’re not parked yet'}
                    </Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>

                <SetupCard
                    vehiclePlate={vehiclePlate}
                    setVehiclePlate={setVehiclePlate}
                    selectedRate={selectedRate}
                    setSelectedRate={setSelectedRate}
                    selectedDuration={selectedDuration}
                    setSelectedDuration={setSelectedDuration}
                    onStartSession={onStartSession}
                    fixedRate={spot ? getHourlyRate(spot) : null}
                    rateNote={spot && getHourlyRate(spot) === null ? getRateDisplay(spot).note : null}
                    maxMinutes={spot ? getMaxStayMinutes(spot) : null}
                    zoneLabel={zone}
                    now={now}
                />

                <InfoCard
                    icon="information-outline"
                    text="This is a demo session, so no payment is taken. Session details stay on this device."
                    type="info"
                />
            </ScrollView>
        </LiveStage>
    );
};

export default EmptyState;
