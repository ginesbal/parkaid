// App.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
import { USE_DEVICE_LOCATION } from './src/constants/parking';
import { TOKENS } from './src/constants/theme';

const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();
// In a wide browser window (the web demo on a laptop) the app sits in a
// phone-width column, the layout it was designed for, instead of stretching
// across the screen.
const WEB_COLUMN_WIDTH = 480;

// On the web React Navigation draws each tab as a link, which a screen reader
// announces as a list of links. A plain button keeps the tab role it's given,
// and says which tab is selected (the web reads aria-selected).
const WebTabButton = ({ to, children, accessibilityState, ...props }) => (
    <Pressable {...props} accessibilityState={accessibilityState} aria-selected={accessibilityState?.selected}>
        {children}
    </Pressable>
);

// On the web the tab bar is the page's navigation landmark, so screen reader
// users can jump straight to it.
const WebTabBar = (props) => (
    <View role="navigation" aria-label="Tabs">
        <BottomTabBar {...props} />
    </View>
);

const TAB_LABELS = {
    Home: 'Home',
    Map: 'Map',
    Park: 'Park',
};

function AppNavigation() {
    const insets = useSafeAreaInsets();
    const [, setDeviceId] = useState(null);
    const [, setLocation] = useState(null);
    const tabBarBottomPadding = Math.max(insets.bottom, Platform.select({ ios: 12, android: 10, default: 10 }));
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

            // The web demo never asks (see USE_DEVICE_LOCATION).
            if (!USE_DEVICE_LOCATION) return;
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
                tabBar={Platform.OS === 'web' ? WebTabBar : undefined}
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
                    tabBarButton: Platform.OS === 'web' ? WebTabButton : undefined,
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
                        borderRadius: 12,
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
    const { width } = useWindowDimensions();
    const framed = Platform.OS === 'web' && width > WEB_COLUMN_WIDTH;

    return (
        <GestureHandlerRootView style={[frameStyles.page, framed && frameStyles.pageFramed]}>
            <View style={[frameStyles.app, framed && frameStyles.appFramed]}>
                <SafeAreaProvider>
                    <AppNavigation />
                </SafeAreaProvider>
            </View>
        </GestureHandlerRootView>
    );
}

const frameStyles = StyleSheet.create({
    page: {
        flex: 1,
    },
    // A quiet tint around the column, so it reads as the app, not a gap.
    pageFramed: {
        alignItems: 'center',
        backgroundColor: TOKENS.surfaceTint,
    },
    app: {
        flex: 1,
        width: '100%',
    },
    // overflow: hidden keeps the map, sheet and card inside the column.
    appFramed: {
        maxWidth: WEB_COLUMN_WIDTH,
        overflow: 'hidden',
        backgroundColor: TOKENS.bg,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
    },
});

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
