import React from 'react'
import { View, ActivityIndicator, StatusBar } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import { verify } from '../networking/service'

export default class AuthLoadingScreen extends React.Component {
    constructor(props) {
        super(props)
        this._loadData()
    }

    // Fetch the token from storage then navigate to our appropriate place
    async _loadData() {
        const { navigation } = this.props

        const userToken = await AsyncStorage.getItem('userToken')
        const userInfo = await AsyncStorage.getItem('userInfo')
        // This will switch to the App screen or Auth screen and this loading
        // screen will be unmounted and thrown away.
        if (userToken) {
            this.verifyToken(userToken, userInfo)
            return
        }

        navigation.navigate('Auth')
        // if (userToken) {
        //     navigation.navigate('Home', {
        //         email: JSON.parse(userInfo).email,
        //     })
        // } else {
        //     navigation.navigate('Auth')
        // }
    }

    verifyToken(userToken, userInfo) {
        const { navigation } = this.props

        verify()
            .then((responseJson) => {
                // console.log(responseJson.token);
                if (responseJson.code === 0) {
                    if (userInfo !== JSON.stringify(responseJson.user)) {
                        AsyncStorage.setItem('userInfo', JSON.stringify(responseJson.user))
                    }

                    navigation.navigate('Home', {
                        email: JSON.parse(userInfo).email,
                    })
                    // userInfo = AsyncStorage.getItem('userInfo')
                } else {
                    AsyncStorage.clear()
                    navigation.navigate('Auth')
                }
            })
            .catch((error) => {
                AsyncStorage.clear()
                navigation.navigate('Auth')
            })
    }

    // Render any loading content that you like here
    render() {
        return (
            <View>
                <ActivityIndicator />
                <StatusBar barStyle="default" />
            </View>
        )
    }
}
