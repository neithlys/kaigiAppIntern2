import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Picker, ScrollView, RefreshControl } from 'react-native'
import { Icon } from 'native-base'
import { Agenda } from 'react-native-calendars'
import Modal from 'react-native-modal'
import { RFValue } from 'react-native-responsive-fontsize'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'

import moment from 'moment-timezone'
import Snackbar from 'react-native-snackbar'
import { CheckBox } from 'react-native-elements'
import AsyncStorage from '@react-native-community/async-storage'
import DateTimePicker from 'react-native-modal-datetime-picker'
import {
    getEventFacility,
    getUserAvailable,
    checkEventWithTime,
    addEvent,
    editEvent,
    deleteEvent,
    getTimeRanges,
} from '../../../networking/service'
// import { getConsoleOutput } from "@jest/console";
// if(process.env.NODE_ENV !== 'production'){
//   const {whyDidYouUpdate} = require('why-did-you-update');
//   whyDidYouUpdate(React);
// }
import ColorPick from '../../ColorPick'
import AppText from '../../CustomText'
import HeaderDetail from './HeaderDetail'

const FloatingLabel = require('react-native-floating-labels')

export default class DetailScreen extends React.PureComponent {
    constructor(props) {
        super(props)
        this.renderItem = this.renderItem.bind(this)
        this.renderEmptyDate = this.renderEmptyDate.bind(this)
        this.rowHasChanged = this.rowHasChanged.bind(this)
        this.handleEvent = this.handleEvent.bind(this)
        this.state = {
            items: {},
            curDay: moment().format(),
            isVisible: false,
            eventTitle: '',
            newEventTitle: '',
            eventStart: moment().format('YYYY-MM-DD'),
            timeStart: moment().format('HH:mm'),
            eventEnd: moment()
                .add(1, 'days')
                .format('YYYY-MM-DD'),
            timeEnd: moment()
                .add(1, 'hours')
                .format('HH:mm'),
            participants: [],
            participantOption: 0,
            listParticipantSelected: [],
            isLoading: false,
            day: false,
            email: '',
            status: '',
            itemEventID: '',
            note: '',
            eventID: '',
            now: {},
            isLoading: false,
            userID: '',
            isVisibleMenu: false,
            lstEventType: [
                { type: 1, name: 'self', check: true },
                { type: 2, name: 'relevant', check: false },
                { type: 3, name: 'others', check: false },
            ],
            mainID: '',
            timeRange: 0,
            lstTimeRange: [],
            isDateStart: false,
            isDateEnd: false,
            isTimeStart: false,
            isTimeEnd: false,
            timeRangeID: '',
            index: '',
            subCate: 0,
            subCategory: [
                { id: 1, name: 'Part-time' },
                { id: 2, name: 'Travel' },
                { id: 3, name: 'Dating' },
                { id: 4, name: 'Order' },
            ],
            event_color: 'green',
        }
    }

    componentDidMount = async () => {
        let userInfo = await AsyncStorage.getItem('userInfo')
        // const userInfo = JSON.stringify(info)
        const email = await AsyncStorage.getItem('email')
        const start = moment().format()
        const arrUser = []
        userInfo = JSON.parse(userInfo)
        this.state.mainID = userInfo.user_id
        await getTimeRanges(true).then((result) => {
            //
            getUserAvailable(start, start, null).then((res) => {
                res.data.forEach((e) => {
                    arrUser.push(e)
                })
            })
            this.setState({ participants: arrUser, email, lstTimeRange: result.data })
        })
    }

    _toggleModalMenu = () => {
        this.setState({
            isVisibleMenu: !this.state.isVisibleMenu,
        })
    }

    datePickerToggle = (day) => () => {
        if (day === true) {
            this.setState({ isDateStart: !this.state.isDateStart })
        }
        if (day === false) {
            this.setState({ isDateEnd: !this.state.isDateEnd })
        }
    }

    timePickerToggle = (time) => () => {
        if (time === true) {
            this.setState({ isTimeStart: !this.state.isTimeStart })
        }
        if (time === false) {
            this.setState({ isTimeEnd: !this.state.isTimeEnd })
        }
    }

    handleDatePickedStart = (date) => {
        // this.datePickerToggle(true);
        let newDate
        if (moment() <= moment(date)) {
            newDate = moment(date).format('YYYY-MM-DD')
        } else {
            // alert("Can't set time in past")
            newDate = moment().format('YYYY-MM-DD')
        }
        this.setState({ eventStart: newDate, isDateStart: !this.state.isDateStart })
    }

    handleDatePickedEnd = (date) => {
        let newDate
        if (moment(this.state.eventStart) <= moment(date)) {
            newDate = moment(date).format('YYYY-MM-DD')
        } else {
            newDate = moment(this.state.eventEnd).format('YYYY-MM-DD')
        }
        this.setState({ eventEnd: newDate, isDateEnd: !this.state.isDateEnd })
        // this.datePickerToggle(false);
    }

    handleTimePickedStart = (time) => {
        const newTime = moment(time).format('HH:mm')
        this.setState({ timeStart: newTime, isTimeStart: !this.state.isTimeStart })
        // this.timePickerToggle(true);
    }

    handleTimePickedEnd = (time) => {
        const newTime = moment(time).format('HH:mm')
        this.setState({ timeEnd: newTime, isTimeEnd: !this.state.isTimeEnd })
        // this.timePickerToggle(false);
    }

    _toggleModal = async () => {
        const email = await AsyncStorage.getItem('email')
        // if(this.state.status === "save")
        // {
        //     var status = "edit";
        // }
        // else {
        //   var status = "save";
        // }
        this.setState({
            isVisible: !this.state.isVisible,
            listParticipantSelected: [],
            status: 'save',
            eventStart: moment().format('YYYY-MM-DD'),
            timeStart: moment().format('HH:mm'),
            eventEnd: moment()
                .add(1, 'days')
                .format('YYYY-MM-DD'),
            timeEnd: moment()
                .add(1, 'hours')
                .format('HH:mm'),
            email,
        })
    }

    _onRefresh = () => {
        this.loadItems(this.state.now)
    }

    pickerChange(index) {
        const arr = this.state.listParticipantSelected
        if (arr.length > 0) {
            this.state.participants.forEach((v, i) => {
                if (index === i) {
                    const emailTmp = arr.filter(function(res) {
                        return res.email === v.email
                    })
                    if (emailTmp.length == 0) {
                        arr.push(v)
                    }
                }
            })
        } else {
            this.state.participants.forEach((v, i) => {
                if (index === i) {
                    arr.push(v)
                }
            })
        }
        this.setState({ listParticipantSelected: arr, participantOption: index })
    }

    _clearParticipant = () => {
        this.setState({ listParticipantSelected: [] })
    }

    // _changeItemShow = () => {
    //     this.setState({
    //       day: !this.state.day
    //     })
    //     //
    // }

    _toggleBox = (type) => {
        const arr = this.state.lstEventType
        arr.forEach((e) => {
            if (e.type == type) {
                e.check = !e.check
            }
        })
        this.setState({ lstCheckStatus: arr })
        this.loadItems(this.state.now)
    }

    _ClickDate(day) {
        this.setState({
            curDay: day,
        })
        this.loadItems(day)
    }

    async handleEvent() {
        console.log(this.state.eventTitle)
        const userInfo = JSON.parse(await AsyncStorage.getItem('userInfo'))
        const { organization_timezone_name } = userInfo
        const { navigation } = this.props

        const roomID = `${navigation.getParam('roomID', 'NO-ID')}`
        const joiner_list_id = []
        this.state.listParticipantSelected.forEach((res) => {
            //
            const arr = {
                user_id: res.user_id,
            }
            joiner_list_id.push(arr)
        })
        //
        const colorPick = this.refs.colorPicker.getColor()
        let timeStart
        let timeEnd
        let rangeID
        // if (roomID != 304) {
        //     timeStart = `${moment(this.state.lstTimeRange[this.state.timeRange].time_range_apply_from_ts).format(
        //         'YYYY-MM-DD',
        //     )} ${moment(this.state.lstTimeRange[this.state.timeRange].time_range_start_ts, 'HH:mm').format(
        //         'HH:mm',
        //     )}${moment().format('Z')}`
        //     timeEnd = `${moment(this.state.lstTimeRange[this.state.timeRange].time_range_apply_to_ts).format(
        //         'YYYY-MM-DD',
        //     )} ${moment(this.state.lstTimeRange[this.state.timeRange].time_range_end_ts, 'HH:mm').format(
        //         'HH:mm',
        //     )}${moment().format('Z')}`
        //     rangeID = this.state.lstTimeRange[this.state.timeRange].time_range_id
        // } else {
        //     timeStart = `${this.state.eventStart} ${this.state.timeStart}${moment().format('Z')}`
        //     timeEnd = `${this.state.eventEnd} ${this.state.timeEnd}${moment().format('Z')}`
        //     rangeID = null
        // }
        timeStart = `${this.state.eventStart} ${this.state.timeStart}${moment()
            .tz(organization_timezone_name)
            .format('Z')}`
        timeEnd = `${this.state.eventEnd} ${this.state.timeEnd}${moment()
            .tz(organization_timezone_name)
            .format('Z')}`
        rangeID = null
        //
        //
        if (this.state.status === 'save') {
            if (this.state.eventTitle !== '') {
                checkEventWithTime(timeStart, timeEnd, roomID, null).then(async (res) => {
                    if (res.code === 0) {
                        const event = {
                            start_ts: timeStart,
                            end_ts: timeEnd,
                            facility_id: roomID,
                            event_title: this.state.eventTitle,
                            event_color: colorPick,
                            time_range_id: rangeID,
                            joiner_list: joiner_list_id,
                            event_schedule_id: this.state.subCate,
                            event_note: this.state.note,
                        }
                        //
                        //
                        await addEvent(event)
                        this.loadItems(this.state.now)
                    } else {
                        alert('Failed to connect Server')
                    }
                })

                this._toggleModal()
            } else {
                Snackbar.show({
                    title: 'Please input event title',
                    backgroundColor: 'red',
                    duration: Snackbar.LONG_INDEFINITE,
                })
            }
        } else if (this.state.newEventTitle !== '') {
            // this.state.itemEdit.event_title = this.state.newEventTitle;
            // this.state.itemEdit.start =
            //   this.state.eventStart + " " + this.state.timeStart;
            // this.state.itemEdit.end =
            //   this.state.eventEnd + " " + this.state.timeEnd;
            // this.state.items[this.state.eventStart].splice(
            //   this.state.itemEdit.index,
            //   1,
            //   this.state.itemEdit
            // );

            checkEventWithTime(timeStart, timeEnd, roomID, null).then(async (res) => {
                if (res.code === 0) {
                    const event = {
                        start_ts: timeStart,
                        end_ts: timeEnd,
                        facility_id: roomID,
                        event_title: this.state.newEventTitle,
                        event_id: this.state.itemEventID,
                        event_color: colorPick,
                        time_range_id: rangeID,
                        joiner_list: joiner_list_id,
                        event_schedule_id: this.state.subCate,
                        event_note: this.state.note,
                    }
                    await editEvent(event)
                    this.loadItems(this.state.now)
                } else {
                    alert('Failed to connect Server')
                }
            })

            this._toggleModal()
        } else {
            Snackbar.show({
                title: 'Please input event title',
                backgroundColor: 'red',
                duration: Snackbar.LONG_INDEFINITE,
            })
        }
    }

    _deleteEvent = async () => {
        const user = {
            user_id: this.state.userID,
        }
        //
        await deleteEvent(this.state.itemEventID, user)
        this.loadItems(this.state.now)
        this._toggleModal()
    }

    _getRangeEvent = (datetimeS, datetimeE) => {
        const dateStart = new Date(moment(datetimeS).format('YYYY-MM-DD'))
        const dateEnd = new Date(moment(datetimeE).format('YYYY-MM-DD'))
        const rangeDate = []
        for (let i = dateStart; i <= dateEnd; i.setDate(i.getDate() + 1)) {
            rangeDate.push(moment(i).format('YYYY-MM-DD'))
        }
        return rangeDate
    }

    _getEndMax = (data) => {
        if (data.length > 0) {
            let max = moment(data[0].end).format('YYYY-MM-DD')
            data.forEach((pos) => {
                if (max < moment(pos.end).format('YYYY-MM-DD')) max = moment(pos.end).format('YYYY-MM-DD')
            })
            const getRange = this._getRangeEvent(moment(), max)
            if (getRange.length < 7) return 10
            return getRange.length
        }
        return 10
    }

    async loadItems(day) {
        const userInfo = JSON.parse(await AsyncStorage.getItem('userInfo'))
        const { organization_timezone_name } = userInfo
        const { navigation } = this.props
        const roomID = `${navigation.getParam('roomID', 'NO-ID')}`
        const start = moment(day.timestamp)
            .tz(organization_timezone_name)
            .hour(0)
            .minutes(0)
            .second(0)
            .add(-15, 'day')
            .format()

        const end = moment(day.timestamp)
            .tz(organization_timezone_name)
            .hour(23)
            .minutes(45)
            .second(0)
            .add(85, 'day')
            .format()

        const eventType = []
        this.state.lstEventType.forEach((res) => {
            if (res.check == true) eventType.push(res.name)
        })
        const filter = {
            facility_id: roomID,
            startStr: start,
            endStr: end,
            eventType: ['self', 'relevant'],
        }

        setTimeout(async () => {
            await getEventFacility(filter).then((res) => {
                // const dayEvent = this._getEndMax(res.data)
                for (let i = -15; i < 85; i++) {
                    const time = day.timestamp + i * 24 * 60 * 60 * 1000
                    const strTime = this.dayToString(time)
                    this.state.items[strTime] = []
                    if (res.data.length > 0) {
                        res.data.forEach((ele) => {
                            const item = {}
                            if (
                                moment(ele.start).format('YYYY-MM-DD') === strTime &&
                                moment(ele.end).format('YYYY-MM-DD') === strTime &&
                                ele.is_deleted == false
                            ) {
                                item.start = moment(ele.start_ts).format('YYYY-MM-DD HH:mm')
                                item.end = moment(ele.end_ts).format('YYYY-MM-DD HH:mm')
                                item.event_title = ele.event_title
                                item.owner_email = ele.owner_email
                                item.event_note = ele.event_note
                                item.event_id = ele.event_id
                                item.user_id = ele.user_id
                                item.event_color = ele.event_color
                                item.time_range_id = ele.time_range_id
                                item.event_schedule_id = ele.event_schedule_id
                                item.joiner_list = ele.joiner_list
                                this.state.items[strTime].push(item)
                            } else {
                                const rangeDate = this._getRangeEvent(ele.start, ele.end)
                                for (let index = 0; index < rangeDate.length; index++) {
                                    if (rangeDate[index] === strTime && ele.is_deleted == false) {
                                        if (rangeDate[index] === moment(ele.start).format('YYYY-MM-DD')) {
                                            item.start = moment(ele.start_ts).format('YYYY-MM-DD HH:mm')
                                            item.end = moment(ele.end_ts).format('YYYY-MM-DD HH:mm')
                                            item.event_title = ele.event_title
                                            item.owner_email = ele.owner_email
                                            item.event_note = ele.event_note
                                            item.event_id = ele.event_id
                                            item.user_id = ele.user_id
                                            item.event_color = ele.event_color
                                            item.time_range_id = ele.time_range_id
                                            item.event_schedule_id = ele.event_schedule_id
                                            item.joiner_list = ele.joiner_list
                                            item.show = true
                                            this.state.items[strTime].push(item)
                                        } else {
                                            item.start = moment(ele.start_ts).format('YYYY-MM-DD HH:mm')
                                            item.end = moment(ele.end_ts).format('YYYY-MM-DD HH:mm')
                                            item.event_title = ele.event_title
                                            item.owner_email = ele.owner_email
                                            item.event_note = ele.event_note
                                            item.event_id = ele.event_id
                                            item.user_id = ele.user_id
                                            item.event_color = ele.event_color
                                            item.time_range_id = ele.time_range_id
                                            item.event_schedule_id = ele.event_schedule_id
                                            item.joiner_list = ele.joiner_list
                                            item.show = false
                                            this.state.items[strTime].push(item)
                                        }
                                    }
                                }
                            }
                        })
                    }
                }
            })
            const newItems = {}
            Object.keys(this.state.items).forEach((key) => {
                newItems[key] = this.state.items[key]
            })
            this.setState({
                items: newItems,
            })
        }, 1000)
        // this.state.eventTitle = ''
    }

    _getIndexPicker = (value) => {
        let index = 0
        for (let i = 0; i < this.state.lstTimeRange.length; i++) {
            if (value === this.state.lstTimeRange[i].time_range_id) {
                index = i
            }
        }
        return index
    }

    renderItem(item) {
        //
        //
        // )
        return (
            <TouchableOpacity
                style={{
                    backgroundColor: item.event_color !== null ? item.event_color : '#1175b5',
                    flex: 1,
                    borderRadius: 5,
                    padding: 10,
                    marginRight: 10,
                    marginTop: 17,
                }}
                onPress={() => {
                    this.setState({
                        isVisible: !this.state.isVisible,
                        status: 'edit',
                        newEventTitle: item.event_title,
                        eventStart: moment(item.start).format('YYYY-MM-DD'),
                        eventEnd: moment(item.end).format('YYYY-MM-DD'),
                        timeStart: moment(item.start).format('HH:mm'),
                        timeEnd: moment(item.end).format('HH:mm'),
                        email: item.owner_email,
                        note: item.event_note,
                        itemEventID: item.event_id,
                        userID: item.user_id,
                        timeRange: this._getIndexPicker(item.time_range_id),
                        subCate: item.event_schedule_id,
                        timeRangeID: item.time_range_id,
                        listParticipantSelected: item.joiner_list !== null ? item.joiner_list : [],
                        event_color: item.event_color,
                    })
                }}>
                {/* {item.show == true ? (
                    <View>
                        <Text style={styles.content}>{item.event_title}</Text>
                        <Text style={styles.content}>{moment(item.start).format('YYYY-MM-DD')}</Text>
                    </View>
                ) : (
                    <View>
                        <Text style={styles.content} />
                        <Text style={styles.content} />
                    </View>
                )} */}
                <View>
                    <Text style={styles.content}>{item.event_title}</Text>
                    <Text style={styles.content}>{moment(item.start).format('YYYY-MM-DD')}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    renderEmptyDate() {
        return (
            <View style={styles.emptyDate}>
                {/* <Text style={{ color: 'black', fontSize: 15 }}>
                    <AppText i18nKey="emptyCalen" />
                </Text> */}
            </View>
        )
    }

    rowHasChanged(r1, r2) {
        //
        // return r1.event_color !== r2.event_color || r1.event_title !== r2.event_title;
        return r1 !== r2
    }

    dayToString(time) {
        const date = new Date(time)
        return date.toISOString().split('T')[0]
    }

    timeToString(time) {
        const date = new Date(time)
        return date.toISOString().split('T')[1]
    }

    render() {
        const { navigation } = this.props
        const roomCode = `${navigation.getParam('roomCode', 'NO-CODE')}`
        const roomName = `${navigation.getParam('roomName', 'NO-NAME')}`
        const roomID = `${navigation.getParam('roomID', 'NO-ID')}`
        //
        //
        return (
            <View style={{ flex: 1 }}>
                <HeaderDetail navigation={this.props.navigation} />
                {/* <Button title="ChangeItemShow" style={{ width: "100%", height: 100 }} onPress={this._changeItemShow}/> */}
                <Agenda
                    ref={(ref) => (this.AgendaRef = ref)}
                    items={this.state.items}
                    loadItemsForMonth={(day) => {
                        this.state.now = day
                        this.loadItems(day)
                    }}
                    onDayPress={(day) => this._ClickDate(day)}
                    selected={this.state.curDay}
                    renderItem={this.renderItem}
                    renderEmptyDate={this.renderEmptyDate}
                    rowHasChanged={this.rowHasChanged}
                    refreshControl={<RefreshControl refreshing={this.state.isLoading} onRefresh={this._onRefresh} />}
                    showWeekNumbers
                />
                <View
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        right: 20,
                    }}>
                    <TouchableOpacity style={styles.fabRight} onPress={this._toggleModal}>
                        <Text
                            style={{
                                fontSize: 30,
                                color: 'white',
                            }}>
                            +
                        </Text>
                    </TouchableOpacity>
                </View>
                <Modal
                    isVisible={this.state.isVisible}
                    style={{
                        alignItems: 'center',
                    }}
                    animationIn="slideInRight"
                    animationOut="slideOutRight"
                    onBackdropPress={this._toggleModal}>
                    <View
                        style={{
                            width: wp('80%'),
                            height: hp('85%'),
                            backgroundColor: 'white',
                            borderRadius: 10,
                            padding: 10,
                        }}>
                        <View
                            style={{
                                flex: 1.5,
                            }}>
                            <ScrollView>
                                <Text
                                    style={{
                                        fontSize: 25,
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                    }}>
                                    {roomName}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                    }}>
                                    {roomCode}
                                </Text>

                                {this.state.status === 'save' ? (
                                    <FloatingLabel
                                        labelStyle={styles.labelInput}
                                        inputStyle={styles.input}
                                        style={styles.formInput}
                                        onChangeText={(eventTitle) => this.setState({ eventTitle })}
                                        value={this.state.eventTitle}
                                        enablesReturnKeyAutomatically>
                                        <AppText i18nKey="event" />
                                    </FloatingLabel>
                                ) : (
                                    <FloatingLabel
                                        labelStyle={styles.labelInput}
                                        inputStyle={styles.input}
                                        style={styles.formInput}
                                        onChangeText={(newEventTitle) => this.setState({ newEventTitle })}
                                        value={this.state.newEventTitle}
                                        enablesReturnKeyAutomatically>
                                        <AppText i18nKey="event" />
                                    </FloatingLabel>
                                )}
                                <View>
                                    {/* <Picker
                                        selectedValue={this.state.subCate}
                                        style={{
                                            height: RFValue(100),
                                            width: '100%',
                                        }}
                                        itemStyle={{
                                            fontSize: RFValue(20),
                                            height: RFValue(100),
                                        }}
                                        onValueChange={
                                            (itemValue, itemIndex) => this.setState({ subCate: itemIndex })
                                            // }
                                        }>
                                        {this.state.subCategory.map((value, index) => {
                                            return <Picker.Item key={index} label={value.name} value={index} />
                                        })}
                                    </Picker> */}

                                    {/* <View
                                        style={{
                                            width: '80%',
                                            flexDirection: 'row',
                                            // padding: 10,
                                        }}>
                                        <Text
                                            style={{
                                                fontSize: 25,
                                                marginLeft: 10,
                                            }}>
                                            <AppText i18nKey="start" />:
                                        </Text>
                                        <View>
                                            <TouchableOpacity onPress={this.datePickerToggle(true)}>
                                                <Text
                                                    style={{
                                                        fontSize: 25,
                                                        borderBottomColor: 'gray',
                                                        borderBottomWidth: 1,
                                                        marginLeft: 10,
                                                    }}>
                                                    {this.state.eventStart}
                                                </Text>
                                            </TouchableOpacity>
                                            <DateTimePicker
                                                isVisible={this.state.isDateStart}
                                                onConfirm={this.handleDatePickedStart}
                                                onCancel={this.datePickerToggle(true)}
                                                // minimumDate={new Date()} //chi dung dc cho ios
                                            />
                                        </View>
                                        <View
                                            style={{
                                                width: 15,
                                            }}
                                        />
                                        <View>
                                            <TouchableOpacity onPress={this.timePickerToggle(true)}>
                                                <Text
                                                    style={{
                                                        fontSize: 25,
                                                        borderBottomColor: 'gray',
                                                        borderBottomWidth: 1,
                                                    }}>
                                                    {this.state.timeStart}
                                                </Text>
                                            </TouchableOpacity>
                                            <DateTimePicker
                                                mode="time"
                                                isVisible={this.state.isTimeStart}
                                                onConfirm={this.handleTimePickedStart}
                                                onCancel={this.timePickerToggle(true)}
                                            />
                                        </View>
                                    </View> */}

                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: 'column',
                                            marginBottom: 20,
                                            padding: 10,
                                        }}>
                                        <View>
                                            <Text>
                                                <AppText i18nKey="start" />:
                                            </Text>
                                        </View>

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-evenly',
                                            }}>
                                            <View style={{ flex: 0.5, alignItems: 'flex-end' }}>
                                                <TouchableOpacity onPress={this.datePickerToggle(true)}>
                                                    <Text
                                                        style={{
                                                            borderBottomColor: 'gray',
                                                            borderBottomWidth: 1,
                                                        }}>
                                                        {this.state.eventStart}
                                                    </Text>
                                                </TouchableOpacity>
                                                <DateTimePicker
                                                    isVisible={this.state.isDateStart}
                                                    onConfirm={this.handleDatePickedStart}
                                                    onCancel={this.datePickerToggle(true)}
                                                />
                                            </View>

                                            <View style={{ flex: 0.5, alignItems: 'flex-end' }}>
                                                <TouchableOpacity onPress={this.timePickerToggle(true)}>
                                                    <Text
                                                        style={{
                                                            borderBottomColor: 'gray',
                                                            borderBottomWidth: 1,
                                                        }}>
                                                        {this.state.timeStart}
                                                    </Text>
                                                </TouchableOpacity>
                                                <DateTimePicker
                                                    mode="time"
                                                    isVisible={this.state.isTimeStart}
                                                    onConfirm={this.handleTimePickedStart}
                                                    onCancel={this.timePickerToggle(true)}
                                                />
                                            </View>
                                        </View>
                                    </View>

                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: 'column',
                                            marginBottom: 20,
                                            padding: 10,
                                        }}>
                                        <View>
                                            <Text>
                                                <AppText i18nKey="end" />:
                                            </Text>
                                        </View>

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-evenly',
                                            }}>
                                            <View style={{ flex: 0.5, alignItems: 'flex-end' }}>
                                                <TouchableOpacity onPress={this.datePickerToggle(false)}>
                                                    <Text
                                                        style={{
                                                            borderBottomColor: 'gray',
                                                            borderBottomWidth: 1,
                                                        }}>
                                                        {this.state.eventEnd}
                                                    </Text>
                                                </TouchableOpacity>
                                                <DateTimePicker
                                                    isVisible={this.state.isDateEnd}
                                                    onConfirm={this.handleDatePickedEnd}
                                                    onCancel={this.datePickerToggle(false)}
                                                />
                                            </View>

                                            <View style={{ flex: 0.5, alignItems: 'flex-end' }}>
                                                <TouchableOpacity onPress={this.timePickerToggle(false)}>
                                                    <Text
                                                        style={{
                                                            borderBottomColor: 'gray',
                                                            borderBottomWidth: 1,
                                                        }}>
                                                        {this.state.timeEnd}
                                                    </Text>
                                                </TouchableOpacity>
                                                <DateTimePicker
                                                    mode="time"
                                                    isVisible={this.state.isTimeEnd}
                                                    onConfirm={this.handleTimePickedEnd}
                                                    onCancel={this.timePickerToggle(false)}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                {/* {roomID == 304 ? (
                                    <View>
                                        <Picker
                                            selectedValue={this.state.subCate}
                                            style={{
                                                height: RFValue(100),
                                                width: '100%',
                                            }}
                                            itemStyle={{
                                                fontSize: RFValue(20),
                                                height: RFValue(100),
                                            }}
                                            onValueChange={
                                                (itemValue, itemIndex) => this.setState({ subCate: itemIndex })
                                                // }
                                            }>
                                            {this.state.subCategory.map((value, index) => {
                                                return <Picker.Item key={index} label={value.name} value={index} />
                                            })}
                                        </Picker>

                                        <View
                                            style={{
                                                width: '80%',
                                                flexDirection: 'row',
                                                // padding: 10,
                                            }}>
                                            <Text
                                                style={{
                                                    fontSize: 25,
                                                    marginLeft: 10,
                                                }}>
                                                <AppText i18nKey="start" />:
                                            </Text>
                                            <View>
                                                <TouchableOpacity onPress={this.datePickerToggle(true)}>
                                                    <Text
                                                        style={{
                                                            fontSize: 25,
                                                            borderBottomColor: 'gray',
                                                            borderBottomWidth: 1,
                                                            marginLeft: 10,
                                                        }}>
                                                        {this.state.eventStart}
                                                    </Text>
                                                </TouchableOpacity>
                                                <DateTimePicker
                                                    isVisible={this.state.isDateStart}
                                                    onConfirm={this.handleDatePickedStart}
                                                    onCancel={this.datePickerToggle(true)}
                                                    // minimumDate={new Date()} //chi dung dc cho ios
                                                />
                                            </View>
                                            <View
                                                style={{
                                                    width: 15,
                                                }}
                                            />
                                            <View>
                                                <TouchableOpacity onPress={this.timePickerToggle(true)}>
                                                    <Text
                                                        style={{
                                                            fontSize: 25,
                                                            borderBottomColor: 'gray',
                                                            borderBottomWidth: 1,
                                                        }}>
                                                        {this.state.timeStart}
                                                    </Text>
                                                </TouchableOpacity>
                                                <DateTimePicker
                                                    mode="time"
                                                    isVisible={this.state.isTimeStart}
                                                    onConfirm={this.handleTimePickedStart}
                                                    onCancel={this.timePickerToggle(true)}
                                                />
                                            </View>
                                        </View>

                                        <View
                                            style={{
                                                width: '80%',
                                                flexDirection: 'row',
                                                padding: 10,
                                            }}>
                                            <Text
                                                style={{
                                                    fontSize: 25,
                                                    marginLeft: 10,
                                                }}>
                                                <AppText i18nKey="end" />:
                                            </Text>
                                            <View>
                                                <TouchableOpacity onPress={this.datePickerToggle(false)}>
                                                    <Text
                                                        style={{
                                                            fontSize: 25,
                                                            borderBottomColor: 'gray',
                                                            borderBottomWidth: 1,
                                                            marginLeft: 10,
                                                        }}>
                                                        {this.state.eventEnd}
                                                    </Text>
                                                </TouchableOpacity>
                                                <DateTimePicker
                                                    isVisible={this.state.isDateEnd}
                                                    onConfirm={this.handleDatePickedEnd}
                                                    onCancel={this.datePickerToggle(false)}
                                                />
                                            </View>
                                            <View
                                                style={{
                                                    width: 15,
                                                }}
                                            />
                                            <View>
                                                <TouchableOpacity onPress={this.timePickerToggle(false)}>
                                                    <Text
                                                        style={{
                                                            fontSize: 25,
                                                            borderBottomColor: 'gray',
                                                            borderBottomWidth: 1,
                                                        }}>
                                                        {this.state.timeEnd}
                                                    </Text>
                                                </TouchableOpacity>
                                                <DateTimePicker
                                                    mode="time"
                                                    isVisible={this.state.isTimeEnd}
                                                    onConfirm={this.handleTimePickedEnd}
                                                    onCancel={this.timePickerToggle(false)}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <Picker
                                        selectedValue={this.state.timeRange}
                                        style={{
                                            height: RFValue(100),
                                            width: '100%',
                                        }}
                                        itemStyle={{
                                            fontSize: RFValue(20),
                                            height: RFValue(100),
                                        }}
                                        onValueChange={
                                            (itemValue, itemIndex) => this.setState({ timeRange: itemIndex })
                                            // }
                                        }>
                                        {this.state.lstTimeRange.map((value, index) => {
                                            return (
                                                <Picker.Item key={index} label={value.time_range_name} value={index} />
                                            )
                                        })}
                                    </Picker>
                                )} */}

                                <FloatingLabel
                                    labelStyle={styles.labelInput}
                                    inputStyle={styles.input}
                                    style={styles.formInput}
                                    value={this.state.email}
                                    editable={false}>
                                    <AppText i18nKey="owner" />
                                </FloatingLabel>

                                <FloatingLabel
                                    labelStyle={styles.labelInput}
                                    inputStyle={styles.input}
                                    style={styles.formInput}
                                    onChangeText={(note) => this.setState({ note })}
                                    value={this.state.note}>
                                    <AppText i18nKey="note" />
                                </FloatingLabel>

                                <View
                                    style={{
                                        flex: 1,
                                        marginBottom: 20,
                                    }}>
                                    <View
                                        style={{
                                            width: '100%',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                        <View style={{ width: '100%', marginLeft: 15 }}>
                                            <Text>Participants</Text>
                                        </View>
                                        <Picker
                                            selectedValue={this.state.participantOption}
                                            style={{
                                                width: '100%',
                                            }}
                                            itemStyle={{
                                                fontSize: RFValue(20),
                                                height: RFValue(100),
                                            }}
                                            onValueChange={(itemValue, itemIndex) => this.pickerChange(itemIndex)}>
                                            {this.state.participants.map((value, index) => {
                                                return <Picker.Item key={index} label={value.email} value={index} />
                                            })}
                                        </Picker>
                                    </View>

                                    {this.state.listParticipantSelected.map((value, index) => {
                                        return (
                                            <View
                                                key={index}
                                                style={{
                                                    backgroundColor: '#d3d3d3',
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    margin: 10,
                                                    flex: 0.8,
                                                    borderRadius: 10,
                                                }}>
                                                <Text style={{ marginLeft: 10, fontSize: 20, color: 'white' }}>
                                                    {value.email}
                                                </Text>
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: 'grey',
                                                        borderRadius: 200,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                    onPress={this._clearParticipant}>
                                                    <Icon
                                                        name="ios-close"
                                                        style={{
                                                            color: '#d3d3d3',
                                                            fontSize: 15,
                                                            marginLeft: 10,
                                                            marginRight: 10,
                                                        }}
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                        )
                                    })}
                                </View>
                            </ScrollView>
                        </View>

                        <View style={{ padding: 10, flex: 1 }}>
                            <View>
                                <Text>Event Color</Text>
                            </View>
                            <ColorPick ref="colorPicker" initColor={this.state.event_color} />
                        </View>
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                padding: 10,
                            }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#686cc3',
                                    borderRadius: 10,
                                    width: '30%',
                                    alignItems: 'center',
                                    // marginBottom: 20,
                                    justifyContent: 'center',
                                    padding: 10,
                                }}
                                onPress={this.handleEvent}>
                                <Text
                                    style={{
                                        fontSize: 20,
                                        color: 'white',
                                    }}>
                                    <AppText i18nKey="save" />
                                </Text>
                            </TouchableOpacity>
                            {this.state.status === 'edit' ? (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: 'red',
                                        borderRadius: 10,
                                        width: '30%',
                                        alignItems: 'center',
                                        // marginBottom: 20,
                                        padding: 10,
                                        justifyContent: 'center',
                                    }}
                                    onPress={this._deleteEvent}>
                                    <Text
                                        style={{
                                            fontSize: 20,
                                            color: 'white',
                                        }}>
                                        <AppText i18nKey="delete" />
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                </Modal>
                {/* <View
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        left: 20,
                    }}>
                    <TouchableOpacity style={styles.fabRight} onPress={this._toggleModalMenu}>
                        <Icon name="menu" style={{ color: 'white' }} />
                    </TouchableOpacity>
                </View> */}
                {/* <Modal
                    isVisible={this.state.isVisibleMenu}
                    onBackdropPress={this._toggleModalMenu}
                    style={{ margin: 0 }}
                    animationIn="slideInLeft"
                    animationOut="slideOutLeft">
                    <View
                        style={{
                            width: wp('60%'),
                            height: hp('100%'),
                            backgroundColor: 'white',
                            padding: 10,
                        }}>
                        {this.state.lstEventType.map((value) => {
                            color = value.type == 1 ? '#CCFFCC' : value.type == 3 ? '#E6E6E6' : '#CCCCFF'
                            return (
                                <CheckBox
                                    key={value.name}
                                    title={
                                        <Text style={{ fontSize: 14, color: 'black', margin: 10, fontWeight: 'bold' }}>
                                            <AppText i18nKey={`eventType${value.type}`} />
                                        </Text>
                                    }
                                    center
                                    iconRight
                                    activeOpacity={1}
                                    containerStyle={{ backgroundColor: color, borderWidth: 0, margin: 10 }}
                                    checked={value.check}
                                    checkedColor="black"
                                    onPress={() => this._toggleBox(value.type)}
                                />
                            )
                        })}
                    </View>
                </Modal> */}
            </View>
        )
    }
}
const styles = StyleSheet.create({
    item: {
        backgroundColor: '#1175b5',
        flex: 1,
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
        marginTop: 17,
    },
    content: {
        color: 'white',
        fontSize: 20,
    },
    emptyDate: {
        backgroundColor: 'white',
        flex: 1,
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
        marginTop: 17,
        justifyContent: 'center',
    },
    fabRight: {
        height: 50,
        width: 50,
        borderRadius: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#686cc3',
    },
    contentEvent: {
        fontSize: 20,
    },
    input: {
        height: 60,
        paddingBottom: 10,
        fontSize: 20,
        borderWidth: 0,
        borderBottomWidth: 1.5,
        borderBottomColor: 'black',
    },
    btnSubmit: {
        height: hp('5%'),
        width: wp('90%'),
        padding: 10,
        backgroundColor: '#1175b5',
    },
    labelInput: {
        color: 'black',
    },
    formInput: {
        marginBottom: 20,
        width: '100%',
        borderColor: 'black',
    },
    itemDay: {
        backgroundColor: 'grey',
        flex: 1,
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
        marginTop: 17,
    },
})
