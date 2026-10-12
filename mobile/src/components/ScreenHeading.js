// src/components/ScreenHeading.js
//
// A level-one heading that names the screen for screen readers on the web,
// where switching tabs doesn't move focus and a heading is how people find
// their place. It isn't drawn: the screens are designed without a title bar.
// Phones announce the selected tab themselves, so it renders nothing there.

import { Platform, StyleSheet, Text } from 'react-native';

export default function ScreenHeading({ children }) {
    if (Platform.OS !== 'web') return null;
    return (
        <Text role="heading" aria-level={1} style={styles.hidden}>
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    hidden: {
        position: 'absolute',
        width: 1,
        height: 1,
        margin: -1,
        padding: 0,
        overflow: 'hidden',
        borderWidth: 0,
    },
});
