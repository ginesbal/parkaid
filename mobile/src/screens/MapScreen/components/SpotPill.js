// SpotPill — how a spot looks on the map: the brand pin with its hourly rate,
// or the pin alone when the rate is unknown. Shared by the native Marker and
// the web preview.

import { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { PIN } from '../../../components/BrandPin';
import { RADIUS, TOKENS } from '../../../constants/theme';
import { getHourlyRate } from '../../../utils/spotPresentation';

export function getPillLabel(spot) {
    const rate = getHourlyRate(spot);
    if (rate === null) return null;
    return `$${rate % 1 === 0 ? rate : rate.toFixed(2)}`;
}

function SpotPill({ spot, selected = false, onImageLoad }) {
    const label = getPillLabel(spot);
    return (
        <View
            style={[
                styles.pill,
                !label && styles.pillIconOnly,
                selected && styles.pillSelected,
                selected && !label && styles.pillIconOnlySelected,
            ]}
        >
            <Image
                source={PIN}
                style={selected ? styles.pinSelected : styles.pin}
                resizeMode="contain"
                onLoad={onImageLoad}
            />
            {label ? <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        height: 30,
        paddingLeft: 4,
        paddingRight: 10,
        borderRadius: RADIUS.pill,
        backgroundColor: TOKENS.surface,
        borderWidth: 1,
        borderColor: TOKENS.hairlineStrong,
        // Lift off the map tiles; native markers are bitmaps, so keep shadows small.
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    pillIconOnly: {
        width: 30,
        paddingLeft: 0,
        paddingRight: 0,
        justifyContent: 'center',
    },
    // Selected: ink and a size up, like the Details screen it leads to.
    pillSelected: {
        height: 36,
        backgroundColor: TOKENS.inkSurface,
        borderColor: TOKENS.surface,
        borderWidth: 2,
    },
    pillIconOnlySelected: {
        width: 36,
    },
    pin: {
        width: 22,
        height: 22,
    },
    pinSelected: {
        width: 26,
        height: 26,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },
    labelSelected: {
        fontSize: 15,
        color: TOKENS.surface,
    },
});

export default memo(SpotPill);
