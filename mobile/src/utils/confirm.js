// confirm — a yes/no question that works on phones and on web.
// Phones use the system alert. React Native Web's Alert.alert does nothing,
// so web asks in ConfirmHost's dialog, mounted once in App.js; the browser's
// own confirm box is only the fallback before it mounts.

import { Alert, Platform } from 'react-native';

let showDialog = null;

// ConfirmHost hands over how to show a request; returns the unregister.
export function registerConfirmHost(show) {
    showDialog = show;
    return () => {
        if (showDialog === show) showDialog = null;
    };
}

export function confirm({ title, message, confirmText = 'OK', destructive = false, onConfirm }) {
    if (Platform.OS === 'web') {
        if (showDialog) {
            showDialog({ title, message, confirmText, destructive, onConfirm });
            return;
        }
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
