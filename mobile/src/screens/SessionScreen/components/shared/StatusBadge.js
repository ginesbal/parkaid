import { Text, View } from 'react-native';
import { styles } from './styles';

/**
 * StatusBadge - Visual indicator for session state
 * @param {string} state - 'active', 'expiring', or 'expired'
 */
export default function StatusBadge({ state }) {
    const getStatusText = () => {
        switch (state) {
            case 'expired':
                return 'Expired';
            case 'expiring':
                return 'Ends soon';
            default:
                return 'Active';
        }
    };

    const getStyleModifiers = () => {
        const badgeStyles = [styles.statusBadge];
        const dotStyles = [styles.statusDot];
        const textStyles = [styles.statusText];

        if (state === 'expiring') {
            badgeStyles.push(styles.statusBadgeWarning);
            dotStyles.push(styles.statusDotWarning);
            textStyles.push(styles.statusTextWarning);
        } else if (state === 'expired') {
            badgeStyles.push(styles.statusBadgeDanger);
            dotStyles.push(styles.statusDotDanger);
            textStyles.push(styles.statusTextDanger);
        }

        return { badgeStyles, dotStyles, textStyles };
    };

    const { badgeStyles, dotStyles, textStyles } = getStyleModifiers();

    return (
        <View style={badgeStyles}>
            <View style={dotStyles} />
            <Text style={textStyles}>{getStatusText()}</Text>
        </View>
    );
}
