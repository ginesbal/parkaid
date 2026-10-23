import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import { DURATION_OPTIONS, RATE_OPTIONS } from '../../../../constants/session';
import { REMINDERS_SUPPORTED, remindersBlocked } from '../../../../services/reminders';
import { formatMoney } from '../../../../utils/formatters';
import { calculateCost, formatClock, formatDuration } from '../../../../utils/sessionHelpers';
import { styles } from './styles';

// Quick picks that fit the spot's maximum stay, plus the maximum itself when
// it is not already one of them (45 min, 90 min, 8 h…).
export function durationsFor(maxMinutes) {
    const quick = DURATION_OPTIONS.filter((opt) => opt.quickSelect);
    if (!maxMinutes) return quick;
    const fit = quick.filter((opt) => opt.value <= maxMinutes);
    return fit.some((opt) => opt.value === maxMinutes)
        ? fit
        : [...fit, { value: maxMinutes, label: formatDuration(maxMinutes) }];
}

// The offered option to use for a selection: itself if offered, else the
// longest offered option under it, else the shortest offered.
export function snapDuration(options, selected) {
    if (options.some((opt) => opt.value === selected)) return selected;
    const under = options.filter((opt) => opt.value <= selected);
    return under.length ? under[under.length - 1].value : options[0].value;
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
    rateNote = null,
    maxMinutes = null,
    zoneLabel = null,
    now = Date.now(),
}) => {
    // fixedRate: the spot's rate. rateNote: the spot has no known rate, so no
    // price is shown or made up. Neither: the demo flow with its rate picker.
    const rate = fixedRate ?? (rateNote ? null : selectedRate);
    const showRatePicker = fixedRate === null && !rateNote;
    const durations = useMemo(() => durationsFor(maxMinutes), [maxMinutes]);
    const duration = snapDuration(durations, selectedDuration);
    const totalCost = rate === null ? null : calculateCost(duration, rate);

    // Keep the stored choice on an offered option, so Start uses what is shown.
    useEffect(() => {
        if (duration !== selectedDuration) setSelectedDuration(duration);
    }, [duration, selectedDuration, setSelectedDuration]);
    const endsAt = formatClock(now + duration * 60000);
    const isValid = vehiclePlate.trim().length > 0;

    // Only promise a reminder the phone will deliver. Checked again on the
    // way back from Settings.
    const [blocked, setBlocked] = useState(false);
    useEffect(() => {
        if (!REMINDERS_SUPPORTED) return undefined;
        const check = () => remindersBlocked().then(setBlocked);
        check();
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') check();
        });
        return () => subscription.remove();
    }, []);

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
                                    accessibilityLabel={rate === null
                                        ? formatDuration(option.value)
                                        : `${formatDuration(option.value)}, ${formatMoney(calculateCost(option.value, rate))}`}
                                >
                                    <Text
                                        style={[styles.durationTime, selected && styles.durationTimeActive]}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.85}
                                    >
                                        {formatDuration(option.value)}
                                    </Text>
                                    {rate !== null ? (
                                        <Text
                                            style={[styles.durationCost, selected && styles.durationCostActive]}
                                            numberOfLines={1}
                                        >
                                            {formatMoney(calculateCost(option.value, rate))}
                                        </Text>
                                    ) : null}
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

            {showRatePicker ? (
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
                        {rate === null
                            ? rateNote
                            : `${formatMoney(rate)} / hour${zoneLabel ? ` · ${zoneLabel}` : ''}`}
                    </Text>
                </View>
                {totalCost !== null ? (
                    <>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total for {formatDuration(duration)}</Text>
                            <Text style={styles.summaryValueLarge}>{formatMoney(totalCost)}</Text>
                        </View>
                    </>
                ) : null}
            </View>

            <TouchableOpacity
                onPress={onStartSession}
                activeOpacity={0.9}
                style={[styles.primaryButton, !isValid && styles.primaryButtonDisabled]}
                disabled={!isValid}
                accessibilityRole="button"
                accessibilityLabel={`Start session: ${formatDuration(duration)}${totalCost !== null ? `, ${formatMoney(totalCost)}` : ''}, ends at ${endsAt}`}
                accessibilityHint={isValid ? undefined : 'Enter your license plate first'}
                accessibilityState={{ disabled: !isValid }}
            >
                <MaterialCommunityIcons
                    name="timer-play"
                    size={20}
                    color={isValid ? TOKENS.surface : TOKENS.textMuted}
                />
                <Text style={[styles.primaryButtonText, !isValid && styles.primaryButtonTextDisabled]}>
                    Start {'·'} {formatDuration(duration)}
                    {totalCost !== null ? ` · ${formatMoney(totalCost)}` : ''}
                </Text>
            </TouchableOpacity>
            {!isValid ? <Text style={styles.disabledHint}>Add your plate to start.</Text> : null}
            {isValid && REMINDERS_SUPPORTED && !blocked ? (
                <Text style={styles.disabledHint}>We’ll remind you when it’s time to head back.</Text>
            ) : null}
            {isValid && blocked ? (
                <Text style={styles.disabledHint}>
                    Notifications are off, so there won’t be a reminder.{' '}
                    <Text style={styles.hintLink} onPress={() => Linking.openSettings()} accessibilityRole="link">
                        Turn them on
                    </Text>
                </Text>
            ) : null}
        </View>
    );
};

export default SetupCard;
