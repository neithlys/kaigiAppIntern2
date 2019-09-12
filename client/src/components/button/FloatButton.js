import React, { Component } from 'react'
// import {
//   widthPercentageToDP as wp,
//   heightPercentageToDP as hp
// } from "react-native-responsive-screen";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar } from 'react-native'
import Modal from 'react-native-modal'
import { CheckBox } from 'react-native-elements'
import { connect } from 'react-redux'
import FloatingLabel from 'react-native-floating-labels'
import { Icon, Button } from 'native-base'
import { Collapse, CollapseHeader, CollapseBody } from 'accordion-collapse-react-native'
import * as actions from '../../redux/actions'
import { getRoomList, locationList, categoryList } from '../../networking/service'
import AppText from '../CustomText'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'
class FloatButton extends Component {
    constructor(props) {
        super(props)
        var locateCheck = []
        var cateCheck = []
        locationList().then((res) => {
            if (res.code === 0) {
                for (var i = 0; i < res.data.length; i++) {
                    locateCheck.push({
                        id: res.data[i].location_id,
                        name: res.data[i].location_name,
                        check: false,
                    })
                }
            }
        })
        categoryList().then((res) => {
            for (var i = 0; i < res.data.length; i++) {
                cateCheck.push({
                    id: res.data[i].category_id,
                    name: res.data[i].category_name,
                    check: false,
                })
            }
        })
        this.state = {
            isModalVisible: false,
            keyword: '',
            btnColorAZ: 'grey',
            btnColorZA: 'white',
            collapsedStatus: false,
            collapsedLocation: false,
            collapsedCategory: false,
            iconArrowStatus: 'ios-arrow-down',
            iconArrowLocation: 'ios-arrow-down',
            iconArrowCategory: 'ios-arrow-down',
            lstCheckLocation: locateCheck,
            lstCheckCate: cateCheck,
            lstCheckStatus: [
                { name: 'AVAILABLE', check: false },
                { name: 'USING', check: false },
                // { name: "WAITING", check: false },
                // { name: "ENTERING", check: false }
            ],
        }
    }

    componentWillMount() {}

    _handleBtnSortAZ = async () => {
        if (this.state.btnColorAZ === 'white') {
            this.setState({ btnColorAZ: 'grey' })
            this.setState({ btnColorZA: 'white' })
            var result = await getRoomList()
            result.data = this.props.arr
            var resultSort = result.data.sort((a, b) => {
                return a.facility_id - b.facility_id
            })
            result.data = resultSort
            this.props.getList(result)
        }
    }

    _handleBtnSortZA = async () => {
        if (this.state.btnColorZA === 'white') {
            this.setState({ btnColorZA: 'grey' })
            this.setState({ btnColorAZ: 'white' })
            var result = await getRoomList()
            result.data = this.props.arr
            var resultSort = result.data.sort((a, b) => {
                return b.facility_id - a.facility_id
            })
            result.data = resultSort
            this.props.getList(result)
        }
    }

    _btnCollapseStatus = () => {
        if (this.state.collapsedStatus === false) {
            this.setState({
                collapsedStatus: !this.state.collapsedStatus,
                iconArrowStatus: 'ios-arrow-up',
            })
        } else {
            this.setState({
                collapsedStatus: !this.state.collapsedStatus,
                iconArrowStatus: 'ios-arrow-down',
            })
        }
    }

    _btnCollapseLocation = () => {
        if (this.state.collapsedLocation === false) {
            this.setState({
                collapsedLocation: !this.state.collapsedLocation,
                iconArrowLocation: 'ios-arrow-up',
            })
        } else {
            this.setState({
                collapsedLocation: !this.state.collapsedLocation,
                iconArrowLocation: 'ios-arrow-down',
            })
        }
    }

    _btnCollapseCategory = () => {
        if (this.state.collapsedCategory === false) {
            this.setState({
                collapsedCategory: !this.state.collapsedCategory,
                iconArrowCategory: 'ios-arrow-up',
            })
        } else {
            this.setState({
                collapsedCategory: !this.state.collapsedCategory,
                iconArrowCategory: 'ios-arrow-down',
            })
        }
    }

    _toggleModal = () => {
        // console.log("_toggleModal");
        this.setState({ isModalVisible: !this.state.isModalVisible })
    }

    _toggleBoxStatus = (value) => {
        let arr = this.state.lstCheckStatus
        arr.forEach((e) => {
            if (e.name == value) e.check = !e.check
        })
        this.setState({ lstCheckStatus: arr })
        this._filterGeneral()
    }

    _toggleBoxLocate = (value) => {
        let arr = this.state.lstCheckLocation
        arr.forEach((e) => {
            if (e.id == value) e.check = !e.check
        })
        this.setState({ lstCheckLocation: arr })
        this._filterGeneral()
    }

    _toggleBoxCate = (value) => {
        let arr = this.state.lstCheckCate
        arr.forEach((e) => {
            if (e.id == value) e.check = !e.check
        })
        this.setState({ lstCheckCate: arr })
        this._filterGeneral()
    }

    _filterGeneral = async () => {
        if (this.state.btnColorAZ === 'grey') {
            var result = await getRoomList()
        } else {
            var result = await getRoomList()
            result.data = result.data.sort((a, b) => {
                return b.facility_id - a.facility_id
            })
        }

        var status = new Array()
        this.state.lstCheckStatus.forEach((element) => {
            if (element.check == true) {
                status.push(element.name)
            }
        })

        var location = new Array()
        this.state.lstCheckLocation.forEach((element) => {
            if (element.check == true) {
                location.push(element.id)
            }
        })
        var cate = new Array()
        this.state.lstCheckCate.forEach((element) => {
            if (element.check == true) {
                cate.push(element.id)
            }
        })

        result.data = result.data.filter(function(res) {
            checkStatus = true
            if (status.length > 0) {
                checkStatus = res.status === status[0]
                status.forEach((element) => {
                    checkStatus = checkStatus || res.status == element
                })
            }

            checkLocation = true
            if (location.length > 0) {
                checkLocation = res.location_name === location[0]
                location.forEach((element) => {
                    checkLocation = checkLocation || res.location_id == element
                })
            }
            checkCate = true
            if (cate.length > 0) {
                checkCate = res.category_name === cate[0]
                cate.forEach((element) => {
                    checkCate = checkCate || res.category_id === element
                })
            }
            return checkLocation && checkCate && checkStatus
        })

        this.props.getList(result)
    }

    _onSubmitEdit = async (keyword) => {
        var res = await getRoomList()
        var value = keyword
        if (value !== '') {
            var resFilt = res.data.filter(function(item) {
                const itemData = `${item.facility_code.toUpperCase()} ${item.facility_name.toUpperCase()} `
                const textData = value.toUpperCase()
                return itemData.indexOf(textData) > -1
            })
            res.data = resFilt
            this.props.getList(res)
        } else {
            this.props.getList(res)
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <StatusBar hidden />
                <TouchableOpacity style={styles.fabRight} onPress={this._toggleModal}>
                    <Icon name="menu" style={{ color: 'white' }} />
                </TouchableOpacity>
                <Modal
                    isVisible={this.state.isModalVisible}
                    onBackdropPress={this._toggleModal}
                    style={{ margin: 0 }}
                    animationIn={'slideInRight'}
                    animationOut={'slideOutRight'}>
                    <View
                        style={{
                            height: hp('100%'),
                            backgroundColor: 'white',
                            width: wp('60%'),
                            marginLeft: wp('40%'),
                        }}>
                        <ScrollView>
                            <View style={{ flexDirection: 'row' }}>
                                <View
                                    style={{
                                        flex: 0.3,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                    <Text style={{ fontSize: 20 }}>
                                        <AppText i18nKey={'sort'} />:{' '}
                                    </Text>
                                </View>
                                <View style={{ flex: 0.7, flexDirection: 'row' }}>
                                    <View style={{ flex: 1 }}>
                                        <TouchableOpacity
                                            style={{
                                                borderTopLeftRadius: 5,
                                                borderBottomLeftRadius: 5,
                                                borderWidth: 1,
                                                borderColor: 'grey',
                                                backgroundColor: this.state.btnColorAZ,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                            onPress={this._handleBtnSortAZ}>
                                            <Text style={{ fontSize: 20 }}>A->Z</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <TouchableOpacity
                                            style={{
                                                borderTopRightRadius: 5,
                                                borderBottomRightRadius: 5,
                                                borderWidth: 1,
                                                borderColor: 'grey',
                                                backgroundColor: this.state.btnColorZA,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                            onPress={this._handleBtnSortZA}>
                                            <Text style={{ fontSize: 20 }}>Z->A</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                            <View
                                style={{
                                    flex: 1,
                                }}>
                                <FloatingLabel
                                    labelStyle={FloatStyle.labelInput}
                                    inputStyle={FloatStyle.input}
                                    style={FloatStyle.formInput}
                                    onChangeText={(keyword) => {
                                        this.setState({ keyword })
                                        this._onSubmitEdit(keyword)
                                    }}
                                    value={this.state.keyword}>
                                    <AppText i18nKey={'keyword'} />
                                </FloatingLabel>
                            </View>
                            <View>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text
                                        style={{
                                            width: '80%',
                                            fontSize: 20,
                                            margin: 5,
                                            color: 'black',
                                        }}>
                                        <AppText i18nKey={'status'} />:
                                    </Text>
                                    <Button
                                        transparent
                                        title=""
                                        onPress={this._btnCollapseStatus}
                                        style={{ backgroundColor: 'white' }}>
                                        <Icon style={{ color: 'black' }} name={this.state.iconArrowStatus} />
                                    </Button>
                                </View>

                                <Collapse
                                    isCollapsed={this.state.collapsedStatus}
                                    onToggle={(isCollapsed) => this.setState({ collapsedStatus: isCollapsed })}>
                                    <CollapseHeader>
                                        <Text />
                                    </CollapseHeader>

                                    <CollapseBody>
                                        {this.state.lstCheckStatus.map((value) => {
                                            return (
                                                <CheckBox
                                                    key={value.name}
                                                    title={
                                                        <Text
                                                            style={{
                                                                fontSize: 14,
                                                                color: 'black',
                                                                margin: 10,
                                                                fontWeight: 'bold',
                                                            }}>
                                                            <AppText i18nKey={value.name} />
                                                        </Text>
                                                    }
                                                    center
                                                    iconRight
                                                    activeOpacity={1}
                                                    containerStyle={{ backgroundColor: 'white', borderWidth: 0 }}
                                                    checked={value.check}
                                                    onPress={() => this._toggleBoxStatus(value.name)}
                                                />
                                            )
                                        })}
                                    </CollapseBody>
                                </Collapse>
                            </View>

                            <View>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text
                                        style={{
                                            width: '80%',
                                            fontSize: 20,
                                            margin: 5,
                                            color: 'black',
                                        }}>
                                        <AppText i18nKey={'location'} />:
                                    </Text>
                                    <Button
                                        transparent
                                        title=""
                                        onPress={this._btnCollapseLocation}
                                        style={{ backgroundColor: 'white' }}>
                                        <Icon style={{ color: 'black' }} name={this.state.iconArrowLocation} />
                                    </Button>
                                </View>

                                <Collapse
                                    isCollapsed={this.state.collapsedLocation}
                                    onToggle={(isCollapsed) => this.setState({ collapsedLocation: isCollapsed })}>
                                    <CollapseHeader>
                                        <Text />
                                    </CollapseHeader>

                                    <CollapseBody>
                                        {this.state.lstCheckLocation.map((value) => {
                                            return (
                                                <CheckBox
                                                    key={value.id}
                                                    title={value.name}
                                                    center
                                                    iconRight
                                                    activeOpacity={1}
                                                    containerStyle={{ backgroundColor: 'white', borderWidth: 0 }}
                                                    checked={value.check}
                                                    onPress={() => this._toggleBoxLocate(value.id)}
                                                />
                                            )
                                        })}
                                    </CollapseBody>
                                </Collapse>
                            </View>

                            <View>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text
                                        style={{
                                            width: '80%',
                                            fontSize: 20,
                                            margin: 5,
                                            color: 'black',
                                        }}>
                                        <AppText i18nKey={'category'} />:
                                    </Text>
                                    <Button
                                        transparent
                                        title=""
                                        onPress={this._btnCollapseCategory}
                                        style={{ backgroundColor: 'white' }}>
                                        <Icon style={{ color: 'black' }} name={this.state.iconArrowCategory} />
                                    </Button>
                                </View>
                                <Collapse
                                    isCollapsed={this.state.collapsedCategory}
                                    onToggle={(isCollapsed) => this.setState({ collapsedCategory: isCollapsed })}>
                                    <CollapseHeader>
                                        <Text />
                                    </CollapseHeader>

                                    <CollapseBody>
                                        {this.state.lstCheckCate.map((value) => {
                                            return (
                                                <CheckBox
                                                    key={value.id}
                                                    title={value.name}
                                                    center
                                                    iconRight
                                                    activeOpacity={1}
                                                    containerStyle={{ backgroundColor: 'white', borderWidth: 0 }}
                                                    checked={value.check}
                                                    onPress={() => this._toggleBoxCate(value.id)}
                                                />
                                            )
                                        })}
                                    </CollapseBody>
                                </Collapse>
                            </View>
                        </ScrollView>
                    </View>
                </Modal>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    fabRight: {
        height: 50,
        width: 50,
        borderRadius: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#686cc3',
        elevation: 8,
    },
    text: {
        fontSize: 30,
        color: 'white',
    },
    container: {
        flex: 1,
    },
})

function mapStateToProps(state) {
    return {
        arr: state.filterReducer.data.data,
    }
}

export default connect(
    mapStateToProps,
    actions,
)(FloatButton)

const FloatStyle = StyleSheet.create({
    input: {
        height: 60,
        paddingBottom: 5,
        fontSize: 20,
        borderWidth: 0,
        borderBottomWidth: 1,
        borderBottomColor: 'black',
    },
    labelInput: {
        color: 'black',
    },
    formInput: {
        marginBottom: 20,
        width: '100%',
        borderColor: 'black',
    },
})
