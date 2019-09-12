import React from 'react'
import {
    View,
    Modal,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    RefreshControl,
    Image,
    ScrollView,
} from 'react-native'
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import HeaderApp from './HeaderApp'
import AsyncStorage from '@react-native-community/async-storage'
import FloatingLabel from 'react-native-floating-labels'
import {
    getUserAccount,
    getFacilityList,
    getCategoryList,
    getLocationList,
    updateCategory,
    updateUser,
    updateFacility,
    updateLocation,
    getProfile,
    updateProfile,
    getTimeRanges,
    deleteTimeRange,
} from '../../../networking/service'
import Icon from '../../Icon/Icons'
import Swipeout from 'react-native-swipeout'
import { SearchBar } from 'react-native-elements'
import ActionButton from 'react-native-action-button'
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize'
import AppText from '../../CustomText'
import * as common from '../../common/common'
import { SliderBox } from 'react-native-image-slider-box'
// import console = require("console");
export default class PreferencesScreen extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            keyword: '',
            isLoading: false,
            data: [],
            activeData: [],
            deletedRowKey: null,
            email: '',
            fname: '',
            lname: '',
            userId: '',
            newPass: '',
            confirmPass: '',
            icon: 'power-plug-off',
            isActive: true,
            activeTitle: 'Deactivated',
            setting: common.shortProfileSetting,
            colorModalVisible: false,
            imagesManual: [],
            sliderBoxHeight: 0,
        }
    }

    componentDidMount() {
        this._refreshDataFromServer()
    }

    _refreshDataFromServer = () => {
        const { navigation } = this.props
        const title = navigation.getParam('title', 'NO-TITLE') + ''
        if (title === 'MyProfile') {
            getProfile().then((res) => {
                this.setState({
                    fname: res.data.firstname,
                    lname: res.data.lastname,
                    email: res.data.email,
                    userId: res.data.user_id,
                    setting: res.setting || common.shortProfileSetting,
                })
            })
        }
        this.setState({
            isLoading: !this.state.isLoading,
            isActive: true,
            activeTitle: 'Deactivated',
            icon: 'power-plug-off',
        })
        if (title === 'User') {
            getUserAccount().then((result) => {
                this.setState({
                    isLoading: !this.state.isLoading,
                    data: result.data,
                    activeData: result.data.filter((res) => {
                        return res.activation === 1
                    }),
                })
            })
        } else if (title === 'Facility') {
            getFacilityList().then((result) => {
                this.setState({
                    isLoading: !this.state.isLoading,
                    data: result.data,
                    activeData: result.data.filter((res) => {
                        return res.facility_activation === 1
                    }),
                })
            })
        } else if (title === 'category') {
            getCategoryList().then((result) => {
                this.setState({
                    isLoading: !this.state.isLoading,
                    data: result.data,
                    activeData: result.data.filter((res) => {
                        return res.activation === 1
                    }),
                })
            })
        } else if (title === 'location') {
            getLocationList().then((result) => {
                if (result.code === 0) {
                    this.setState({
                        isLoading: !this.state.isLoading,
                        data: result.data,
                        activeData: result.data.filter((res) => {
                            return res.activation === 1
                        }),
                    })
                } else {
                    alert('Failed')
                }
            })
        } else if (title === 'schedule') {
            getTimeRanges(true, true).then((result) => {
                if (result.code === 0) {
                    this.setState({
                        isLoading: !this.state.isLoading,
                        data: result.data,
                        activeData: result.data.filter((res) => {
                            return res.time_range_activation === true
                        }),
                    })
                }
            })
        } else if (title === 'manual') {
        }
    }

    _isActive = () => {
        const { navigation } = this.props
        const title = navigation.getParam('title', 'NO-TITLE') + ''
        this.setState({ isLoading: !this.state.isLoading })
        if (this.state.isActive === true) {
            if (title === 'User') {
                getUserAccount().then((result) => {
                    this.setState({
                        isLoading: !this.state.isLoading,
                        icon: 'power-plug',
                        isActive: !this.state.isActive,
                        activeTitle: 'Activated',
                        activeData: result.data.filter((res) => {
                            return res.activation === 0
                        }),
                    })
                })
            } else if (title === 'Facility') {
                getFacilityList().then((result) => {
                    this.setState({
                        isLoading: !this.state.isLoading,
                        icon: 'power-plug',
                        isActive: !this.state.isActive,
                        activeTitle: 'Activated',
                        activeData: result.data.filter((res) => {
                            return res.facility_activation === 0
                        }),
                    })
                })
            } else if (title === 'category') {
                getCategoryList().then((result) => {
                    this.setState({
                        isLoading: !this.state.isLoading,
                        icon: 'power-plug',
                        isActive: !this.state.isActive,
                        activeTitle: 'Activated',
                        activeData: result.data.filter((res) => {
                            return res.activation === 0
                        }),
                    })
                })
            } else if (title === 'location') {
                getLocationList().then((result) => {
                    if (result.code === 0) {
                        this.setState({
                            isLoading: !this.state.isLoading,
                            icon: 'power-plug',
                            isActive: !this.state.isActive,
                            activeTitle: 'Activated',
                            activeData: result.data.filter((res) => {
                                return res.activation === 0
                            }),
                        })
                    } else {
                        alert('Failed')
                    }
                })
            } else if (title === 'schedule') {
                getTimeRanges(false, true).then((result) => {
                    if (result.code === 0) {
                        this.setState({
                            isLoading: !this.state.isLoading,
                            icon: 'power-plug',
                            isActive: !this.state.isActive,
                            activeTitle: 'Activated',
                            activeData: result.data.filter((res) => {
                                return res.time_range_activation == false
                            }),
                        })
                    } else {
                        alert('Failed')
                    }
                })
            }
        } else {
            if (title === 'User') {
                getUserAccount().then((result) => {
                    this.setState({
                        isLoading: !this.state.isLoading,
                        icon: 'power-plug-off',
                        isActive: !this.state.isActive,
                        activeTitle: 'Deactivated',
                        activeData: result.data.filter((res) => {
                            return res.activation === 1
                        }),
                    })
                })
            } else if (title === 'Facility') {
                getFacilityList().then((result) => {
                    this.setState({
                        isLoading: !this.state.isLoading,
                        icon: 'power-plug-off',
                        isActive: !this.state.isActive,
                        activeTitle: 'Deactivated',
                        activeData: result.data.filter((res) => {
                            return res.facility_activation === 1
                        }),
                    })
                })
            } else if (title === 'category') {
                getCategoryList().then((result) => {
                    this.setState({
                        isLoading: !this.state.isLoading,
                        icon: 'power-plug-off',
                        isActive: !this.state.isActive,
                        activeTitle: 'Deactivated',
                        activeData: result.data.filter((res) => {
                            return res.activation === 1
                        }),
                    })
                })
            } else if (title === 'location') {
                getLocationList().then((result) => {
                    if (result.code === 0) {
                        this.setState({
                            isLoading: !this.state.isLoading,
                            icon: 'power-plug-off',
                            isActive: !this.state.isActive,
                            activeTitle: 'Deactivated',
                            activeData: result.data.filter((res) => {
                                return res.activation === 1
                            }),
                        })
                    } else {
                        alert('Failed')
                    }
                })
            } else if (title === 'schedule') {
                getTimeRanges(false, true).then((result) => {
                    if (result.code === 0) {
                        this.setState({
                            isLoading: !this.state.isLoading,
                            icon: 'power-plug-off',
                            isActive: !this.state.isActive,
                            activeTitle: 'Deactivated',
                            activeData: result.data.filter((res) => {
                                return res.time_range_activation === true
                            }),
                        })
                    } else {
                        alert('Failed')
                    }
                })
            }
        }
    }

    _onRefresh = () => {
        this._refreshDataFromServer()
    }

    upButtonHandler = () => {
        //OnCLick of Up button we scrolled the list to top
        this.ListView_Ref.scrollToOffset({ offset: 0, animated: true })
    }

    refreshFlatList = (deletedKey) => {
        this.setState((prevState) => {
            return {
                deletedRowKey: deletedKey,
            }
        })
    }

    _search = async (keyword, title) => {
        if (this.state.isActive === true) {
            if (title === 'User') {
                var res = await getUserAccount()
                res.data = res.data.filter(function(item) {
                    return item.activation === 1
                })
                var value = keyword
                if (value !== '') {
                    var resFilt = res.data.filter(function(item) {
                        const itemData = `${item.lastname.toUpperCase()} ${item.firstname.toUpperCase()} `
                        const textData = value.toUpperCase()
                        return itemData.indexOf(textData) > -1
                    })
                    res.data = resFilt
                    this.setState({ activeData: res.data })
                } else {
                    this.setState({ activeData: res.data })
                }
            } else if (title === 'Facility') {
                var res = await getFacilityList()
                res.data = res.data.filter(function(item) {
                    return item.facility_activation === 1
                })
                var value = keyword
                if (value !== '') {
                    var resFilt = res.data.filter(function(item) {
                        const itemData = `${item.facility_name.toUpperCase()} `
                        const textData = value.toUpperCase()
                        return itemData.indexOf(textData) > -1
                    })
                    res.data = resFilt
                    this.setState({ activeData: res.data })
                } else {
                    this.setState({ activeData: res.data })
                }
            } else if (title === 'category') {
                var res = await getCategoryList()
                res.data = res.data.filter(function(item) {
                    return item.activation === 1
                })
                var value = keyword
                if (value !== '') {
                    var resFilt = res.data.filter(function(item) {
                        const itemData = `${item.category_name.toUpperCase()} `
                        const textData = value.toUpperCase()
                        return itemData.indexOf(textData) > -1
                    })
                    res.data = resFilt
                    this.setState({ activeData: res.data })
                } else {
                    this.setState({ activeData: res.data })
                }
            } else if (title === 'location') {
                var res = await getLocationList()
                res.data = res.data.filter(function(item) {
                    return item.activation === 1
                })
                var value = keyword
                if (value !== '') {
                    var resFilt = res.data.filter(function(item) {
                        const itemData = `${item.location_name.toUpperCase()} `
                        const textData = value.toUpperCase()
                        return itemData.indexOf(textData) > -1
                    })
                    res.data = resFilt
                    this.setState({ activeData: res.data })
                } else {
                    this.setState({ activeData: res.data })
                }
            } else if (title === 'schedule') {
                var res = await getTimeRanges({}, true)
                res.data = res.data.filter(function(item) {
                    return item.time_range_activation === true
                })
                var value = keyword
                if (value !== '') {
                    var resFilt = res.data.filter(function(item) {
                        const itemData = `${item.time_range_name.toUpperCase()} `
                        const textData = value.toUpperCase()
                        return itemData.indexOf(textData) > -1
                    })
                    res.data = resFilt
                    this.setState({ activeData: res.data })
                } else {
                    this.setState({ activeData: res.data })
                }
            }
        } else {
            if (title === 'User') {
                var res = await getUserAccount()
                res.data = res.data.filter(function(item) {
                    return item.activation === 0
                })
                var value = keyword
                if (value !== '') {
                    var resFilt = res.data.filter(function(item) {
                        const itemData = `${item.lastname.toUpperCase()} ${item.firstname.toUpperCase()} `
                        const textData = value.toUpperCase()
                        return itemData.indexOf(textData) > -1
                    })
                    res.data = resFilt
                    this.setState({ activeData: res.data })
                } else {
                    this.setState({ activeData: res.data })
                }
            } else if (title === 'Facility') {
                var res = await getFacilityList()
                res.data = res.data.filter(function(item) {
                    return item.facility_activation === 0
                })
                var value = keyword
                if (value !== '') {
                    var resFilt = res.data.filter(function(item) {
                        const itemData = `${item.facility_name.toUpperCase()} `
                        const textData = value.toUpperCase()
                        return itemData.indexOf(textData) > -1
                    })
                    res.data = resFilt
                    this.setState({ activeData: res.data })
                } else {
                    this.setState({ activeData: res.data })
                }
            } else if (title === 'category') {
                var res = await getCategoryList()
                res.data = res.data.filter(function(item) {
                    return item.activation === 0
                })
                var value = keyword
                if (value !== '') {
                    var resFilt = res.data.filter(function(item) {
                        const itemData = `${item.category_name.toUpperCase()} `
                        const textData = value.toUpperCase()
                        return itemData.indexOf(textData) > -1
                    })
                    res.data = resFilt
                    this.setState({ activeData: res.data })
                } else {
                    this.setState({ activeData: res.data })
                }
            } else if (title === 'location') {
                var res = await getLocationList()
                res.data = res.data.filter(function(item) {
                    return item.activation === 0
                })
                var value = keyword
                if (value !== '') {
                    var resFilt = res.data.filter(function(item) {
                        const itemData = `${item.location_name.toUpperCase()} `
                        const textData = value.toUpperCase()
                        return itemData.indexOf(textData) > -1
                    })
                    res.data = resFilt
                    this.setState({ activeData: res.data })
                } else {
                    this.setState({ activeData: res.data })
                }
            } else if (title === 'schedule') {
                var res = await getTimeRanges({}, true)
                res.data = res.data.filter(function(item) {
                    return item.time_range_activation === false
                })
                var value = keyword
                if (value !== '') {
                    var resFilt = res.data.filter(function(item) {
                        const itemData = `${item.time_range_name.toUpperCase()} `
                        const textData = value.toUpperCase()
                        return itemData.indexOf(textData) > -1
                    })
                    res.data = resFilt
                    this.setState({ activeData: res.data })
                } else {
                    this.setState({ activeData: res.data })
                }
            }
        }
    }

    _moveToAdd = () => {
        const { navigation } = this.props
        const title = navigation.getParam('title', 'NO-TITLE') + ''
        navigation.navigate('Insert', {
            title: title,
        })
    }

    _signOutAsync = async () => {
        const { navigation } = this.props
        await AsyncStorage.removeItem('userToken')
        await AsyncStorage.removeItem('userInfo')
        navigation.navigate('Auth')
    }

    _isValid = () => {
        if (this.state.newPass === this.state.confirmPass) {
            var data = {
                user_id: this.state.userId,
                firstname: this.state.fname,
                lastname: this.state.lname,
                password: this.state.newPass,
            }
            updateProfile(data, this.state.setting).then((res) => {
                res.code == 0 ? alert('success') : alert('Failed')
            })
            this._signOutAsync()
        } else {
            alert('Failed to update Profile')
        }
    }

    render() {
        const { navigation } = this.props
        const { colorModalVisible, setting } = this.state
        const screen = navigation.state.params.screen
        const images =
            screen === 1
                ? common.imagesManualSchedule
                : screen === 2
                ? common.imagesManualCalendar
                : common.imagesManualSetting
        const event_color =
            setting.event_color || common.shortProfileSetting.event_color
        const title = navigation.getParam('title', 'NO-TITLE') + ''
        return (
            <View style={styles.container}>
                <HeaderApp
                    headerName={title}
                    navigation={this.props.navigation}
                />
                {title === 'User' ||
                title === 'Facility' ||
                title === 'category' ||
                title === 'location' ||
                title === 'schedule' ? (
                    <View style={{ flex: 1 }}>
                        <SearchBar
                            round
                            lightTheme
                            searchIcon={{ size: RFValue(24) }}
                            onChangeText={(keyword) => {
                                this.setState({ keyword })
                                this._search(keyword, title)
                            }}
                            onClear={(keyword) => {
                                this._search('', title)
                            }}
                            placeholder={this.state.keyword}
                            value={this.state.keyword}
                        />
                        <FlatList
                            data={this.state.activeData}
                            ref={(ref) => {
                                this.ListView_Ref = ref
                            }}
                            renderItem={({ item, index }) => {
                                return (
                                    <FlatListItem
                                        item={item}
                                        parentFlatList={this}
                                        data={this.state.activeData}
                                        isActive={this.state.isActive}
                                        index={index}
                                        title={title}
                                        navigation={navigation}
                                    />
                                )
                            }}
                            keyExtractor={(item) =>
                                title === 'User'
                                    ? item.user_id + ''
                                    : title === 'Facility'
                                    ? item.facility_id + ''
                                    : title === 'category'
                                    ? item.category_id + ''
                                    : title === 'location'
                                    ? item.location_id + ''
                                    : item.time_range_id + ''
                            }
                            // refreshing={this.state.isLoading}
                            refreshControl={
                                <RefreshControl
                                    refreshing={this.state.isLoading}
                                    onRefresh={this._onRefresh}
                                />
                            }
                        />
                        {/* <TouchableOpacity
              style={styles.isActiveBtn}
            >
              <Icon.MaterialCommunityIcons name={this.state.icon} style={{ fontSize: 20 }} />
            </TouchableOpacity> */}
                        <ActionButton buttonColor="rgba(231,76,60,1)">
                            <ActionButton.Item
                                buttonColor="brown"
                                title={this.state.activeTitle}
                                onPress={this._isActive}
                            >
                                <Icon.MaterialCommunityIcons
                                    name={this.state.icon}
                                    style={styles.actionButtonIcon}
                                />
                            </ActionButton.Item>
                            <ActionButton.Item
                                buttonColor="#3498db"
                                title="Add"
                                onPress={this._moveToAdd}
                            >
                                <Icon.Ionicons
                                    name="md-add"
                                    style={styles.actionButtonIcon}
                                />
                            </ActionButton.Item>
                        </ActionButton>
                    </View>
                ) : title === 'MyProfile' ? (
                    <View style={styles.container}>
                        <ScrollView>
                            <View style={styles.header}>
                                <Image
                                    style={styles.avatar}
                                    source={{
                                        uri:
                                            'https://bootdey.com/img/Content/avatar/avatar6.png',
                                    }}
                                />
                            </View>
                            <View style={styles.body}>
                                <View style={styles.bodyContent}>
                                    {/* <Text style={styles.name}>{user.firstname} {user.lastname}</Text> */}
                                    <FloatingLabel
                                        labelStyle={styles.labelInput}
                                        inputStyle={styles.input}
                                        style={styles.formInput}
                                        value={this.state.email}
                                        editable={false}
                                    >
                                        <AppText i18nKey={'email'} />
                                    </FloatingLabel>

                                    <FloatingLabel
                                        labelStyle={styles.labelInput}
                                        inputStyle={styles.input}
                                        style={styles.formInput}
                                        onChangeText={(fname) => {
                                            this.setState({ fname })
                                        }}
                                        value={this.state.fname}
                                    >
                                        <AppText i18nKey={'fname'} />
                                    </FloatingLabel>

                                    <FloatingLabel
                                        labelStyle={styles.labelInput}
                                        inputStyle={styles.input}
                                        style={styles.formInput}
                                        onChangeText={(lname) => {
                                            this.setState({ lname })
                                        }}
                                        value={this.state.lname}
                                    >
                                        <AppText i18nKey={'lname'} />
                                    </FloatingLabel>

                                    <FloatingLabel
                                        labelStyle={styles.labelInput}
                                        inputStyle={styles.input}
                                        style={styles.formInput}
                                        onChangeText={(newPass) => {
                                            this.setState({ newPass })
                                        }}
                                        value={this.state.newPass}
                                        secureTextEntry={true}
                                    >
                                        <AppText i18nKey={'password'} />
                                    </FloatingLabel>

                                    <FloatingLabel
                                        labelStyle={styles.labelInput}
                                        inputStyle={styles.input}
                                        style={styles.formInput}
                                        onChangeText={(confirmPass) => {
                                            this.setState({ confirmPass })
                                        }}
                                        value={this.state.confirmPass}
                                        secureTextEntry={true}
                                    >
                                        <AppText i18nKey={'confirmPass'} />
                                    </FloatingLabel>

                                    <View
                                        style={{
                                            width: '80%',
                                            marginBottom: 10,
                                            paddingLeft: 10,
                                        }}
                                    >
                                        <Text style={styles.labelInput}>
                                            Joined Events Color
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor:
                                                event_color.relevant,
                                            height: 70,
                                            width: '80%',
                                            borderRadius: 5,
                                            marginBottom: 15,
                                        }}
                                        onPress={() => {
                                            this.setState({
                                                colorModalVisible: true,
                                            })
                                        }}
                                    ></TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.buttonContainer}
                                        onPress={this._isValid}
                                    >
                                        <Text
                                            style={{
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: 20,
                                            }}
                                        >
                                            <AppText i18nKey={'Update'} />
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                        <Modal
                            visible={colorModalVisible}
                            transparent
                            animationType="slide"
                            onRequestClose={() => {
                                this.setState({ colorModalVisible: false })
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                    alignItems: 'center',
                                }}
                                onPress={() => {
                                    this.setState({ colorModalVisible: false })
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: 5,
                                        padding: 10,
                                        width: '75%',
                                        maxHeight: '75%',
                                    }}
                                >
                                    <FlatList
                                        ItemSeparatorComponent={() => {
                                            return (
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        height: 10,
                                                    }}
                                                />
                                            )
                                        }}
                                        data={common.colorsList}
                                        keyExtractor={(item) =>
                                            item.id.toString()
                                        }
                                        renderItem={({ item }) => {
                                            return (
                                                <TouchableOpacity
                                                    style={{
                                                        width: '100%',
                                                        flexDirection: 'column',
                                                        justifyContent:
                                                            'center',
                                                        alignItems: 'center',
                                                        backgroundColor:
                                                            item.value,
                                                        // borderWidth: 1,
                                                        // borderColor: event.event_color === item.value ? 'black' : 'white',
                                                        padding: 20,
                                                        borderRadius: 5,
                                                    }}
                                                    onPress={() => {
                                                        this.setState({
                                                            colorModalVisible: false,
                                                            setting: {
                                                                ...setting,
                                                                event_color: {
                                                                    ...event_color,
                                                                    relevant:
                                                                        item.value,
                                                                },
                                                            },
                                                        })
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontWeight: 'bold',
                                                            color: 'white',
                                                        }}
                                                    >
                                                        {item.value.toUpperCase()}
                                                    </Text>
                                                </TouchableOpacity>
                                            )
                                        }}
                                    />
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    </View>
                ) : title === 'Information' ? (
                    <View style={styles.container}>
                        <Text style={{ fontSize: 25, margin: 10 }}>
                            App Faas
                        </Text>
                        <Text style={{ fontSize: 20, margin: 10 }}>
                            Version: 0.1
                        </Text>
                    </View>
                ) : (
                    <View style={styles.container}>
                        <View
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            onLayout={({
                                nativeEvent: {
                                    layout: { x, y, width, height },
                                },
                            }) => {
                                this.setState({
                                    sliderBoxHeight: height,
                                    imagesManual: images,
                                })
                            }}
                        >
                            <SliderBox
                                images={this.state.imagesManual}
                                sliderBoxHeight={this.state.sliderBoxHeight}
                            />
                        </View>
                    </View>
                )}
            </View>
        )
    }
}

class FlatListItem extends React.PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            activeRowKey: null,
        }
    }

    _moveToUpdate = () => {
        this.props.navigation.navigate('Update', {
            title: this.props.title,
            item: this.props.item,
        })
    }

    render() {
        var isActive =
            this.props.isActive === true ? 'Deactivated' : 'Activated'
        var type = isActive === 'Deactivated' ? 'delete' : 'primary'
        const swipeSetting = {
            autoClose: true,
            onClose: (secID, rowID, direction) => {
                if (this.state.activeRowKey !== null) {
                    this.setState({ activeRowKey: null })
                }
            },
            onOpen: (secID, rowID, direction) => {
                this.setState({ activeRowKey: this.props.item.user_id })
            },
            right: [
                {
                    onPress: () => {
                        const deletingRow = this.state.activeRowKey
                        this.props.data.splice(this.props.index, 1)
                        this.props.parentFlatList.refreshFlatList(deletingRow)
                        if (this.props.title === 'category') {
                            const data = {
                                category_id: this.props.item.category_id,
                                activation:
                                    this.props.item.activation === 0 ? 1 : 0,
                            }
                            updateCategory(data)
                        } else if (this.props.title === 'User') {
                            const data = {
                                user_id: this.props.item.user_id,
                                activation:
                                    this.props.item.activation === 0 ? 1 : 0,
                            }
                            updateUser(data)
                        } else if (this.props.title === 'Facility') {
                            const data = {
                                facility_id: this.props.item.facility_id,
                                facility_activation:
                                    this.props.item.facility_activation === 1
                                        ? 0
                                        : 1,
                            }
                            updateFacility(data)
                        } else if (this.props.title === 'location') {
                            const data = {
                                location_id: this.props.item.location_id,
                                activation:
                                    this.props.item.activation === 0 ? 1 : 0,
                            }
                            updateLocation(data)
                        } else if (this.props.title === 'schedule') {
                            const data = {
                                time_range_id: this.props.item.time_range_id,
                                time_range_activation:
                                    this.props.item.time_range_activation ===
                                    false
                                        ? true
                                        : false,
                            }
                            //
                            deleteTimeRange(data)
                        }
                    },
                    text: isActive,
                    type: type,
                },
            ],
            rowID: this.props.index,
            secID: 1,
        }
        return (
            <Swipeout
                {...swipeSetting}
                style={{ backgroundColor: 'white', borderRadius: 20 }}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        height: hp('10%'),
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: 'white',
                        backgroundColor: '#d3d3d3',
                    }}
                    onPress={this._moveToUpdate}
                >
                    {this.props.title === 'User' ? (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Icon.Ionicons
                                name="md-person"
                                style={{
                                    flex: 0.2,
                                    color: 'grey',
                                    fontSize: RFPercentage(10),
                                    marginLeft: 15,
                                }}
                            />
                            <View style={{ flex: 0.8 }}>
                                <Text
                                    style={{
                                        fontSize: RFValue(15),
                                        color: 'black',
                                    }}
                                >
                                    Firstname: {this.props.item.firstname}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: RFValue(15),
                                        color: 'black',
                                    }}
                                >
                                    Lastname: {this.props.item.lastname}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: RFValue(15),
                                        color: 'black',
                                    }}
                                >
                                    Permission Name:{' '}
                                    {this.props.item.permission_name_code ===
                                    'permission_name_driver'
                                        ? 'Driver'
                                        : this.props.item
                                              .permission_name_code ===
                                          'permission_name_user'
                                        ? 'User'
                                        : 'Admin'}
                                </Text>
                            </View>
                        </View>
                    ) : this.props.title === 'Facility' ? (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Icon.Ionicons
                                name="ios-build"
                                style={{
                                    flex: 0.2,
                                    color: 'grey',
                                    fontSize: RFPercentage(10),
                                    marginLeft: 15,
                                }}
                            />
                            <View style={{ flex: 0.8 }}>
                                <Text
                                    style={{
                                        fontSize: RFValue(15),
                                        color: 'black',
                                    }}
                                >
                                    Facility Name:{' '}
                                    {this.props.item.facility_name}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: RFValue(15),
                                        color: 'black',
                                    }}
                                >
                                    Capacity:{' '}
                                    {this.props.item.facility_capacity}
                                </Text>
                            </View>
                        </View>
                    ) : this.props.title === 'category' ? (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Icon.Ionicons
                                name="md-apps"
                                style={{
                                    flex: 0.2,
                                    color: 'grey',
                                    fontSize: RFPercentage(10),
                                    marginLeft: 15,
                                }}
                            />
                            <View style={{ flex: 0.8 }}>
                                <Text
                                    style={{
                                        fontSize: RFValue(15),
                                        color: 'black',
                                    }}
                                >
                                    Category Name:{' '}
                                    {this.props.item.category_name}
                                </Text>
                            </View>
                        </View>
                    ) : this.props.title === 'location' ? (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Icon.MaterialIcons
                                name="location-on"
                                style={{
                                    flex: 0.2,
                                    color: 'grey',
                                    fontSize: RFPercentage(10),
                                    marginLeft: 15,
                                }}
                            />
                            <View style={{ flex: 0.8 }}>
                                <Text
                                    style={{
                                        fontSize: RFValue(15),
                                        color: 'black',
                                    }}
                                >
                                    Location Name:{' '}
                                    {this.props.item.location_name}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Icon.SimpleLineIcons
                                name="clock"
                                style={{
                                    flex: 0.2,
                                    color: 'grey',
                                    fontSize: RFPercentage(8),
                                    marginLeft: 15,
                                }}
                            />
                            <View style={{ flex: 0.8 }}>
                                <Text
                                    style={{
                                        fontSize: RFValue(15),
                                        color: 'black',
                                    }}
                                >
                                    Period Name:{' '}
                                    {this.props.item.time_range_name}
                                </Text>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </Swipeout>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    input: {
        height: 60,
        paddingBottom: 10,
        fontSize: RFValue(20),
        borderWidth: 0,
        borderBottomWidth: 1.5,
        borderBottomColor: 'black',
    },
    labelInput: {
        color: 'grey',
    },
    formInput: {
        marginBottom: 20,
        width: wp('80%'),
        borderColor: 'black',
    },

    header: {
        backgroundColor: '#00BFFF',
        height: hp('20%'),
        marginBottom: hp('10%'),
    },
    avatar: {
        width: wp('30%'),
        height: hp('20%'),
        borderRadius: 100,
        borderWidth: 4,
        borderColor: 'white',
        marginBottom: hp('15%'),
        alignSelf: 'center',
        position: 'absolute',
        marginTop: hp('10%'),
    },
    name: {
        fontSize: RFValue(22),
        color: '#FFFFFF',
        fontWeight: '600',
    },
    body: {
        marginTop: 40,
        flex: 1,
    },
    bodyContent: {
        flex: 1,
        alignItems: 'center',
    },
    name: {
        fontSize: 28,
        color: '#696969',
        fontWeight: '600',
    },
    info: {
        fontSize: 16,
        color: '#00BFFF',
        marginTop: 10,
    },
    description: {
        fontSize: 16,
        color: '#696969',
        marginTop: 10,
        textAlign: 'center',
    },
    buttonContainer: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        width: 250,
        borderRadius: 30,
        backgroundColor: '#00BFFF',
        padding: 20,
    },
    isActiveBtn: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        height: 50,
        width: 50,
        borderRadius: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#686cc3',
        elevation: 8,
    },
    actionButtonIcon: {
        fontSize: 20,
        height: 22,
        color: 'white',
    },
})
