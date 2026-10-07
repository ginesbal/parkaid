import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { TOKENS } from '../constants/theme';

export const TAB_ICONS = {
    Home: { active: 'home', inactive: 'home-outline' },
    Map: { active: 'map', inactive: 'map-outline' },
    Park: { active: 'car', inactive: 'car-outline' },
};

/**
 * TabIcon — a tab bar icon, optionally with a status dot (the Park tab shows
 * one while a timer runs, so it's visible from Home and the map).
 */
export default function TabIcon({ route, focused, color, size, dotColor }) {
    const icons = TAB_ICONS[route];
    return (
        <View style={styles.iconWrap}>
            <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />
            {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    iconWrap: {
        width: 44,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    // On the icon's top-right shoulder. The ring in the tab bar's color keeps
    // it distinct from the glyph underneath.
    dot: {
        position: 'absolute',
        top: 2,
        right: 6,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: TOKENS.surface,
    },
});
