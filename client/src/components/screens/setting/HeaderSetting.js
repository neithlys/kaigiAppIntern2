import React from 'react'
import { Text, TouchableOpacity, Image } from 'react-native'
import { Header, Left, Right, Body } from 'native-base'
import { connect } from 'react-redux'
import * as actions from '../../../redux/actions/index'
import AppText from '../../CustomText'
import IconStyles from '../../Icon/IconStyles'

const en = require('../../../assets/Icon/en.png')
const vi = require('../../../assets/Icon/vi.png')
const jp = require('../../../assets/Icon/jp.png')

class HeaderSetting extends React.Component {
    setLanguage(language) {
        const { setLanguage } = this.props

        // this.setState({ language })
        setLanguage(language)
    }

    render() {
        const { headerName } = this.props
        return (
            <Header style={{ backgroundColor: '#1175b5' }}>
                <Left style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                        <AppText i18nKey={headerName} />
                    </Text>
                </Left>
                <Body />
                <Right>
                    <TouchableOpacity onPress={() => this.setLanguage('en')}>
                        <Image source={en} style={IconStyles.logout} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => this.setLanguage('vi')}>
                        <Image source={vi} style={IconStyles.logout} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => this.setLanguage('jp')}>
                        <Image source={jp} style={IconStyles.logout} />
                    </TouchableOpacity>
                </Right>
            </Header>
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
)(HeaderSetting)
