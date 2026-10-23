// ConfirmHost — the in-app dialog behind confirm() on web, in place of the
// browser's confirm box. Cancel comes first and takes focus, so a stray
// Enter never ends anything; Escape and a tap outside also cancel.

import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { RADIUS, SPACING, TOKENS, alpha } from '../../constants/theme';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { registerConfirmHost } from '../../utils/confirm';

export default function ConfirmHost() {
    const [request, setRequest] = useState(null);
    const reduceMotion = useReduceMotion();
    const cancelRef = useRef(null);

    useEffect(() => registerConfirmHost(setRequest), []);
    useEffect(() => {
        if (request) cancelRef.current?.focus?.();
    }, [request]);

    const cancel = () => setRequest(null);
    const accept = () => {
        const { onConfirm } = request;
        setRequest(null);
        onConfirm?.();
    };

    return (
        <Modal
            transparent
            visible={Boolean(request)}
            animationType={reduceMotion ? 'none' : 'fade'}
            onRequestClose={cancel}
        >
            {request ? (
                <View style={styles.backdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={cancel} accessibilityElementsHidden importantForAccessibility="no" />
                    <View style={styles.dialog} role="alertdialog" aria-modal aria-label={request.title}>
                        <Text style={styles.title} accessibilityRole="header">{request.title}</Text>
                        {request.message ? <Text style={styles.message}>{request.message}</Text> : null}
                        <View style={styles.buttons}>
                            <Pressable
                                ref={cancelRef}
                                onPress={cancel}
                                style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}
                                accessibilityRole="button"
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={accept}
                                style={({ pressed }) => [
                                    styles.button,
                                    request.destructive ? styles.destructive : styles.primary,
                                    pressed && styles.pressed,
                                ]}
                                accessibilityRole="button"
                            >
                                <Text style={styles.confirmText}>{request.confirmText}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            ) : null}
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING['2xl'],
        backgroundColor: alpha(TOKENS.shadow, 0.45),
    },
    dialog: {
        width: '100%',
        maxWidth: 340,
        padding: SPACING['2xl'],
        borderRadius: RADIUS.xl,
        backgroundColor: TOKENS.surface,
    },
    title: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '600',
        color: TOKENS.text,
    },
    message: {
        marginTop: SPACING.sm,
        fontSize: 15,
        lineHeight: 21,
        color: TOKENS.textMuted,
    },
    buttons: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING['2xl'],
    },
    button: {
        flex: 1,
        minHeight: 48,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.8,
    },
    cancel: {
        borderWidth: 1,
        borderColor: TOKENS.hairlineStrong,
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.text,
    },
    primary: {
        backgroundColor: TOKENS.primary,
    },
    destructive: {
        backgroundColor: TOKENS.danger,
    },
    confirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.surface,
        textAlign: 'center',
    },
});
