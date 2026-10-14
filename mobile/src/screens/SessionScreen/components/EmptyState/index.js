import { ScrollView, Text, View } from 'react-native';
import InfoCard from '../shared/InfoCard';
import SetupCard from './SetupCard';
import { styles } from './styles';

/**
 * EmptyState — shown when no timer is running. Sets up the next one.
 */
const EmptyState = ({
    timerSpot,
    suggestedSpot,
    onUseSpot,
    onClearSpot,
    onFindSpot,
    selectedDuration,
    setSelectedDuration,
    onStart,
    reminderStatus,
}) => {
    return (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Left-aligned, like Home and a running timer: the title leads,
                with no decorative icon above it. */}
            <View style={styles.header}>
                <Text style={styles.title} accessibilityRole="header" aria-level={1}>Parking timer</Text>
                <Text style={styles.subtitle}>Know exactly when your time is up.</Text>
            </View>

            <SetupCard
                timerSpot={timerSpot}
                suggestedSpot={suggestedSpot}
                onUseSpot={onUseSpot}
                onClearSpot={onClearSpot}
                onFindSpot={onFindSpot}
                selectedDuration={selectedDuration}
                setSelectedDuration={setSelectedDuration}
                onStart={onStart}
                reminderStatus={reminderStatus}
            />

            {/* Honest about what this is: a reminder, not a payment. */}
            <InfoCard
                icon="information-outline"
                text="parkaid doesn't pay for parking. Pay at the pay station or in the City's parking app, then start your timer here."
                type="info"
            />
        </ScrollView>
    );
};

export default EmptyState;
