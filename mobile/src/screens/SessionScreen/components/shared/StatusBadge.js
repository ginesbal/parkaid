import { Text, View } from 'react-native';
import { styles } from './styles';

const STATUS = {
    active: { text: 'Running', dot: null, label: null },
    expiring: { text: 'Ends soon', dot: styles.statusDotWarning, label: styles.statusTextWarning },
    expired: { text: "Time's up", dot: styles.statusDotDanger, label: styles.statusTextDanger },
};

/**
 * StatusBadge — dot + word for the timer's state.
 * @param {string} state - 'active', 'expiring', or 'expired'
 */
export default function StatusBadge({ state }) {
    const status = STATUS[state] || STATUS.active;

    return (
        <View style={styles.statusBadge}>
            <View style={[styles.statusDot, status.dot]} />
            <Text style={[styles.statusText, status.label]}>{status.text}</Text>
        </View>
    );
}
