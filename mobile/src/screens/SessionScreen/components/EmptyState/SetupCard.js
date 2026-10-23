import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import { DURATION_OPTIONS } from '../../../../constants/session';
import { REMINDERS_SUPPORTED, remindersBlocked } from '../../../../services/reminders';
import { chargedCost, chargedMinutes, describeFreeNow } from '../../../../utils/chargeHours';
import { formatCost, formatMoney } from '../../../../utils/formatters';
import { formatClock, formatDuration } from '../../../../utils/sessionHelpers';
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
 * SetupCard - where (when there is a choice), plate and duration, with a
 * summary of what Start will commit to: when it ends and what it costs. Just
 * above Start it says where to pay, since starting the timer pays for nothing.
 *
 * rate:     the spot's hourly rate, or null with a rateNote: no price is made up
 * chargeHours: when the City charges (utils/chargeHours); only those minutes
 *           are priced. null: every minute is
 * maxMinutes: the spot's posted maximum; durations stay within it
 * where:    the place picker, shown as the first step
 */
const SetupCard = ({
    where = null,
    vehiclePlate,
    setVehiclePlate,
    selectedDuration,
    setSelectedDuration,
    onStartSession,
    rate = null,
    rateNote = null,
    chargeHours = null,
    maxMinutes = null,
    zoneLabel = null,
    payLine,
    now = Date.now(),
}) => {
    const durations = useMemo(() => durationsFor(maxMinutes), [maxMinutes]);
    const duration = snapDuration(durations, selectedDuration);
    const costFor = (minutes) => chargedCost(rate, chargeHours, now, minutes);
    const totalCost = costFor(duration);
    // Why the cost is less than rate times time, when it is.
    let costNote = null;
    if (rate !== null) {
        const charged = chargedMinutes(chargeHours, now, duration);
        costNote = describeFreeNow(chargeHours, now)
            ?? (charged < duration ? `Only ${formatDuration(charged)} of it is charged.` : null);
    }

    // The shown duration is what Start uses. The driver's own pick is kept, so
    // trying a spot with a shorter maximum does not lose it.
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

    // Steps are numbered in the order they show.
    let step = 0;

    return (
        <View style={styles.setupCard}>
            {where ? (
                <View style={styles.setupSection}>
                    <View style={styles.stepIndicator}>
                        <Text style={styles.stepNumber}>{++step}</Text>
                    </View>
                    <View style={styles.setupContent}>
                        <Text style={styles.setupLabel}>Spot</Text>
                        {where}
                    </View>
                </View>
            ) : null}

            <View style={styles.setupSection}>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepNumber}>{++step}</Text>
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
                    <Text style={styles.stepNumber}>{++step}</Text>
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
                                        : `${formatDuration(option.value)}, ${formatCost(costFor(option.value))}`}
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
                                            {formatCost(costFor(option.value))}
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

            {/* What Start commits to: when it ends, and what ParkPlus will charge */}
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
                            <Text style={styles.summaryLabel}>Cost for {formatDuration(duration)}</Text>
                            <Text style={styles.summaryValueLarge}>{formatCost(totalCost)}</Text>
                        </View>
                        {costNote ? <Text style={styles.summaryNote}>{costNote}</Text> : null}
                    </>
                ) : null}
            </View>

            <View style={styles.payLine}>
                <MaterialCommunityIcons name="information-outline" size={18} color={TOKENS.primaryInk} />
                <Text style={styles.payLineText}>{payLine}</Text>
            </View>

            <TouchableOpacity
                onPress={() => onStartSession(duration)}
                activeOpacity={0.9}
                style={[styles.primaryButton, !isValid && styles.primaryButtonDisabled]}
                disabled={!isValid}
                accessibilityRole="button"
                accessibilityLabel={`Start session: ${formatDuration(duration)}, ends at ${endsAt}`}
                accessibilityHint={isValid ? undefined : 'Enter your license plate first'}
                accessibilityState={{ disabled: !isValid }}
            >
                <MaterialCommunityIcons
                    name="timer-play"
                    size={20}
                    color={isValid ? TOKENS.surface : TOKENS.textMuted}
                />
                <Text style={[styles.primaryButtonText, !isValid && styles.primaryButtonTextDisabled]}>
                    Start session {'·'} {formatDuration(duration)}
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
