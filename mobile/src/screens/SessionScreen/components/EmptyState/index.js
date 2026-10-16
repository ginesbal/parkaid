import { ScrollView, Text, View } from 'react-native';
import BrandPin from '../../../../components/BrandPin';
import InfoCard from '../shared/InfoCard';
import SetupCard from './SetupCard';
import { styles } from './styles';

/**
 * EmptyState - Displays when no active parking session
 * Guides user through starting a new session
 */
const EmptyState = ({
    vehiclePlate,
    setVehiclePlate,
    selectedRate,
    setSelectedRate,
    selectedDuration,
    setSelectedDuration,
    onStartSession,
}) => {
    return (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <BrandPin size={64} />
                </View>
                <Text style={styles.title}>You're not parked yet</Text>
                <Text style={styles.subtitle}>Set up a session for downtown Calgary</Text>
            </View>

            {/* Setup Card - Main interaction area */}
            <SetupCard
                vehiclePlate={vehiclePlate}
                setVehiclePlate={setVehiclePlate}
                selectedRate={selectedRate}
                setSelectedRate={setSelectedRate}
                selectedDuration={selectedDuration}
                setSelectedDuration={setSelectedDuration}
                onStartSession={onStartSession}
            />

            {/* Info Card - Demo disclaimer */}
            <InfoCard
                icon="information-outline"
                text="This is a demo session, so no payment is required. Session details stay on this device for testing."
                type="info"
            />
        </ScrollView>
    );
};

export default EmptyState;
