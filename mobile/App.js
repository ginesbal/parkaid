// App.js

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// screens
import HomeScreen from './src/screens/HomeScreen/index';
import MapScreen from './src/screens/MapScreen/index';
import SessionScreen from './src/screens/SessionScreen/index';
import DetailsScreen from './src/screens/DetailsScreen/index';
import WelcomeScreen from './src/screens/WelcomeScreen/index';

// services
import BrandLoader from './src/components/BrandLoader';
import ConfirmHost from './src/components/ConfirmHost';
import LiveStage from './src/components/LiveStage';
import SessionStrip from './src/components/SessionStrip';
import { SessionProvider, useSessionStatus } from './src/context/SessionContext';
import { getDeviceId } from './src/utils/device';
import { TOKENS } from './src/constants/theme';
import { useReduceMotion } from './src/hooks/useReduceMotion';
import { hasSeenWelcome } from './src/utils/onboarding';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const TAB_CONFIG = {
    Home: {
        label: 'Home',
        activeIcon: 'home',
        inactiveIcon: 'home-outline',
    },
    Map: {
        label: 'Map',
        activeIcon: 'map',
        inactiveIcon: 'map-outline',
    },
    // The P of the brand pin, rather than a generic car.
    Park: {
        label: 'Park',
        iconSet: MaterialCommunityIcons,
        activeIcon: 'alpha-p-box',
        inactiveIcon: 'alpha-p-box-outline',
    },
};

// The Park tab's dot while a session runs, coloured by its state.
const SESSION_DOT = {
    active: TOKENS.primary,
    expiring: TOKENS.warning,
    expired: TOKENS.danger,
};

// The tab bar, with the running session's strip above it everywhere but Park.
function TabBarWithSession(props) {
    const current = props.state.routes[props.state.index]?.name;
    return (
        <View>
            <SessionStrip navigation={props.navigation} hidden={current === 'Park'} />
            <BottomTabBar {...props} />
        </View>
    );
}

// Mounted only after Welcome, so the location prompt (asked by Home, see
// useLocationManager) never covers it.
function MainTabs() {
    const [, setDeviceId] = useState(null);

    useEffect(() => {
        getDeviceId().then(setDeviceId);
    }, []);

    return (
        <SessionProvider>
            <Tabs />
        </SessionProvider>
    );
}

function Tabs() {
    const insets = useSafeAreaInsets();
    const sessionStatus = useSessionStatus();
    const tabBarBottomPadding = Math.max(insets.bottom, Platform.select({ ios: 12, android: 10 }));
    const tabBarHeight = 66 + tabBarBottomPadding;

    // A moment, while the stored session is read: a driver who is parked
    // opens straight on Park.
    if (!sessionStatus.isLoaded) return <View style={navStyles.waiting} />;

    return (
        <Tab.Navigator
            initialRouteName={sessionStatus.active ? 'Park' : 'Home'}
            tabBar={(props) => <TabBarWithSession {...props} />}
            sceneContainerStyle={{
                backgroundColor: TOKENS.bg,
            }}
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarIcon: ({ focused, color, size }) => {
                    const tabMeta = TAB_CONFIG[route.name];
                    const Icon = tabMeta.iconSet || Ionicons;
                    const dot = route.name === 'Park' && sessionStatus.active
                        ? SESSION_DOT[sessionStatus.state] || SESSION_DOT.active
                        : null;
                    return (
                        <View style={navStyles.iconWrap}>
                            <Icon
                                name={focused ? tabMeta.activeIcon : tabMeta.inactiveIcon}
                                size={size}
                                color={color}
                            />
                            {dot ? <View style={[navStyles.sessionDot, { backgroundColor: dot }]} /> : null}
                        </View>
                    );
                },
                tabBarLabel: ({ focused, color }) => {
                    const tabMeta = TAB_CONFIG[route.name];
                    return (
                        <Text
                            style={[
                                navStyles.label,
                                focused ? navStyles.labelActive : navStyles.labelInactive,
                                { color },
                            ]}
                        >
                            {tabMeta.label}
                        </Text>
                    );
                },
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
                options={{
                    tabBarLabel: 'Park',
                    tabBarAccessibilityLabel: sessionStatus.active ? 'Park, you are parked' : 'Park',
                }}
            />
        </Tab.Navigator>
    );
}

function AppNavigation() {
    // null until the first-run flag is read; then 'Welcome' or 'Tabs'
    const [initialRoute, setInitialRoute] = useState(null);
    const reduceMotion = useReduceMotion();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        hasSeenWelcome().then((seen) => setInitialRoute(seen ? 'Tabs' : 'Welcome'));
    }, []);

    // Usually resolves in a few ms; the loader only appears if storage is slow.
    if (!initialRoute) {
        return (
            <LiveStage style={navStyles.boot} insetBottom={insets.bottom}>
                <BrandLoader size={140} delay={400} live />
            </LiveStage>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: TOKENS.bg },
                }}
            >
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Tabs" component={MainTabs} options={{ animation: 'fade' }} />
                {/* Pushed over the tabs, so the tab bar hides on this focus screen */}
                <Stack.Screen
                    name="Details"
                    component={DetailsScreen}
                    options={{
                        contentStyle: { backgroundColor: TOKENS.inkSurface },
                        // Crossfade instead of a sideways push under reduce motion.
                        animation: reduceMotion ? 'fade' : 'default',
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AppNavigation />
                {/* Web's yes/no questions (see utils/confirm); phones use the system alert. */}
                {Platform.OS === 'web' ? <ConfirmHost /> : null}
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const navStyles = StyleSheet.create({
    boot: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: TOKENS.bg,
    },
    iconWrap: {
        width: 44,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    // Top-right of the Park icon, ringed in the tab bar's white.
    sessionDot: {
        position: 'absolute',
        top: 1,
        right: 7,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: TOKENS.surface,
    },
    waiting: {
        flex: 1,
        backgroundColor: TOKENS.bg,
    },
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
