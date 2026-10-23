import { StyleSheet } from 'react-native';
import { TOKENS } from '../../constants/theme';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: TOKENS.bg,
    },
    content: {
        flex: 1,
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
    // Matches "7 more nearby" above the list (Header styles.moreLabel).
    listHeading: {
        paddingHorizontal: 20,
        marginTop: 24,
        marginBottom: 8,
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.textMuted,
    },
});