import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MapThumb from '../../../../components/MapThumb';
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
    covered: 'Covered',
};

const TopPick = ({ spot, view, onView }) => {
    const { title, detail } = getSpotName(spot);
    const rate = getRateDisplay(spot);
    const meta = [getZoneLabel(spot) || getSpotKind(spot), getWalkLabel(spot)]
        .filter(Boolean)
        .join(' · ');
    const rateSpoken = rate.amount ? `${rate.amount} per hour` : rate.note;

    return (
        <View style={styles.card}>
            <View style={styles.top}>
                <View
                    style={styles.info}
                    accessible
                    accessibilityLabel={`${REASONS[view]}. ${title}. ${meta}. ${rateSpoken}.`}
                >
                    <View style={styles.reason}>
                        <Text style={styles.reasonText}>{REASONS[view]}</Text>
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
                <MapThumb />
            </View>

            <Pressable
                onPress={() => onView(spot)}
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                accessibilityRole="button"
                accessibilityLabel={`View parking at ${title}`}
            >
                <Text style={styles.buttonText}>View parking</Text>
            </Pressable>
        </View>
    );
};

export default React.memo(TopPick);
