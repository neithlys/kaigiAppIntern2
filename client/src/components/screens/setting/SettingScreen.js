import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Button } from 'react-native'
import { connect } from 'react-redux'
import ReactNativeSettingsPage, { SectionRow, NavigateRow } from 'react-native-settings-page'
import AsyncStorage from '@react-native-community/async-storage'
import Modal from 'react-native-modal'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'
import AppText from '../../CustomText'
import * as actions from '../../../redux/actions/index'
import HeaderSetting from './HeaderSetting'
import { RFValue } from 'react-native-responsive-fontsize'
import ColorPicker from '../../ColorPick'
import moment from 'moment-timezone'
import { updateSetting } from '../../../networking/service'

// import Notify from '../../common/Notify'

const styles = StyleSheet.create({
    titleView: {
        flex: 1,
        margin: 10,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    contentView: {
        flex: 1,
        margin: 10,
        alignItems: 'center',
    },
    content: {
        fontSize: 20,
        textAlign: 'justify',
    },
    btnView: {
        flex: 1,
    },
    btnContent: {
        fontSize: 20,
        textAlign: 'center',
    },
    logout: {
        padding: 10,
        margin: 5,
        height: 25,
        width: 25,
        resizeMode: 'stretch',
    },
})

class SettingScreen extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isVisible: false,
            permitCode: '',
        }

        this._moveScreen1 = this._moveScreen1.bind(this)
        this._moveScreen2 = this._moveScreen2.bind(this)
        this._moveScreen3 = this._moveScreen3.bind(this)
        this._moveScreen4 = this._moveScreen4.bind(this)
        this._moveScreen5 = this._moveScreen5.bind(this)
        this._moveScreen6 = this._moveScreen6.bind(this)
        this._moveScreen7 = this._moveScreen7.bind(this)
        this._showAlert = this._showAlert.bind(this)
        this._signOutAsync = this._signOutAsync.bind(this)
        this._changeColor = this._changeColor.bind(this)
    }

    // getUserInfo = () => {
    //   return new Promise((resolve, reject)=> {
    //     AsyncStorage.getItem('userInfo')
    //     .then((value)=>{
    //       userInfo = value;
    //       var userInfo = JSON.parse(value);
    //       this.state.permitCode = userInfo.permission_code
    //       resolve();
    //     }).catch((error) => {
    //       reject(error);
    //     });
    //   })
    // }

    componentDidMount() {
        AsyncStorage.getItem('userInfo').then((value) => {
            const userInfo = JSON.parse(value)
            this.setState({ permitCode: userInfo.permission_code })
        })
    }

    _moveScreen1() {
        const { navigation } = this.props
        navigation.navigate('Preferences', {
            title: 'User',
        })
    }

    _moveScreen2() {
        const { navigation } = this.props

        navigation.navigate('Preferences', {
            title: 'Facility',
        })
    }

    _moveScreen3() {
        const { navigation } = this.props

        navigation.navigate('Preferences', {
            title: 'category',
        })
    }

    _moveScreen4() {
        const { navigation } = this.props

        navigation.navigate('Preferences', {
            title: 'location',
        })
    }

    async _moveScreen5() {
        const { navigation } = this.props

        const user = await AsyncStorage.getItem('userInfo')
        navigation.navigate('Preferences', {
            title: 'MyProfile',
            user,
        })
    }

    _moveScreen6() {
        const { navigation } = this.props

        navigation.navigate('Preferences', {
            title: 'Information',
        })
    }

    _moveScreen7() {
        const { navigation } = this.props

        navigation.navigate('Preferences', {
            title: 'schedule',
        })
    }

    _moveScreen8(screen) {
        const { navigation } = this.props

        navigation.navigate('Preferences', {
            title: 'manual',
            screen,
        })
    }

    _showAlert() {
        const { isVisible } = this.state
        this.setState({ isVisible: !isVisible })
    }

    async _signOutAsync() {
        const { navigation } = this.props

        await AsyncStorage.clear()

        navigation.navigate('Auth')
    }

    _changeColor = async () => {
        const organization_id = JSON.parse(await AsyncStorage.getItem('userInfo')).organization_id
        const data = {
            defaultSetting: {
                renew: 3,
                facility: {
                    busy: {
                        color: this.refs.colorPickerFacility1.getColor(),
                    },
                    free: {
                        color: this.refs.colorPickerFacility2.getColor(),
                    },
                },
                background: '',
                event_type: null,
                driver_type: null,
                facility_type: null,
                event_color: {
                    self: 'yellow',
                    others: 'pink',
                    relevant: 'gray',
                    temporariness: 'red',
                },
            },
            generalSetting: {
                home_page: '',
                event_join: false,
                same_event: false,
                welcome_message: '',
                organization_timezone: moment().format('ZZ'),
                organization_timezone_name: '',
            },
        }
        updateSetting(data, organization_id).then((res) => {
            if (res.code === 0) {
                alert('success')
            } else alert('Failed')
        })
    }

    render() {
        const { permitCode, isVisible } = this.state
        return (
            <ReactNativeSettingsPage>
                <HeaderSetting headerName="headerSetting" />

                {/* <Notify
              titleNotify={<AppText i18nKey={'notify'}/>}
              contentNotify={<AppText i18nKey={'greeting'}/>}
              btnContent={<AppText i18nKey={'btnNotify'}/>}
            /> */}
                {permitCode !== '99' ? (
                    <View
                        style={{
                            flex: 1,
                        }}
                    >
                        <SectionRow text={<AppText i18nKey="Account" />}>
                            <NavigateRow
                                text={<AppText i18nKey="MyProfile" />}
                                iconName="user"
                                typeIcon="FontAwesome"
                                onPressCallback={this._moveScreen5}
                            />
                            <NavigateRow
                                text={<AppText i18nKey="logout" />}
                                iconName="sign-out"
                                typeIcon="FontAwesome"
                                onPressCallback={this._showAlert}
                            />
                        </SectionRow>

                        <SectionRow text={<AppText i18nKey="Manual" />}>
                            <NavigateRow
                                text={<AppText i18nKey="Schedule" />}
                                iconName="book"
                                typeIcon="FontAwesome"
                                onPressCallback={() => {
                                    this._moveScreen8(1)
                                }}
                            />
                            <NavigateRow
                                text={<AppText i18nKey="Calendar" />}
                                iconName="book"
                                typeIcon="FontAwesome"
                                onPressCallback={() => {
                                    this._moveScreen8(2)
                                }}
                            />
                            <NavigateRow
                                text={<AppText i18nKey="Setting" />}
                                iconName="book"
                                typeIcon="FontAwesome"
                                onPressCallback={() => {
                                    this._moveScreen8(3)
                                }}
                            />
                        </SectionRow>

                        <SectionRow text={<AppText i18nKey="About" />}>
                            <NavigateRow
                                text={<AppText i18nKey="Information" />}
                                iconName="info"
                                typeIcon="FontAwesome"
                                onPressCallback={this._moveScreen6}
                            />
                        </SectionRow>
                    </View>
                ) : (
                    <View
                        style={{
                            flex: 1,
                        }}
                    >
                        <SectionRow text={<AppText i18nKey="Settings" />}>
                            <NavigateRow
                                text={<AppText i18nKey="User" />}
                                iconName="users"
                                typeIcon="FontAwesome"
                                onPressCallback={this._moveScreen1}
                            />
                            <NavigateRow
                                text={<AppText i18nKey="Facility" />}
                                iconName="car"
                                typeIcon="FontAwesome"
                                onPressCallback={this._moveScreen2}
                            />
                            <NavigateRow
                                text={<AppText i18nKey="category" />}
                                iconName="sitemap"
                                typeIcon="FontAwesome"
                                onPressCallback={this._moveScreen3}
                            />
                            <NavigateRow
                                text={<AppText i18nKey="location" />}
                                iconName="map-marker"
                                typeIcon="FontAwesome"
                                onPressCallback={this._moveScreen4}
                            />
                            <NavigateRow
                                text={<AppText i18nKey="schedule" />}
                                iconName="history"
                                typeIcon="FontAwesome"
                                onPressCallback={this._moveScreen7}
                            />
                        </SectionRow>
                        <SectionRow text={<AppText i18nKey="Account" />}>
                            <NavigateRow
                                text={<AppText i18nKey="MyProfile" />}
                                iconName="user"
                                typeIcon="FontAwesome"
                                onPressCallback={this._moveScreen5}
                            />
                            <NavigateRow
                                text={<AppText i18nKey="logout" />}
                                iconName="sign-out"
                                typeIcon="FontAwesome"
                                onPressCallback={this._showAlert}
                            />
                        </SectionRow>
                        <SectionRow text={<AppText i18nKey="About" />}>
                            <NavigateRow
                                text={<AppText i18nKey="Information" />}
                                iconName="info"
                                typeIcon="FontAwesome"
                                onPressCallback={this._moveScreen6}
                            />
                        </SectionRow>
                        <SectionRow>
                            <View style={{ padding: 15, height: hp('30%'), width: wp('100%'), flexDirection: 'row' }}>
                                <View style={{ flex: 1, justifyContent: 'center', margin: 5 }}>
                                    <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: RFValue(15) }}>
                                        Using
                                    </Text>
                                    <ColorPicker ref="colorPickerFacility1" />
                                </View>
                                <View style={{ flex: 1, justifyContent: 'center', margin: 5 }}>
                                    <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: RFValue(15) }}>
                                        AVAILABLE
                                    </Text>
                                    <ColorPicker ref="colorPickerFacility2" />
                                </View>
                            </View>
                            <Button title="Change Color" onPress={this._changeColor} />
                        </SectionRow>
                    </View>
                )}

                <Modal
                    isVisible={isVisible}
                    style={{ justifyContent: 'center', alignItems: 'center' }}
                    animationIn="swing"
                    animationOut="tada"
                >
                    <View
                        style={{
                            width: wp('70%'),
                            borderRadius: 10,
                            height: hp('30%'),
                            backgroundColor: 'white',
                        }}
                    >
                        <View style={styles.titleView}>
                            <Text style={styles.title}>
                                <AppText i18nKey="logout" />
                            </Text>
                        </View>
                        <View style={styles.contentView}>
                            <Text style={styles.content}>
                                <AppText i18nKey="contentLogout" />?
                            </Text>
                        </View>
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <TouchableOpacity style={styles.btnView} onPress={this._showAlert}>
                                <Text style={styles.btnContent}>
                                    <AppText i18nKey="no" />
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnView} onPress={this._signOutAsync}>
                                <Text style={styles.btnContent}>
                                    <AppText i18nKey="yes" />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ReactNativeSettingsPage>
        )
    }
}

// const FloatStyle = StyleSheet.create({
//     input: {
//         height: 60,
//         paddingBottom: 5,
//         fontSize: 20,
//         borderWidth: 0,
//         borderBottomWidth: 1,
//         borderBottomColor: 'black',
//     },
//     labelInput: {
//         color: 'black',
//     },
//     formInput: {
//         marginBottom: 20,
//         width: '100%',
//         borderColor: 'black',
//     },
// })

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
)(SettingScreen)
