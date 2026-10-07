// App.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// screens
import HomeScreen from './src/screens/HomeScreen/index';
import MapScreen from './src/screens/MapScreen/index';
import SessionScreen from './src/screens/SessionScreen/index';

// services
import TabIcon from './src/navigation/TabIcon';
import { initTimerReminders, useReminderTaps } from './src/services/timerReminders';
import { getDeviceId } from './src/utils/device';
import { TOKENS } from './src/constants/theme';

const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();
const TAB_LABELS = {
    Home: 'Home',
    Map: 'Map',
    Park: 'Park',
};

function AppNavigation() {
    const insets = useSafeAreaInsets();
    const [, setDeviceId] = useState(null);
    const [, setLocation] = useState(null);
    const tabBarBottomPadding = Math.max(insets.bottom, Platform.select({ ios: 12, android: 10 }));
    const tabBarHeight = 66 + tabBarBottomPadding;

    // Parking reminders: show them even while the app is open, and open the
    // Park tab when one is tapped. A tap can arrive before navigation is
    // ready (it launched the app), so it waits for onReady.
    useEffect(() => {
        initTimerReminders();
    }, []);
    const pendingOpenParkRef = useRef(false);
    const openPark = useCallback(() => {
        if (navigationRef.isReady()) {
            navigationRef.navigate('Park');
        } else {
            pendingOpenParkRef.current = true;
        }
    }, []);
    const handleNavigationReady = useCallback(() => {
        if (!pendingOpenParkRef.current) return;
        pendingOpenParkRef.current = false;
        navigationRef.navigate('Park');
    }, []);
    useReminderTaps(openPark);

    useEffect(() => {
        (async () => {
            const id = await getDeviceId();
            setDeviceId(id);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc.coords);
                await AsyncStorage.setItem('userLocation', JSON.stringify(loc.coords));
            }
        })();
    }, []);

    return (
        <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
            <Tab.Navigator
                sceneContainerStyle={{
                    backgroundColor: TOKENS.bg,
                }}
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarShowLabel: true,
                    tabBarIcon: ({ focused, color, size }) => (
                        <TabIcon route={route.name} focused={focused} color={color} size={size} />
                    ),
                    tabBarLabel: ({ focused, color }) => (
                        <Text
                            style={[
                                navStyles.label,
                                focused ? navStyles.labelActive : navStyles.labelInactive,
                                { color },
                            ]}
                        >
                            {TAB_LABELS[route.name]}
                        </Text>
                    ),
                    tabBarActiveTintColor: TOKENS.primary,
                    tabBarInactiveTintColor: TOKENS.textMuted,
                    tabBarHideOnKeyboard: true,
                    tabBarStyle: {
                        backgroundColor: TOKENS.surface,
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: TOKENS.hairline,
                        height: tabBarHeight,
                        paddingTop: 10,
                        paddingBottom: tabBarBottomPadding,
                        paddingHorizontal: 14,
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    tabBarLabelStyle: {
                        marginBottom: Platform.select({ ios: 2, android: 3 }),
                    },
                    tabBarIconStyle: {
                        marginTop: 0,
                    },
                    tabBarItemStyle: {
                        minHeight: 52,
                        marginHorizontal: 3,
                        marginTop: 1,
                        paddingTop: 2,
                        paddingBottom: 0,
                    },
                })}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ tabBarLabel: 'Home' }}
                />
                <Tab.Screen
                    name="Map"
                    component={MapScreen}
                    options={{ tabBarLabel: 'Map' }}
                />
                <Tab.Screen
                    name="Park"
                    component={SessionScreen}
                    // Mounted at launch (not on first visit), so a running
                    // timer's dot shows on the tab right away.
                    options={{ tabBarLabel: 'Park', lazy: false }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AppNavigation />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const navStyles = StyleSheet.create({
    label: {
        fontSize: 12,
        letterSpacing: 0.1,
        textAlign: 'center',
    },
    labelInactive: {
        fontWeight: '600',
    },
    labelActive: {
        fontWeight: '600',
    },
});
