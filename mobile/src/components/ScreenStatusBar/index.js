// ScreenStatusBar — the status bar style for the screen the user is looking at.
// Tabs stay mounted in the background, and React Native lets the most recently
// mounted StatusBar win; rendering it only while focused keeps a hidden tab
// (say, the ink Park tab) from setting the icons on the visible one.

import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

export default function ScreenStatusBar({ style = 'dark' }) {
    const focused = useIsFocused();
    return focused ? <StatusBar style={style} /> : null;
}
