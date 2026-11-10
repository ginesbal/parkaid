// WelcomeScreen — first-run screen. Shown once, then the app opens on Home.
// The live Spline pin jumps and twirls; the copy fades up once.

import ScreenStatusBar from '../../components/ScreenStatusBar';
import { useRef, useState } from 'react';
import {
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandPin3D from '../../components/BrandPin3D';
import LiveStage from '../../components/LiveStage';
import { SPLINE_BADGE, SPLINE_LIVE, SPLINE_SCENES } from '../../constants/spline';
import { MOTION, RADIUS, SPACING, TOKENS, TYPOGRAPHY } from '../../constants/theme';
import { useEntrance } from '../../hooks/useEntrance';
import { markWelcomeSeen } from '../../utils/onboarding';

// headline, body, footer
const ENTRANCE_ITEMS = 3;

// Room under the footnote for the Spline badge in the bottom-right corner.
const BOTTOM_ROOM = SPLINE_LIVE ? SPLINE_BADGE.height + 2 * SPLINE_BADGE.inset : SPACING['2xl'];

export default function WelcomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const pinSize = Math.round(Math.min(width * 0.56, height * 0.3, 240));
    // The live pin holds its spot only while the page is unscrolled.
    const [scrolled, setScrolled] = useState(false);

    const rise = useEntrance(ENTRANCE_ITEMS);
    const pressScale = useRef(new Animated.Value(1)).current;

    const pressTo = (toValue) => {
        Animated.timing(pressScale, {
            toValue,
            duration: MOTION.duration.fast,
            easing: MOTION.easing,
            useNativeDriver: true,
        }).start();
    };

    const handleExplore = () => {
        markWelcomeSeen();
        navigation.replace('Tabs');
    };

    return (
        <View style={styles.container}>
            <ScreenStatusBar style="dark" />
            <LiveStage insetBottom={insets.bottom}>
                <ScrollView
                    contentContainerStyle={[
                        styles.content,
                        {
                            paddingTop: insets.top + SPACING.lg,
                            paddingBottom: insets.bottom + BOTTOM_ROOM,
                        },
                    ]}
                    onScroll={(e) => setScrolled(Math.abs(e.nativeEvent.contentOffset.y) > 1)}
                    scrollEventThrottle={16}
                    alwaysBounceVertical={false}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.brand}>ParkAid</Text>

                    <View style={styles.pinStage}>
                        <BrandPin3D scene={SPLINE_SCENES.loader} size={pinSize} suspended={scrolled} />
                    </View>

                    <Animated.Text style={[styles.headline, rise[0]]} accessibilityRole="header">
                        A little less circling.{'\n'}A little more city.
                    </Animated.Text>
                    <Animated.Text style={[styles.body, rise[1]]}>
                        Find a spot to park,{'\n'}then get on with your day.
                    </Animated.Text>

                    <Animated.View style={[styles.footer, rise[2]]}>
                        <Pressable
                            onPress={handleExplore}
                            onPressIn={() => pressTo(MOTION.pressScale)}
                            onPressOut={() => pressTo(1)}
                            accessibilityRole="button"
                            accessibilityHint="Opens nearby parking"
                        >
                            <Animated.View style={[styles.cta, { transform: [{ scale: pressScale }] }]}>
                                <Text style={styles.ctaLabel}>Explore parking</Text>
                            </Animated.View>
                        </Pressable>
                        <Text style={styles.footnote}>Browse first. No account needed.</Text>
                    </Animated.View>
                </ScrollView>
            </LiveStage>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: TOKENS.bg,
    },
    // Phone-width column, centred on tablets and desktop web.
    content: {
        flexGrow: 1,
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
        paddingHorizontal: SPACING['2xl'],
    },
    brand: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: '600',
        letterSpacing: -0.4,
        color: TOKENS.primary,
    },
    pinStage: {
        flex: 1,
        minHeight: 160,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING['2xl'],
    },
    headline: {
        ...TYPOGRAPHY.hero,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
        color: TOKENS.textMuted,
        marginTop: SPACING.md,
    },
    footer: {
        marginTop: SPACING['3xl'],
        gap: SPACING.md,
    },
    // minHeight, not height: the pill grows with the label at large text sizes.
    cta: {
        minHeight: 52,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.surface,
        textAlign: 'center',
    },
    footnote: {
        fontSize: 12,
        lineHeight: 18,
        color: TOKENS.textMuted,
        textAlign: 'center',
    },
});
