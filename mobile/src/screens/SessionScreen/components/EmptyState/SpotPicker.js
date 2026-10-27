import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import { getDistanceLabel } from '../../../../utils/parkingHelpers';
import { getCrossStreets, getRateDisplay, getSpotKind, getSpotName, getZoneLabel } from '../../../../utils/spotPresentation';
import { styles } from './styles';

// The choice for a place not in the list.
export const ELSEWHERE = 'elsewhere';

// How far a place is from the phone, to the nearest 10 m: "40 m", "1.2 km".
const awayLabel = (meters) => getDistanceLabel(Math.max(10, Math.round(meters / 10) * 10));

// A street spot is told apart by its block and zone, as on the sign; the
// setup below gives its rate.
function describePlace(spot) {
    const cross = getCrossStreets(spot);
    if (cross) return [cross, getZoneLabel(spot)].filter(Boolean).join(' · ');
    const rate = getRateDisplay(spot);
    return [getZoneLabel(spot) || getSpotKind(spot), rate.amount ? `${rate.amount} ${rate.unit}` : rate.short].join(' · ');
}

// One place. Folded (the picked one, alone) it is a button that brings the
// others back; otherwise a radio.
function PlaceOption({ title, detail, away = null, selected, folded = false, onPress }) {
    const label = [title, detail, away !== null ? `${awayLabel(away)} from you` : null].filter(Boolean).join(', ');
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.place, selected && styles.placeActive, pressed && styles.placePressed]}
            accessibilityRole={folded ? 'button' : 'radio'}
            aria-checked={folded ? undefined : selected}
            accessibilityLabel={folded ? `${label}. Change` : label}
            accessibilityHint={folded ? 'Shows the other places' : undefined}
        >
            <MaterialCommunityIcons
                name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                size={22}
                color={selected ? TOKENS.primary : TOKENS.textLight}
            />
            <View style={styles.placeText}>
                <Text style={[styles.placeTitle, selected && styles.placeTitleActive]} numberOfLines={1}>{title}</Text>
                {detail ? (
                    <Text style={[styles.placeDetail, selected && styles.placeDetailActive]} numberOfLines={1}>{detail}</Text>
                ) : null}
            </View>
            {folded ? <Text style={styles.placeChange}>Change</Text> : null}
            {!folded && away !== null ? <Text style={styles.placeAway}>{awayLabel(away)}</Text> : null}
        </Pressable>
    );
}

/**
 * SpotPicker - where the car is: the last search's places, nearest the phone
 * first with how far each is, then "Somewhere else" with the zone from the
 * sign, if it has one. `choice` is a place's id as a string, ELSEWHERE, or
 * null: nothing is picked until the driver picks. Once they do, the other
 * places fold away so the rest of the setup and Start come into view;
 * "Change" brings them back.
 */
export default function SpotPicker({ places, choice, onChoose, zone, setZone }) {
    const [changing, setChanging] = useState(false);
    const options = [
        ...places.map((spot) => ({
            id: String(spot.id),
            title: getSpotName(spot).title,
            detail: describePlace(spot),
            away: spot.away ?? null,
        })),
        { id: ELSEWHERE, title: 'Somewhere else', detail: places.length ? 'Not one of these' : null, away: null },
    ];
    // With nothing else to offer, "Somewhere else" is the only answer and
    // there is nothing to fold.
    const folded = choice !== null && places.length > 0 && !changing;
    const shown = folded ? options.filter((option) => option.id === choice) : options;

    const choose = (id) => {
        onChoose(id);
        setChanging(false);
    };

    return (
        <View style={styles.places} accessibilityRole={folded ? undefined : 'radiogroup'}>
            {shown.map((option) => (
                <PlaceOption
                    key={option.id}
                    title={option.title}
                    detail={option.detail}
                    away={option.away}
                    selected={choice === option.id}
                    folded={folded}
                    onPress={folded ? () => setChanging(true) : () => choose(option.id)}
                />
            ))}
            {choice === ELSEWHERE ? (
                <TextInput
                    value={zone}
                    onChangeText={(text) => setZone(text.replace(/\D/g, '').slice(0, 5))}
                    placeholder="Zone on the sign (optional)"
                    placeholderTextColor={TOKENS.textLight}
                    keyboardType="number-pad"
                    style={styles.zoneInput}
                    selectionColor={TOKENS.primary}
                    accessibilityLabel="ParkPlus zone, optional"
                    accessibilityHint="The zone number on the parking sign, if it has one"
                />
            ) : null}
        </View>
    );
}
