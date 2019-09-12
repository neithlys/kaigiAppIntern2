import React from 'react'
import { Text, Image, TouchableOpacity } from 'react-native'
import { Header, Button, Left, Right, Body, Icon } from 'native-base'
import { connect } from 'react-redux'
import * as actions from '../../../redux/actions/index'
import AppText from '../../CustomText'
import IconStyles from '../../Icon/IconStyles'

class HeaderDetail extends React.Component {
    constructor(props) {
        super(props)
    }

    setLanguage = (language) => {
        this.setState({ language })
        this.props.setLanguage(language)
    }

    _goBack = () => {
        // this.props.navigation.navigate('Home', {
        //     email: this.props.email,
        // })
        const { navigation } = this.props
        navigation.navigate('Home')
    }

    render() {
        return (
            <Header style={{ backgroundColor: '#1175b5' }}>
                <Left style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <Button transparent onPress={() => this._goBack()}>
                        <Icon name="arrow-back" style={{ color: 'white' }} />
                    </Button>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                        <AppText i18nKey="detail" />
                    </Text>
                </Left>
                <Body />
                <Right>
                    <TouchableOpacity onPress={() => this.setLanguage('en')}>
                        <Image source={require('../../../assets/Icon/en.png')} style={IconStyles.logout} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => this.setLanguage('vi')}>
                        <Image source={require('../../../assets/Icon/vi.png')} style={IconStyles.logout} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => this.setLanguage('jp')}>
                        <Image source={require('../../../assets/Icon/jp.png')} style={IconStyles.logout} />
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
)(HeaderDetail)
