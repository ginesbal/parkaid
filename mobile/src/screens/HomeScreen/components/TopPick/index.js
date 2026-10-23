import React from 'react';
import { Pressable, Text, View } from 'react-native';
import SpotMap from '../../../../components/SpotMap';
import {
    getRateDisplay,
    getSpotKind,
    getSpotName,
    getWalkLabel,
    getZoneLabel,
} from '../../../../utils/spotPresentation';
import { styles } from './styles';

const REASONS = {
    near: 'Closest to you',
    value: 'Best value nearby',
};

// fromDowntown: the list is measured from downtown, not from the phone.
const TopPick = ({ spot, view, onView, fromDowntown = false }) => {
    const reason = view === 'near' && fromDowntown ? 'Closest to downtown' : REASONS[view];
    const { title, detail } = getSpotName(spot);
    const rate = getRateDisplay(spot);
    const meta = [getZoneLabel(spot) || getSpotKind(spot), getWalkLabel(spot)]
        .filter(Boolean)
        .join(' · ');
    const rateSpoken = rate.amount ? `${rate.amount} per hour` : rate.note;

    // The whole card is one target; "View parking" shows what a tap does.
    return (
        <Pressable
            onPress={() => onView(spot)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={`View parking at ${title}. ${reason}. ${meta}. ${rateSpoken}.`}
        >
            {({ pressed }) => (
                <>
                    <View style={styles.top}>
                        <View style={styles.info}>
                            <View style={styles.reason}>
                                <Text style={styles.reasonText}>{reason}</Text>
                            </View>
                            <Text style={styles.title} numberOfLines={2}>{title}</Text>
                            {detail ? <Text style={styles.detail} numberOfLines={1}>{detail}</Text> : null}
                            <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
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
                        <Text style={styles.buttonText}>View parking</Text>
                    </View>
                </>
            )}
        </Pressable>
    );
};

export default React.memo(TopPick);
