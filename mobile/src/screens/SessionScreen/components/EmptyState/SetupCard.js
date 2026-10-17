import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import { DURATION_OPTIONS, RATE_OPTIONS } from '../../../../constants/session';
import { formatMoney } from '../../../../utils/formatters';
import { calculateCost, formatClock, formatDuration } from '../../../../utils/sessionHelpers';
import { styles } from './styles';

// Quick picks that fit the spot's maximum stay. If even the shortest is too
// long, offer the maximum itself.
export function durationsFor(maxMinutes) {
    const quick = DURATION_OPTIONS.filter((opt) => opt.quickSelect);
    if (!maxMinutes) return quick;
    const fit = quick.filter((opt) => opt.value <= maxMinutes);
    return fit.length ? fit : [{ value: maxMinutes, label: formatDuration(maxMinutes) }];
}

/**
 * SetupCard - plate, duration and (in the demo flow) rate, with a summary of
 * what Start will commit to: when it ends and what it costs.
 * With a spot from Details, the rate is the spot's and durations respect its
 * posted maximum.
 */
const SetupCard = ({
    vehiclePlate,
    setVehiclePlate,
    selectedRate,
    setSelectedRate,
    selectedDuration,
    setSelectedDuration,
    onStartSession,
    fixedRate = null,
    maxMinutes = null,
    zoneLabel = null,
    now = Date.now(),
}) => {
    const rate = fixedRate ?? selectedRate;
    const durations = useMemo(() => durationsFor(maxMinutes), [maxMinutes]);
    const duration = maxMinutes ? Math.min(selectedDuration, maxMinutes) : selectedDuration;
    const totalCost = calculateCost(duration, rate);
    const endsAt = formatClock(now + duration * 60000);
    const isValid = vehiclePlate.trim().length > 0;

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
                        placeholderTextColor={TOKENS.textLight}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={10}
                        style={styles.plateInput}
                        selectionColor={TOKENS.primary}
                        accessibilityLabel="Vehicle license plate"
                        accessibilityHint="Enter your vehicle's license plate number"
                    />
                </View>
            </View>

            <View style={styles.setupSection}>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepNumber}>2</Text>
                </View>
                <View style={styles.setupContent}>
                    <Text style={styles.setupLabel}>How long</Text>
                    <View style={styles.durationGrid} accessibilityRole="radiogroup">
                        {durations.map((option) => {
                            const selected = duration === option.value;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    onPress={() => setSelectedDuration(option.value)}
                                    activeOpacity={0.8}
                                    style={[styles.durationOption, selected && styles.durationOptionActive]}
                                    accessibilityRole="radio"
                                    aria-checked={selected}
                                    accessibilityLabel={`${formatDuration(option.value)}, ${formatMoney(calculateCost(option.value, rate))}`}
                                >
                                    <Text
                                        style={[styles.durationTime, selected && styles.durationTimeActive]}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.85}
                                    >
                                        {formatDuration(option.value)}
                                    </Text>
                                    <Text
                                        style={[styles.durationCost, selected && styles.durationCostActive]}
                                        numberOfLines={1}
                                    >
                                        {formatMoney(calculateCost(option.value, rate))}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {maxMinutes ? (
                        <Text style={styles.setupHint}>
                            {formatDuration(maxMinutes)} maximum here. Check posted signs.
                        </Text>
                    ) : null}
                </View>
            </View>

            {fixedRate === null ? (
                <View style={styles.setupSection}>
                    <View style={styles.stepIndicator}>
                        <Text style={styles.stepNumber}>3</Text>
                    </View>
                    <View style={styles.setupContent}>
                        <Text style={styles.setupLabel}>Hourly rate</Text>
                        <View style={styles.rateOptions} accessibilityRole="radiogroup">
                            {RATE_OPTIONS.map((option) => {
                                const selected = selectedRate === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => setSelectedRate(option.value)}
                                        activeOpacity={0.8}
                                        style={[styles.rateOption, selected && styles.rateOptionActive]}
                                        accessibilityRole="radio"
                                        aria-checked={selected}
                                        accessibilityLabel={`${formatMoney(option.value)} per hour`}
                                    >
                                        <Text style={[styles.rateText, selected && styles.rateTextActive]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
            ) : null}

            {/* What Start commits to, read before the tap that costs money */}
            <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Ends at</Text>
                    <Text style={styles.summaryValue}>{endsAt}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Rate</Text>
                    <Text style={styles.summaryValue}>
                        {formatMoney(rate)} / hour{zoneLabel ? ` · ${zoneLabel}` : ''}
                    </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total for {formatDuration(duration)}</Text>
                    <Text style={styles.summaryValueLarge}>{formatMoney(totalCost)}</Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={onStartSession}
                activeOpacity={0.9}
                style={[styles.primaryButton, !isValid && styles.primaryButtonDisabled]}
                disabled={!isValid}
                accessibilityRole="button"
                accessibilityLabel={`Start session: ${formatDuration(duration)}, ${formatMoney(totalCost)}, ends at ${endsAt}`}
                accessibilityHint={isValid ? undefined : 'Enter your license plate first'}
                accessibilityState={{ disabled: !isValid }}
            >
                <MaterialCommunityIcons
                    name="timer-play"
                    size={20}
                    color={isValid ? TOKENS.surface : TOKENS.textMuted}
                />
                <Text style={[styles.primaryButtonText, !isValid && styles.primaryButtonTextDisabled]}>
                    Start {'·'} {formatDuration(duration)} {'·'} {formatMoney(totalCost)}
                </Text>
            </TouchableOpacity>
            {!isValid ? <Text style={styles.disabledHint}>Add your plate to start.</Text> : null}
        </View>
    );
};

export default SetupCard;
