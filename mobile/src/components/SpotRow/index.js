// SpotRow — one spot in a list, on Home and in the Map's sheet: its name,
// its kind and walk, and the rate on the right. Rows sit in a grouped inset
// list: `first` and `last` round the group's corners, hairlines run between.
// `selected` (the Map's chosen pin) uses the one selection style; `chevron`
// marks rows that open Details.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RADIUS, SELECTED, SPACING, TOKENS } from '../../constants/theme';
import { getRateDisplay, getSpotKind, getSpotName, getWalkLabel } from '../../utils/spotPresentation';

function SpotRow({ spot, onPress, selected = false, first = false, last = false, chevron = false, inset = SPACING.xl }) {
    const { title } = getSpotName(spot);
    const rate = getRateDisplay(spot);
    const meta = [getSpotKind(spot), getWalkLabel(spot)].filter(Boolean).join(' · ');
    const rateSpoken = rate.amount ? `${rate.amount} per hour` : rate.note;

    return (
        <View style={[styles.group, { marginHorizontal: inset }, first && styles.first, last && styles.last]}>
            <Pressable
                onPress={() => onPress(spot)}
                style={({ pressed }) => [styles.row, selected && styles.selected, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${title}. ${meta}. ${rateSpoken}.`}
                aria-selected={selected}
            >
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {meta ? <Text style={styles.meta} numberOfLines={1}>{meta}</Text> : null}
                </View>
                {rate.amount ? (
                    <Text style={styles.price}>
                        {rate.amount}
                        <Text style={styles.unit}>{'\n'}{rate.unit}</Text>
                    </Text>
                ) : (
                    <Text style={styles.note} numberOfLines={1}>{rate.short}</Text>
                )}
                {chevron ? <MaterialCommunityIcons name="chevron-right" size={22} color={TOKENS.textMuted} /> : null}
            </Pressable>
            {last ? null : <View style={styles.separator} />}
        </View>
    );
}

const styles = StyleSheet.create({
    // The group's card is drawn by its rows: sides on every row, the top on
    // the first and the bottom on the last.
    group: {
        overflow: 'hidden',
        backgroundColor: TOKENS.surface,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },
    first: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg,
    },
    last: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomLeftRadius: RADIUS.lg,
        borderBottomRightRadius: RADIUS.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        minHeight: 64,
        paddingVertical: SPACING.md,
        paddingLeft: SPACING.lg,
        paddingRight: SPACING.md,
    },
    selected: {
        backgroundColor: SELECTED.surface.backgroundColor,
    },
    pressed: {
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
        marginTop: 2,
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.textMuted,
    },
    price: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '600',
        color: TOKENS.text,
        textAlign: 'right',
        fontVariant: ['tabular-nums'],
    },
    unit: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400',
        color: TOKENS.textMuted,
    },
    note: {
        maxWidth: 96,
        fontSize: 13,
        fontWeight: '500',
        color: TOKENS.textMuted,
        textAlign: 'right',
    },
    // Inset to where the text starts.
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: SPACING.lg,
        backgroundColor: TOKENS.divider,
    },
});

export default memo(SpotRow);
