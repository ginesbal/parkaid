import { Animated } from 'react-native';
import ParkingListItem from '../../../../components/ParkingList/ParkingListItem';

/**
 * ParkingList - Container for parking spot list items
 */
const ParkingList = {
    Item: ({ spot, onPress, fadeAnim, slideAnim }) => (
        <Animated.View 
            style={{ 
                opacity: fadeAnim, 
                transform: [{ translateY: slideAnim }] 
            }}
        >
            <ParkingListItem
                spot={spot}
                price={spot.price}
                onPress={onPress}
                showActions={false}
            />
        </Animated.View>
    )
};

export default ParkingList;