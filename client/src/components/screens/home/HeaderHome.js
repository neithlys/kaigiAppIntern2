import React from 'react'
import { Image, View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Header, Left, Right, Body, Content } from 'native-base'
import { connect } from 'react-redux'
import IconStyles from '../../Icon/IconStyles'
import * as actions from '../../../redux/actions/index'
import AppText from '../../CustomText'

const en = require('../../../assets/Icon/en.png')
const vi = require('../../../assets/Icon/vi.png')
const jp = require('../../../assets/Icon/jp.png')

// const styles = StyleSheet.create({
//     titleView: {
//         flex: 1,
//         margin: 10,
//     },
//     title: {
//         fontSize: 30,
//         fontWeight: 'bold',
//         textAlign: 'center',
//     },
//     contentView: {
//         flex: 1,
//         margin: 10,
//         alignItems: 'center',
//     },
//     content: {
//         fontSize: 20,
//         textAlign: 'justify',
//     },
//     btnView: {
//         flex: 1,
//     },
//     btnContent: {
//         fontSize: 20,
//         textAlign: 'center',
//     },
//     logout: {
//         padding: 10,
//         margin: 5,
//         height: 25,
//         width: 25,
//         resizeMode: 'stretch',
//     },
// })

class HeaderHome extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            // isVisible: false,
        }
    }

    setLanguage(language) {
        // this.setState({ language })
        const { setLanguage } = this.props
        setLanguage(language)
    }

    render() {
        return (
            <View>
                <Header style={{ backgroundColor: '#1175b5' }}>
                    <Left style={{ flex: 1 }}>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                            <AppText i18nKey="headerHome" />
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
                <Content />
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
)(HeaderHome)
