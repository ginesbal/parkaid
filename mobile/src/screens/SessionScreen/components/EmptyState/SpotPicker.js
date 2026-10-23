import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import { getRateDisplay, getSpotKind, getSpotName, getZoneLabel } from '../../../../utils/spotPresentation';
import { styles } from './styles';

// The choice for a place not in the list.
export const ELSEWHERE = 'elsewhere';

function PlaceOption({ title, detail, selected, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.place, selected && styles.placeActive, pressed && styles.placePressed]}
            accessibilityRole="radio"
            aria-checked={selected}
            accessibilityLabel={detail ? `${title}, ${detail}` : title}
        >
            <MaterialCommunityIcons
                name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                size={22}
                color={selected ? TOKENS.primary : TOKENS.textLight}
            />
            <View style={styles.placeText}>
                <Text style={styles.placeTitle} numberOfLines={1}>{title}</Text>
                {detail ? <Text style={styles.placeDetail} numberOfLines={1}>{detail}</Text> : null}
            </View>
        </Pressable>
    );
}

/**
 * SpotPicker - where the car is: the closest places from the last search,
 * then "Somewhere else" with the zone from the sign, if it has one.
 * `choice` is a place's id as a string, or ELSEWHERE.
 */
export default function SpotPicker({ places, choice, onChoose, zone, setZone }) {
    return (
        <View style={styles.places} accessibilityRole="radiogroup">
            {places.map((spot) => {
                const id = String(spot.id);
                const rate = getRateDisplay(spot);
                const detail = [
                    getZoneLabel(spot) || getSpotKind(spot),
                    rate.amount ? `${rate.amount} ${rate.unit}` : rate.short,
                ].join(' · ');
                return (
                    <PlaceOption
                        key={id}
                        title={getSpotName(spot).title}
                        detail={detail}
                        selected={choice === id}
                        onPress={() => onChoose(id)}
                    />
                );
            })}
            <PlaceOption
                title="Somewhere else"
                detail={places.length ? 'Not one of these' : null}
                selected={choice === ELSEWHERE}
                onPress={() => onChoose(ELSEWHERE)}
            />
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
