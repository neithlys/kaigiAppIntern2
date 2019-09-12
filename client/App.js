import React from 'react'
import { YellowBox } from 'react-native'
import { Provider } from 'react-redux'
import AppContainer from './src/navigators/AppContainer'
import store from './src/redux/store/index'

export default class App extends React.Component {
    constructor(props) {
        super(props)
        YellowBox.ignoreWarnings(['Warning: isMounted(...) is deprecated', 'Module RCTImageLoader'])
    }

    render() {
        return (
            <Provider store={store}>
                <AppContainer>
                    ref=
                    {(nav) => {
                        this.navigator = nav
                    }}
                </AppContainer>
            </Provider>
        )
    }
}
