import { createAppContainer, createSwitchNavigator } from 'react-navigation'

import AuthLoadingScreen from '../components/Auth'
import LoginScreen from '../components/screens/login/LoginScreen'
import AppTabContainer from './TabContainer'

export default createAppContainer(
    createSwitchNavigator(
        {
            AuthLoading: AuthLoadingScreen,
            App: AppTabContainer,
            Auth: LoginScreen,
        },
        {
            initialRouteName: 'AuthLoading',
        },
    ),
)
