import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import { DURATION_OPTIONS, RATE_OPTIONS } from '../../../../constants/session';
import { formatMoney, formatTime } from '../../../../utils/formatters';
import { calculateCost } from '../../../../utils/sessionHelpers';
import { styles } from './styles';

/**
 * SetupCard - Handles the 3-step parking session setup
 */
const SetupCard = ({
    vehiclePlate,
    setVehiclePlate,
    selectedRate,
    setSelectedRate,
    selectedDuration,
    setSelectedDuration,
    onStartSession,
}) => {
    const totalCost = useMemo(
        () => calculateCost(selectedDuration, selectedRate),
        [selectedDuration, selectedRate]
    );

    const isValid = useMemo(
        () => vehiclePlate.trim().length > 0,
        [vehiclePlate]
    );

    return (
        <View style={styles.setupCard}>
            <View style={styles.setupSection}>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepNumber}>1</Text>
                </View>
                <View style={styles.setupContent}>
                    <Text style={styles.setupLabel}>Vehicle license plate</Text>
                    <TextInput
                        value={vehiclePlate}
                        onChangeText={setVehiclePlate}
                        placeholder="ABC 1234"
                        placeholderTextColor={TOKENS.textMuted}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={10}
                        style={styles.plateInput}
                        selectionColor={TOKENS.primary}
                        accessibilityLabel="Vehicle license plate input"
                        accessibilityHint="Enter your vehicle's license plate number"
                    />
                </View>
            </View>

            <View style={styles.setupSection}>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepNumber}>2</Text>
                </View>
                <View style={styles.setupContent}>
                    <Text style={styles.setupLabel}>Parking duration</Text>
                    <View style={styles.durationGrid}>
                        {DURATION_OPTIONS.filter(opt => opt.quickSelect).map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => setSelectedDuration(option.value)}
                                activeOpacity={0.8}
                                style={[
                                    styles.durationOption,
                                    selectedDuration === option.value && styles.durationOptionActive
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel={`Select ${option.label} duration`}
                                accessibilityState={{ selected: selectedDuration === option.value }}
                            >
                                <Text
                                    style={[
                                        styles.durationTime,
                                        selectedDuration === option.value && styles.durationTimeActive
                                    ]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.7}
                                >
                                    {option.label}
                                </Text>
                                <Text
                                    style={[
                                        styles.durationCost,
                                        selectedDuration === option.value && styles.durationCostActive
                                    ]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.7}
                                >
                                    {formatMoney(calculateCost(option.value, selectedRate))}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            <View style={styles.setupSection}>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepNumber}>3</Text>
                </View>
                <View style={styles.setupContent}>
                    <Text style={styles.setupLabel}>Hourly rate</Text>
                    <View style={styles.rateOptions}>
                        {RATE_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => setSelectedRate(option.value)}
                                activeOpacity={0.8}
                                style={[
                                    styles.rateOption,
                                    selectedRate === option.value && styles.rateOptionActive
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel={`Select ${option.label} rate`}
                                accessibilityState={{ selected: selectedRate === option.value }}
                            >
                                <Text style={[
                                    styles.rateText,
                                    selectedRate === option.value && styles.rateTextActive
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total time</Text>
                    <Text style={styles.summaryValue}>{formatTime(selectedDuration)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Estimated total</Text>
                    <Text style={styles.summaryValueLarge}>
                        {formatMoney(totalCost)}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={onStartSession}
                activeOpacity={0.9}
                style={[
                    styles.primaryButton,
                    !isValid && styles.primaryButtonDisabled
                ]}
                disabled={!isValid}
                accessibilityRole="button"
                accessibilityLabel="Start parking session"
                accessibilityHint="Begins your parking session with the selected options"
                accessibilityState={{ disabled: !isValid }}
            >
                <MaterialCommunityIcons
                    name="timer-play"
                    size={20}
                    color="#fff"
                />
                <Text style={styles.primaryButtonText}>Start session</Text>
            </TouchableOpacity>
        </View>
    );
};

export default SetupCard;
