import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Mirrors the OS motion preference — iOS "Reduce Motion", Android "Remove
// animations" — and updates live if the user toggles it while the app runs.
// Reduced motion means gentler motion, not none: keep fades, drop movement.
export function useReducedMotion() {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        let active = true;
        AccessibilityInfo.isReduceMotionEnabled()
            .then((value) => {
                if (active) setReduced(!!value);
            })
            .catch(() => {});

        const subscription = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            (value) => setReduced(!!value)
        );

        return () => {
            active = false;
            subscription?.remove?.();
        };
    }, []);

    return reduced;
}
