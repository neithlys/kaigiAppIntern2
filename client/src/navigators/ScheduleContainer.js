import ScheduleScreen from '../components/screens/schedule/ScheduleScreen';
import {createStackNavigator} from 'react-navigation-stack';

const ScheduleStackNavigator = createStackNavigator({
    Schedule: ScheduleScreen,
    SubjectList,
});

export default ScheduleStackNavigator;
