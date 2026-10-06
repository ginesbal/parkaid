import { Image, StyleSheet, Text, View } from 'react-native';
import { TOKENS, alpha } from '../../constants/theme';

export default function MapScreen() {
    return (
        <View style={styles.container}>
            <Image
                source={require('./utils/assets/map-screenshot.jpg')}
                style={styles.screenshot}
                resizeMode="cover"
            />
            <View style={styles.overlay}>
                <Text style={styles.overlayText}>
                    Map requires a native device. This is a web preview.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: TOKENS.bg,
    },
    screenshot: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        top: 80,
        left: 16,
        right: 16,
        backgroundColor: alpha(TOKENS.text, 0.9),
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
    },
    overlayText: {
        color: TOKENS.onPrimary,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
});
