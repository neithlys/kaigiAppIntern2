import { createAppContainer } from 'react-navigation'
import { createBottomTabNavigator } from 'react-navigation-tabs'
import { createStackNavigator } from 'react-navigation-stack'
import Ionicons from 'react-native-vector-icons/Ionicons'
import React from 'react'

import SettingScreen from '../components/screens/setting/SettingScreen'
import HomeScreen from '../components/screens/home/HomeScreen'
import SubjectListScreen from '../components/screens/subject/SubjectListScreen'
import ScheduleScreen from '../components/screens/schedule/ScheduleScreen'
import NewScheduleScreen from '../components/screens/schedule/NewScheduleScreen'
import DetailScreen from '../components/screens/detail/DetailScreen'
import PreferencesScreen from '../components/screens/setting/Preferences'
import UpdateFacility from '../components/screens/setting/facility/UpdateFacility'
import DetailFacility from '../components/screens/setting/facility/DetailFacility'
import SemesterScreen from '../components/screens/schedule/SemesterScreen'

const ScheduleStackNavigator = createStackNavigator(
    {
        Schedule: ScheduleScreen,
        SubjectList: SubjectListScreen,
        NewSchedule: NewScheduleScreen,
        Semester: SemesterScreen,
    },
    {
        headerMode: 'none',
    },
)

const CalendarStackNavigator = createStackNavigator(
    {
        Detail: DetailScreen,
        NewDetail: DetailScreen,
    },
    {
        headerMode: 'none',
    },
)

const HomeStackNavigator = createStackNavigator(
    {
        Home: HomeScreen,
        Calendar: CalendarStackNavigator,
        Schedule: ScheduleStackNavigator,
    },
    {
        headerMode: 'none',
    },
)

const SettingStackNavigator = createStackNavigator(
    {
        Setting: SettingScreen,
        Preferences: PreferencesScreen,
        Update: UpdateFacility,
        Insert: DetailFacility,
    },
    {
        headerMode: 'none',
    },
)

export default AppTabContainer = createBottomTabNavigator(
    {
        Home: HomeStackNavigator,
        Settings: SettingStackNavigator,
    },
    {
        defaultNavigationOptions: ({ navigation }) => ({
            tabBarIcon: ({ tintColor }) => {
                const { routeName } = navigation.state
                const IconComponent = Ionicons
                let iconName
                if (routeName === 'Home') {
                    iconName = `ios-home`
                    // Sometimes we want to add badges to some icons.
                    // You can check the implementation below.
                    // IconComponent = HomeIconWithBadge;
                } else if (routeName === 'Settings') {
                    iconName = `ios-options`
                }
                // You can return any component that you like here!
                return <IconComponent name={iconName} size={25} color={tintColor} />
            },
        }),
        tabBarOptions: {
            activeTintColor: 'tomato',
            inactiveTintColor: 'gray',
        },
    },
)
