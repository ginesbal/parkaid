import { StyleSheet } from 'react-native';
import { TOKENS } from '../../../../constants/theme';

export const styles = StyleSheet.create({
    mapFab: {
        position: 'absolute',
        bottom: 24,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: TOKENS.primary,
        justifyContent: 'center',
    },
    mapFabPressed: {
        opacity: 0.6,
    },
    mapFabLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.onPrimary,
    },
});
