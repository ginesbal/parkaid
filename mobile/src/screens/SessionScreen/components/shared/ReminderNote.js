import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import { openNotificationSettings } from '../../../../services/timerReminders';
import { styles } from './styles';

/**
 * ReminderNote — shown when notifications are off: says what that costs,
 * with a way to fix it in Settings. Quiet, not an alarm.
 */
export default function ReminderNote({ text }) {
    return (
        <View style={styles.reminderNote}>
            <MaterialCommunityIcons name="bell-off-outline" size={18} color={TOKENS.textMuted} />
            <Text style={styles.reminderNoteText}>{text}</Text>
            <Pressable
                onPress={openNotificationSettings}
                hitSlop={12}
                style={({ pressed }) => pressed && styles.reminderNotePressed}
                accessibilityRole="button"
                accessibilityLabel="Turn on notifications in Settings"
            >
                <Text style={styles.reminderNoteAction}>Turn on</Text>
            </Pressable>
        </View>
    );
}
