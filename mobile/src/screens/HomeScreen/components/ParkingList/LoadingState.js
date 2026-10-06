import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '../../../../constants/theme';
import { getDistanceLabel } from '../../../../utils/parkingHelpers';
import { styles } from './styles';

/**
 * LoadingState - Initial loading screen with skeleton placeholders
 */
const LoadingState = ({ searchRadius }) => {
    const pulseAnim = useRef(new Animated.Value(0.45)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 950,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.45,
                    duration: 950,
                    useNativeDriver: true,
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
                <Text style={styles.loadingSubtext}>
                    Checking within {getDistanceLabel(searchRadius)} of you
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
