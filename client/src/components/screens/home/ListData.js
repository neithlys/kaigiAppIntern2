import React from 'react'
import { Text, View, FlatList, RefreshControl, TouchableOpacity, Button } from 'react-native'
import { getRoomList } from '../../../networking/service'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'
import { connect } from 'react-redux'
import * as actions from '../../../redux/actions'
import AppText from '../../customText'
class ListData extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isLoading: false,
        }
    }

    componentDidMount() {
        this._refreshDataFromServer()
    }

    _refreshData() {
        setTimeout(function() {
            this.setState({ isLoading: !this.state.isLoading })
        }, 1000)
        this.props.getList(this.props.arr)
        this.setState({ isLoading: !this.state.isLoading })
    }

    _refreshDataFromServer = () => {
        this.setState({ isLoading: !this.state.isLoading })
        getRoomList().then((result) => {
            if (result.code === 0) {
                this.props.getList(result)
                this.setState({ isLoading: !this.state.isLoading })
            } else {
                // Alert error
                this.props.getList(result)
                this.setState({ isLoading: !this.state.isLoading })
            }
        })
    }

    _onRefresh = () => {
        this._refreshData()
    }

    getItemLayout = (data, index) => ({
        length: 170,
        offset: 170 * index,
        index,
    })

    upButtonHandler = () => {
        //console.log(this.flatListRef.getScrollResponder());
        this.flatListRef.scrollToOffset({
            animated: true,
            offset: 0, //this is the first position that is currently attached to the window
        })
    }

    render() {
        //console.log(this.props.arr)
        return (
            <View>
                <FlatList
                    data={this.props.arr.data}
                    ref={(ref) => {
                        this.flatListRef = ref
                    }}
                    renderItem={({ item }) => {
                        return (
                            <FlatListItem
                                item={item}
                                parentFlatList={this}
                                navigate={this.props.navigation}
                                emailOwner={this.props.email}
                            />
                        )
                    }}
                    keyExtractor={(item) => item.room_name}
                    refreshing={this.state.isLoading}
                    refreshControl={<RefreshControl loading={this.state.isLoading} onRefresh={this._onRefresh} />}
                    numColumns={2}
                />
                <Button
                    title="Click"
                    style={{
                        backgroundColor: 'green',
                        height: 100,
                        width: 100,
                    }}
                    onPress={this.upButtonHandler}
                />
            </View>
        )
    }
}

class FlatListItem extends React.Component {
    constructor(props) {
        super(props)
    }

    _moveToDetail = () => {
        this.props.navigate.navigate('Detail', {
            roomCode: this.props.item.room_code,
            roomName: this.props.item.room_name,
            emailOwner: this.props.emailOwner,
        })
    }

    render() {
        return (
            <View style={{ flex: 1, flexDirection: 'column' }}>
                <TouchableOpacity
                    transparency
                    style={{
                        flex: 1,
                        backgroundColor: '#46bea0',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: hp('50%'),
                        width: wp('50%'),
                        borderWidth: 1,
                        borderColor: 'white',
                    }}
                    onPress={this._moveToDetail}
                >
                    <Text style={{ color: 'white', fontSize: 15 }}>{this.props.item.room_code}</Text>
                    <Text style={{ color: 'white', fontSize: 15 }}>{this.props.item.room_name}</Text>
                    <Text style={{ color: 'white', fontSize: 20 }}>AVAILABLE</Text>
                </TouchableOpacity>
            </View>
        )
    }
}

function mapStateToProps(state) {
    return {
        arr: state.filterReducer.data,
    }
}

export default connect(
    mapStateToProps,
    actions
)(ListData)
