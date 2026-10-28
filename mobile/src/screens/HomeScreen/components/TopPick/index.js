import React from 'react';
import { Pressable, Text, View } from 'react-native';
import SpotMap from '../../../../components/SpotMap';
import {
    getCaution,
    getRateDisplay,
    getRowMeta,
    getSpotName,
} from '../../../../utils/spotPresentation';
import { styles } from './styles';

const REASONS = {
    near: 'Closest to you',
    value: 'Best value nearby',
};

// fromDowntown: the list is measured from downtown, not from the phone.
// now: the time the caution is for (useMinute).
const TopPick = ({ spot, view, onView, fromDowntown = false, now = Date.now() }) => {
    const reason = view === 'near' && fromDowntown ? 'Closest to downtown' : REASONS[view];
    const { title } = getSpotName(spot);
    const rate = getRateDisplay(spot, now);
    // The rows' second line, with the zone to pay with.
    const meta = getRowMeta(spot, { withZone: true });
    const limit = getCaution(spot, now);

    // The whole card is one target; "View spot" shows what a tap does.
    return (
        <Pressable
            onPress={() => onView(spot)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={`View spot: ${[title, reason, meta, limit, rate.spoken].filter(Boolean).join('. ')}.`}
        >
            {({ pressed }) => (
                <>
                    <View style={styles.top}>
                        <View style={styles.info}>
                            <View style={styles.reason}>
                                <Text style={styles.reasonText}>{reason}</Text>
                            </View>
                            <Text style={styles.title} numberOfLines={2}>{title}</Text>
                            <Text style={styles.meta} numberOfLines={2}>
                                {meta}
                                {limit ? <Text style={styles.limit}>{` · ${limit}`}</Text> : null}
                            </Text>
                            {rate.amount ? (
                                <Text style={styles.price}>
                                    {rate.amount}
                                    <Text style={styles.priceUnit}> {rate.unit}</Text>
                                </Text>
                            ) : (
                                <Text style={styles.rateNote}>{rate.note}</Text>
                            )}
                        </View>
                        <SpotMap spot={spot} width={88} height={88} />
                    </View>

                    <View style={[styles.button, pressed && styles.buttonPressed]}>
                        <Text style={styles.buttonText}>View spot</Text>
                    </View>
                </>
            )}
        </Pressable>
    );
};

export default React.memo(TopPick);
