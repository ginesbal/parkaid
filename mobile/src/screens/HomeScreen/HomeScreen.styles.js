import { StyleSheet } from 'react-native';
import { TOKENS } from '../../constants/theme';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: TOKENS.bg,
    },
    emptyList: {
        flexGrow: 1
    },
    // Shown in place of the list while a filter change refetches.
    updating: {
        paddingVertical: 48,
        alignItems: 'center',
    },
    footer: {
        height: 24,
    },
});