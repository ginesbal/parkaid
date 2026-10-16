import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandLoader from '../../../../components/BrandLoader';
import { getDistanceLabel } from '../../../../utils/parkingHelpers';
import { styles } from './styles';

/**
 * LoadingState - first load of Home: the pin hops while we find the driver,
 * then the spots around them.
 */
const LoadingState = ({ searchRadius, phase = 'spots' }) => (
    <SafeAreaView style={styles.fullScreenBg} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
            {phase === 'location' ? (
                <BrandLoader size={96} label="Finding where you are" />
            ) : (
                <BrandLoader
                    size={96}
                    label="Looking for spots nearby"
                    sublabel={`Checking within ${getDistanceLabel(searchRadius)} of you`}
                />
            )}
        </View>
    </SafeAreaView>
);

export default LoadingState;
