import { StyleSheet } from 'react-native';
import { TOKENS } from '../../constants/theme';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: TOKENS.bg,
    },
    loading: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
