import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// null until the OS answers, then true/false. Follows the setting live.
export function useReduceMotion() {
    const [reduceMotion, setReduceMotion] = useState(null);

    useEffect(() => {
        let mounted = true;
        AccessibilityInfo.isReduceMotionEnabled()
            .then((value) => mounted && setReduceMotion(Boolean(value)))
            .catch(() => mounted && setReduceMotion(false));

        const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value) => {
            if (mounted) setReduceMotion(Boolean(value));
        });

        return () => {
            mounted = false;
            sub?.remove?.();
        };
    }, []);

    return reduceMotion;
}
