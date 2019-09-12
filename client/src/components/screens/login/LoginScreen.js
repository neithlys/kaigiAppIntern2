import React from 'react'
import { View, KeyboardAvoidingView } from 'react-native'
import Snackbar from 'react-native-snackbar'
import { Container, Content, Button, Text } from 'native-base'
import { CheckBox } from 'react-native-elements'
import loginStyle from './LoginStyles'
import HeaderLogin from './HeaderLogin'
var FloatingLabel = require('react-native-floating-labels')
import AsyncStorage from '@react-native-community/async-storage'
import { connect } from 'react-redux'
import AppText from '../../CustomText'
import * as actions from '../../../redux/actions/index'
import { login } from '../../../networking/service'
class LoginScreen extends React.PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            username: '',
            password: '',
            check: false,
        }
    }

    componentWillMount = async () => {
        const email = await AsyncStorage.getItem('email')
        const password = await AsyncStorage.getItem('password')
        const check = await AsyncStorage.getItem('check')
        if (check === 'true') this.setState({ username: email, password: password, check: true })
        else this.setState({ check: false })
    }

    _onSubmit = () => {
        login(this.state.username, this.state.password).then((responseJson) => {
            //console.log(responseJson.data)
            if (responseJson.code === 0) {
                AsyncStorage.setItem('userToken', responseJson.token)
                AsyncStorage.setItem('email', this.state.username)
                AsyncStorage.setItem('password', this.state.password)
                AsyncStorage.setItem('userInfo', JSON.stringify(responseJson.user))
                this.props.navigation.navigate('Home', {
                    email: responseJson.user.email,
                })
            } else {
                Snackbar.show({
                    title: 'Incorrect email or password',
                    backgroundColor: 'red',
                    duration: Snackbar.SHORT_INDEFINITE,
                    action: {
                        title: 'OK',
                        color: 'white',
                    },
                })
            }
        })
    }

    _handleAcc = () => {
        this.setState({ check: !this.state.check })
        AsyncStorage.setItem('check', JSON.stringify(!this.state.check))
        // this.props.setAcc(this.state.username, this.state.password, !this.state.check);
    }

    render() {
        return (
            <KeyboardAvoidingView
                style={{
                    flex: 1,
                }}>
                <Container>
                    <HeaderLogin />
                    <Content>
                        <Container style={loginStyle.container}>
                            <View style={loginStyle.subContainer1} />
                            <View style={loginStyle.subContainer2}>
                                <FloatingLabel
                                    labelStyle={loginStyle.labelInput}
                                    inputStyle={loginStyle.input}
                                    style={loginStyle.formInput}
                                    onChangeText={(username) => this.setState({ username })}
                                    value={this.state.username}>
                                    <AppText i18nKey={'email'} />
                                </FloatingLabel>
                                <FloatingLabel
                                    labelStyle={loginStyle.labelInput}
                                    inputStyle={loginStyle.input}
                                    style={loginStyle.formInput}
                                    onChangeText={(password) => this.setState({ password })}
                                    secureTextEntry={true}
                                    value={this.state.password}>
                                    <AppText i18nKey={'password'} />
                                </FloatingLabel>
                                <Button block info onPress={this._onSubmit} style={loginStyle.btnSubmit}>
                                    <Text style={loginStyle.btnContent}>
                                        <AppText i18nKey={'Login'} />
                                    </Text>
                                </Button>
                                {/* <CheckBox
                                title="Remember your account"
                                checked={this.state.check}
                                onPress={this._handleAcc}
                                iconRight
                                center
                                containerStyle={loginStyle.checkbox}
                                activeOpacity={1}
                            /> */}
                            </View>
                        </Container>
                    </Content>
                </Container>
            </KeyboardAvoidingView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        language: state.languageReducer.language,
        email: state.languageReducer.email,
        pass: state.languageReducer.pass,
        check: state.languageReducer.check,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        setAcc: (email, pass, check) => {
            dispatch(actions.rememberAcc(email, pass, check))
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(LoginScreen)
