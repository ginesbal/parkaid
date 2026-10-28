import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import { DURATION_OPTIONS } from '../../../../constants/session';
import { REMINDERS_SUPPORTED, remindersBlocked } from '../../../../services/reminders';
import { chargedCost, chargedMinutes } from '../../../../utils/chargeHours';
import { nextRateChange, periodsCost } from '../../../../utils/rates';
import { formatCost, formatMoney, noLoneWord } from '../../../../utils/formatters';
import { formatClock, formatDuration } from '../../../../utils/sessionHelpers';
import { formatHourly, formatMaxStay } from '../../../../utils/spotPresentation';
import { styles } from './styles';

const QUICK = DURATION_OPTIONS.filter((opt) => opt.quickSelect);
const LONGEST_QUICK = Math.max(...QUICK.map((opt) => opt.value));
// A restriction this close leaves no time worth starting a session for.
const SHORTEST_STAY = 5; // minutes

// Quick picks that fit the spot's maximum stay, plus the maximum itself when
// it is not already one of them (45 min, 90 min, 8 hours…).
export function durationsFor(maxMinutes) {
    const quick = QUICK;
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

// What a spot's stay limit (getStayLimit) means for the setup: the longest
// duration to offer, the note under the durations, and, when nobody may park
// there now, when that ends.
export function setupLimit(limit) {
    const none = { maxMinutes: null, note: null, noParkingUntil: null };
    if (!limit) return none;
    if (limit.reason === 'restricted') return { ...none, noParkingUntil: limit.until };
    if (limit.reason === 'restriction') {
        if (limit.minutes < SHORTEST_STAY) return { ...none, noParkingUntil: limit.ends };
        // A restriction after the longest quick pick changes nothing.
        if (limit.minutes >= LONGEST_QUICK) return none;
        return {
            ...none,
            maxMinutes: limit.minutes,
            note: `No parking from ${formatClock(limit.until)}, so the longest here is ${formatDuration(limit.minutes)}.`,
        };
    }
    return { ...none, maxMinutes: limit.minutes, note: `${formatMaxStay(limit.minutes)} here. Check posted signs.` };
}

// What still stands between the driver and Start, said under it; null when
// nothing does. `needsPlace`: there is a choice of place and none is made.
export function startBlocker({ plate, needsPlace }) {
    const noPlate = !plate.trim();
    if (needsPlace && noPlate) return 'Pick where you parked and add your plate to start.';
    if (needsPlace) return 'Pick where you parked to start.';
    if (noPlate) return 'Add your plate to start.';
    return null;
}

/**
 * SetupCard - where (when there is a choice), plate and duration, with a
 * summary of what Start will commit to: when it ends and what it costs. Just
 * above Start it says where to pay, since starting the timer pays for nothing.
 *
 * rate:     the spot's hourly rate now (0 while the City isn't charging), or
 *           null with a rateNote: no price is made up
 * ratePeriods: the City's rates by time of day (utils/rates); a stay is
 *           priced minute by minute from them when known
 * chargeHours: when the City charges (utils/chargeHours); only those minutes
 *           are priced. null: every minute is
 * maxMinutes: the longest stay here (the posted maximum, or until a
 *           restriction starts); durations stay within it. limitNote says why.
 * noParkingUntil: nobody may park here until then (rush hour), so there is
 *           nothing to start
 * where:    the place picker, shown first
 * needsPlace: the picker has no choice yet, so Start waits for one
 */
const SetupCard = ({
    where = null,
    needsPlace = false,
    vehiclePlate,
    setVehiclePlate,
    selectedDuration,
    setSelectedDuration,
    onStartSession,
    rate = null,
    rateNote = null,
    ratePeriods = null,
    chargeHours = null,
    maxMinutes = null,
    limitNote = null,
    noParkingUntil = null,
    zoneLabel = null,
    payLine,
    now = Date.now(),
}) => {
    const durations = useMemo(() => durationsFor(maxMinutes), [maxMinutes]);
    const duration = snapDuration(durations, selectedDuration);
    // null when the price of any of it is unknown.
    const costFor = (minutes) => (ratePeriods
        ? periodsCost(ratePeriods, chargeHours, now, minutes)
        : chargedCost(rate, chargeHours, now, minutes));
    const totalCost = costFor(duration);
    // Why the cost is not the rate now times the time, when it isn't: the
    // rate changes, or the City starts or stops charging, during the stay.
    let costNote = null;
    const change = totalCost !== null ? nextRateChange(ratePeriods, chargeHours, now, duration) : null;
    if (change) {
        costNote = change.rate ? `${formatHourly(change.rate)} from ${formatClock(change.at)}.` : `Free from ${formatClock(change.at)}.`;
    } else if (totalCost !== null && !ratePeriods) {
        const charged = chargedMinutes(chargeHours, now, duration);
        costNote = charged < duration ? `Only ${formatDuration(charged)} of it is charged.` : null;
    }

    // The shown duration is what Start uses. The driver's own pick is kept, so
    // trying a spot with a shorter maximum does not lose it.
    const endsAt = formatClock(now + duration * 60000);
    const blocker = noParkingUntil
        ? `Pick another spot, or come back at ${formatClock(noParkingUntil)}.`
        : startBlocker({ plate: vehiclePlate, needsPlace });
    const isValid = !blocker;

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
            {where ? (
                <View style={styles.setupSection}>
                    <View style={styles.setupContent}>
                        <Text style={styles.setupLabel}>Spot</Text>
                        {where}
                    </View>
                </View>
            ) : null}

            <View style={styles.setupSection}>
                <View style={styles.setupContent}>
                    <Text style={styles.setupLabel}>Vehicle license plate</Text>
                    <TextInput
                        value={vehiclePlate}
                        onChangeText={setVehiclePlate}
                        placeholder="Enter your plate"
                        placeholderTextColor={TOKENS.textLight}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={10}
                        style={[styles.plateInput, !vehiclePlate && styles.plateInputEmpty]}
                        selectionColor={TOKENS.primary}
                        accessibilityLabel="Vehicle license plate"
                        accessibilityHint="Enter your vehicle's license plate number"
                    />
                </View>
            </View>

            <View style={styles.setupSection}>
                <View style={styles.setupContent}>
                    <Text style={styles.setupLabel}>How long</Text>
                    {noParkingUntil ? (
                        <View style={styles.noParking} accessibilityRole="alert">
                            <MaterialCommunityIcons name="car-off" size={18} color={TOKENS.warningInk} />
                            <Text style={styles.noParkingText}>
                                No parking here until {formatClock(noParkingUntil)}. It’s a weekday rush-hour restriction.
                            </Text>
                        </View>
                    ) : (
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
                                        accessibilityLabel={costFor(option.value) === null
                                            ? formatDuration(option.value)
                                            : `${formatDuration(option.value)}, ${formatCost(costFor(option.value))}`}
                                    >
                                        <View style={styles.durationHead}>
                                            <Text
                                                style={[styles.durationTime, selected && styles.durationTimeActive]}
                                                numberOfLines={1}
                                                adjustsFontSizeToFit
                                                minimumFontScale={0.85}
                                            >
                                                {formatDuration(option.value)}
                                            </Text>
                                        </View>
                                        {costFor(option.value) !== null ? (
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
                    )}
                    {limitNote && !noParkingUntil ? <Text style={styles.setupHint}>{noLoneWord(limitNote)}</Text> : null}
                </View>
            </View>

            {/* What Start commits to: when it ends, and what ParkPlus will charge */}
            {noParkingUntil ? null : (
                <>
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
                                    : `${rate ? `${formatMoney(rate)} / hour` : 'Free now'}${zoneLabel ? ` · ${zoneLabel}` : ''}`}
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
                </>
            )}

            <TouchableOpacity
                onPress={() => onStartSession(duration)}
                activeOpacity={0.9}
                style={[styles.primaryButton, !isValid && styles.primaryButtonDisabled]}
                disabled={!isValid}
                accessibilityRole="button"
                accessibilityLabel={`Start session: ${formatDuration(duration)}, ends at ${endsAt}`}
                accessibilityHint={blocker ?? undefined}
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
            {blocker ? <Text style={styles.disabledHint}>{noLoneWord(blocker)}</Text> : null}
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
