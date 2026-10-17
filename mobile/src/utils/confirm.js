// confirm — a yes/no question that works on phones and on web.
// React Native Web's Alert.alert does nothing, so web uses window.confirm.

import { Alert, Platform } from 'react-native';

export function confirm({ title, message, confirmText = 'OK', destructive = false, onConfirm }) {
    if (Platform.OS === 'web') {
        // eslint-disable-next-line no-alert
        if (typeof window !== 'undefined' && window.confirm([title, message].filter(Boolean).join('\n\n'))) {
            onConfirm?.();
        }
        return;
    }

    Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);
}
