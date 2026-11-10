import { StyleSheet } from 'react-native';
import { TOKENS } from '../../constants/theme';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: TOKENS.bg,
    },
    ink: {
        backgroundColor: TOKENS.inkSurface,
    },
    loading: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
