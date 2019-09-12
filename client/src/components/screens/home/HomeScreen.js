import React from 'react'
import { View, StyleSheet, TouchableOpacity, Text, FlatList, RefreshControl, ImageBackground } from 'react-native'
import { Icon } from 'native-base'
import { connect } from 'react-redux'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'
import FloatButton from '../../button/FloatButton'
import HeaderHome from './HeaderHome'
import * as actions from '../../../redux/actions'
import { getRoomList } from '../../../networking/service'
import AppText from '../../CustomText'

class HomeScreen extends React.PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            isLoading: false,
        }
    }

    componentDidMount() {
        this._refreshDataFromServer()
        this._onRefresh = this._onRefresh.bind(this)
    }

    async _refreshDataFromServer() {
        const { getList } = this.props
        this.setState({ isLoading: true })
        //
        const result = await getRoomList({ role: [2, 1] })
        if (result.code === 0) {
            getList(result)
            this.setState({ isLoading: false })
        } else {
            // Alert error
            getList(result)
            this.setState({ isLoading: false })
        }
    }

    _onRefresh() {
        this._refreshDataFromServer()
    }

    upButtonHandler() {
        // OnCLick of Up button we scrolled the list to top
        this.ListView_Ref.scrollToOffset({ offset: 0, animated: true })
    }

    render() {
        const { navigation } = this.props
        const emailu = `${navigation.getParam('email', 'NO-EMAIL')}`
        return (
            <View style={styles.MainContainer}>
                <HeaderHome headerName="Home" navigation={this.props.navigation} />
                <FlatList
                    data={this.props.arr.data}
                    ref={(ref) => {
                        this.ListView_Ref = ref
                    }}
                    renderItem={({ item }) => {
                        return (
                            <FlatListItem
                                item={item}
                                parentFlatList={this}
                                navigation={this.props.navigation}
                                emailOwner={emailu}
                            />
                        )
                    }}
                    keyExtractor={(item) => item.facility_id}
                    // refreshing={this.state.isLoading}
                    refreshControl={<RefreshControl refreshing={this.state.isLoading} onRefresh={this._onRefresh} />}
                    numColumns={2}
                />
                <TouchableOpacity activeOpacity={0.5} onPress={this.upButtonHandler} style={styles.upButton}>
                    <Icon name="ios-arrow-up" style={{ color: 'white', fontSize: 20 }} />
                </TouchableOpacity>
                <View
                    style={{
                        position: 'absolute',
                        right: 30,
                        bottom: 70,
                    }}
                >
                    <FloatButton />
                </View>
            </View>
        )
    }
}

class FlatListItem extends React.PureComponent {
    constructor(props) {
        super(props)
        this._moveToDetail = this._moveToDetail.bind(this)
    }

    _moveToDetail() {
        const { navigate } = this.props.navigation
        const { need_schedule } = this.props.item
        if (need_schedule) {
            navigate('Schedule', {
                room_code: this.props.item.facility_code,
                room_name: this.props.item.facility_name,
                owner_email: this.props.emailOwner,
                facility_id: this.props.item.facility_id,
            })

            return
        }

        navigate('Detail', {
            roomCode: this.props.item.facility_code,
            roomName: this.props.item.facility_name,
            emailOwner: this.props.emailOwner,
            roomID: this.props.item.facility_id,
        })
    }

    render() {
        return (
            <View style={{ flex: 1, flexDirection: 'column' }}>
                <TouchableOpacity
                    activeOpacity={1}
                    style={{
                        backgroundColor: this.props.item.color,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: hp('35%'),
                        width: wp('50%'),
                        borderWidth: 1,
                        borderColor: 'white',
                    }}
                    onPress={this._moveToDetail}
                >
                    {this.props.item.facility_image_url !== null ? (
                        <ImageBackground
                            source={{
                                uri: `https://faas-csv.asia:443/api/images/facilities/${this.props.item.facility_image_url}`,
                            }}
                            style={{
                                flex: 1,
                                width: '100%',
                                height: hp('31%'),
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 15 }}>{this.props.item.facility_code}</Text>
                            <Text style={{ color: 'white', fontSize: 15, textAlign: 'center' }}>
                                {this.props.item.facility_name}
                            </Text>
                            <Text style={{ color: 'white', fontSize: 20 }}>
                                {<AppText i18nKey={this.props.item.status} />}
                            </Text>
                        </ImageBackground>
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontSize: 15 }}>{this.props.item.facility_code}</Text>
                            <Text style={{ color: 'white', fontSize: 15, textAlign: 'center' }}>
                                {this.props.item.facility_name}
                            </Text>
                            <Text style={{ color: 'white', fontSize: 20 }}>
                                {<AppText i18nKey={this.props.item.status} />}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    fabLeft: {
        height: 50,
        width: 50,
        borderRadius: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#686cc3',
        elevation: 8,
    },
    MainContainer: {
        flex: 1,
    },
    rowViewContainer: {
        fontSize: 18,
        paddingRight: 10,
        paddingTop: 10,
        paddingBottom: 10,
    },
    upButton: {
        position: 'absolute',
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 200,
        backgroundColor: '#686cc3',
        elevation: 8,
        left: 30,
        bottom: 70,
    },
    upButtonImage: {
        resizeMode: 'contain',
        width: 30,
        height: 30,
    },
    downButton: {
        position: 'absolute',
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        right: 30,
        top: 70,
    },
    downButtonImage: {
        resizeMode: 'contain',
        width: 30,
        height: 30,
    },
})

function mapStateToProps(state) {
    return {
        arr: state.filterReducer.data,
        language: state.languageReducer.language,
    }
}

export default connect(
    mapStateToProps,
    actions
)(HomeScreen)
