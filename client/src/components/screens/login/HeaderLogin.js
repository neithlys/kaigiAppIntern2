import React from 'react'
import { View, Text } from 'react-native'
import { connect } from 'react-redux'
import * as actions from '../../../redux/actions/index'
import AppText from '../../CustomText'
class HeaderLogin extends React.Component {
    render() {
        return (
            <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#1175b5', height: 50 }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                    <AppText i18nKey={'Login'} />
                </Text>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        language: state.languageReducer.language,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        setLanguage: (language) => {
            dispatch(actions.changeLanguage(language))
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(HeaderLogin)
