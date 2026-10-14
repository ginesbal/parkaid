import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WAKING_NOTICE } from '../../../../constants/loadErrors';
import { NATIVE_DRIVER, TOKENS } from '../../../../constants/theme';
import { getDistanceLabel } from '../../../../utils/parkingHelpers';
import { styles } from './styles';

/**
 * LoadingState - Initial loading screen with skeleton placeholders
 */
const LoadingState = ({ searchRadius, waking = false }) => {
    const pulseAnim = useRef(new Animated.Value(0.45)).current;

    // iOS has no live regions, so say it there too.
    useEffect(() => {
        if (waking && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(WAKING_NOTICE);
    }, [waking]);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 950,
                    useNativeDriver: NATIVE_DRIVER,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.45,
                    duration: 950,
                    useNativeDriver: NATIVE_DRIVER,
                }),
            ])
        );

        loop.start();
        return () => loop.stop();
    }, [pulseAnim]);

    return (
        <SafeAreaView style={styles.fullScreenBg} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            <View style={styles.loadingContainer}>
                <View style={styles.loadingIcon}>
                    <MaterialCommunityIcons
                        name="map-search"
                        size={40}
                        color={TOKENS.primary}
                    />
                </View>

                <Text style={styles.loadingText}>Looking for spots nearby</Text>
                {/* A long first wait gets explained, not just spun. */}
                <Text style={styles.loadingSubtext} accessibilityLiveRegion="polite">
                    {waking ? WAKING_NOTICE : `Checking within ${getDistanceLabel(searchRadius)} of you`}
                </Text>

                <View style={styles.loadingSkeletonStack}>
                    {[0, 1, 2].map((item) => (
                        <Animated.View
                            key={item}
                            style={[styles.loadingSkeletonCard, { opacity: pulseAnim }]}
                        >
                            <View style={styles.loadingSkeletonBadge} />
                            <View style={styles.loadingSkeletonContent}>
                                <View style={styles.loadingSkeletonLineWide} />
                                <View style={styles.loadingSkeletonLine} />
                            </View>
                            <View style={styles.loadingSkeletonPrice} />
                        </Animated.View>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default LoadingState;
