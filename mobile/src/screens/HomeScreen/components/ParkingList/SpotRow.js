import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RADIUS, SPACING, TOKENS, TYPOGRAPHY } from '../../../../constants/theme';
import {
    getRateDisplay,
    getSpotKind,
    getSpotName,
    getWalkLabel,
} from '../../../../utils/spotPresentation';

// Quieter than the top pick: name, kind and walk, rate, chevron.
const SpotRow = ({ spot, onPress }) => {
    const { title } = getSpotName(spot);
    const rate = getRateDisplay(spot);
    const meta = [getSpotKind(spot), getWalkLabel(spot)].filter(Boolean).join(' · ');
    const rateSpoken = rate.amount ? `${rate.amount} per hour` : rate.note;

    return (
        <Pressable
            onPress={() => onPress(spot)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel={`${title}. ${meta}. ${rateSpoken}.`}
        >
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
                {rate.amount ? (
                    <Text style={styles.rate}>
                        {rate.amount}
                        <Text style={styles.rateUnit}> {rate.unit}</Text>
                    </Text>
                ) : (
                    <Text style={styles.rateNote}>{rate.note}</Text>
                )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={TOKENS.textMuted} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        minHeight: 72,
        marginHorizontal: SPACING.xl,
        marginTop: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },
    rowPressed: {
        backgroundColor: TOKENS.surfaceMuted,
    },
    info: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: '600',
        color: TOKENS.text,
    },
    meta: {
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.textMuted,
        marginTop: 1,
    },
    rate: {
        ...TYPOGRAPHY.numSmall,
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '600',
        // Prices in ink: cerulean is for actions and selection.
        color: TOKENS.text,
        marginTop: SPACING.xs,
    },
    rateUnit: {
        fontSize: 13,
        fontWeight: '400',
        color: TOKENS.textMuted,
    },
    rateNote: {
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.text,
        marginTop: SPACING.xs,
    },
});

export default React.memo(SpotRow);
