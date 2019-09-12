import React, { Component } from 'react'
import { Text, View, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList } from 'react-native'
import moment from 'moment-timezone'
import AsyncStorage from '@react-native-community/async-storage'
import * as API from '../../../networking/service'
import HeaderSchedule from './HeaderSchedule'
import * as common from '../../common/common'

const scheduleScreen = StyleSheet.create({
    headerText: {
        fontWeight: 'bold',
        fontSize: 15,
    },
})

export default class ScheduleScreen extends Component {
    constructor(props) {
        super(props)
        this.userInfo = {}
        this.time_ranges = []
        this.semesters = []
        this.days = common.days
        this.state = {
            isLoading: true,
            mySchedule: [],
            currentSemester: null,
            semModalVisible: false,
        }

        this.renderDays = this.renderDays.bind(this)
        this.renderTimeRanges = this.renderTimeRanges.bind(this)
        this._getTimeRanges = this._getTimeRanges.bind(this)
        this._getSemester = this._getSemester.bind(this)
    }

    async componentDidMount() {
        this.userInfo = JSON.parse(await AsyncStorage.getItem('userInfo'))
        this._getTimeRanges()
    }

    // _getStart() {
    //     return moment().format()
    // }

    componentDidUpdate(prevProps, prevState) {
        const { currentSemester } = this.state
        if (
            (currentSemester && !prevState.currentSemester) ||
            (currentSemester &&
                prevState.currentSemester &&
                currentSemester.quarter_range_id !== prevState.currentSemester.quarter_range_id)
        ) {
            this._getMySchedule()
        }
    }

    // _updateSchedule(type, schedule = []) {
    //     this.setState({ isLoading: true })
    //     let newMySchedule = this.state.mySchedule
    //     if (type === 1) {
    //         newMySchedule = newMySchedule.concat(schedule)
    //     }

    //     if (type === 2) {
    //         newMySchedule = newMySchedule.map((e) => {
    //             // const newSchedule = schedule.find(
    //             //     (e2) => e2.event_title === e.event_title && e2.time_range_id === e.time_range_id
    //             // )
    //             if (e.event_title === schedule.event_title && e.time_range_id === schedule.time_range_id) {
    //                 return schedule
    //             }

    //             return e
    //         })
    //     }

    //     if (type === 3) {
    //         newMySchedule = newMySchedule.filter((e) => {
    //             // const newSchedule = schedule.find(
    //             //     (e2) => e2.event_title === e.event_title && e2.time_range_id === e.time_range_id
    //             // )
    //             // return !newSchedule
    //             return e.event_title !== schedule.event_title && e.time_range_id !== schedule.time_range_id
    //         })
    //     }

    //     this.setState({ mySchedule: newMySchedule, isLoading: false })
    // }

    getEventForSchedule(time_range, day) {
        const { organization_timezone_name } = this.userInfo
        const { mySchedule, currentSemester } = this.state
        const event = mySchedule.find((e) => {
            const inSemester =
                moment().tz(organization_timezone_name) >=
                    moment(currentSemester.quarter_range_start_ts).tz(organization_timezone_name) &&
                moment().tz(organization_timezone_name) <=
                    moment(currentSemester.quarter_range_end_ts).tz(organization_timezone_name)

            let inWeek = true
            if (inSemester) {
                const inWeek =
                    moment(e.start_ts)
                        .tz(organization_timezone_name)
                        .week() ===
                    moment()
                        .tz(organization_timezone_name)
                        .week()
            }

            let inDay = false
            if (inWeek) {
                inDay =
                    moment(e.start_ts)
                        .tz(organization_timezone_name)
                        .day() === day
            }

            let inTimeRange = false
            if (inDay) {
                if (e.time_range_id) {
                    inTimeRange = e.time_range_id === time_range.time_range_id
                } else {
                    const time_range_start_ts = moment(time_range.time_range_start_ts, 'HH:mm:ss')
                        .tz(organization_timezone_name)
                        .format('HH:mm:ss')

                    const time_range_end_ts = moment(time_range.time_range_end_ts, 'HH:mm:ss')
                        .tz(organization_timezone_name)
                        .format('HH:mm:ss')

                    inTimeRange =
                        moment(e.start_ts)
                            .tz(organization_timezone_name)
                            .format('HH:mm:ss') >= time_range_start_ts &&
                        moment(e.start_ts)
                            .tz(organization_timezone_name)
                            .format('HH:mm:ss') <= time_range_end_ts
                }
            }

            return inWeek && inDay && inTimeRange
        })

        return event
    }

    _changeSemester(newSemester) {
        this.setState({ currentSemester: newSemester })
    }

    async _getTimeRanges() {
        const { navigation } = this.props
        const facility_id = navigation.getParam('facility_id')
        const startM = moment()
        const endM = moment().add(28, 'day')
        const filter = {
            facility_id,
            startStr: startM.format(),
            endStr: endM.format(),
            eventType: ['self', 'relevant'],
        }
        const result = await API.getTimeRanges(filter)
        const { data } = result
        this.time_ranges = data
        this._getSemester()
    }

    async _getSemester() {
        const { organization_timezone_name } = this.userInfo

        const { navigation } = this.props
        const facility_id = navigation.getParam('facility_id')
        const startM = moment()
        const endM = moment().add(28, 'day')
        const filter = {
            facility_id,
            startStr: startM.format(),
            endStr: endM.format(),
            eventType: ['self', 'relevant'],
        }
        const result = await API.getSemester(filter)
        const { data } = result
        this.semesters = data
        const currentSemester = this.semesters.find((e) => {
            return (
                moment().tz(organization_timezone_name) >=
                    moment(e.quarter_range_start_ts).tz(organization_timezone_name) &&
                moment().tz(organization_timezone_name) <= moment(e.quarter_range_end_ts).tz(organization_timezone_name)
            )
        })
        this.setState({ currentSemester })
    }

    async _getMySchedule() {
        this.setState({ isLoading: true })
        const { organization_timezone_name } = this.userInfo
        const { navigation } = this.props
        const { currentSemester } = this.state
        const startM = moment(currentSemester.quarter_range_start_ts).tz(organization_timezone_name)
        const endM = moment(currentSemester.quarter_range_end_ts).tz(organization_timezone_name)
        console.log(
            moment(startM)
                .weekday(7)
                .format()
        )
        console.log(
            moment(startM)
                .weekday(14)
                .format()
        )
        const facility_id = navigation.getParam('facility_id')
        const filter = {
            facility_id,
            startStr: moment(startM)
                .weekday(7)
                .format(),
            endStr: moment(startM)
                .weekday(14)
                .format(),
            eventType: ['self', 'relevant'],
        }
        console.log(filter)
        const result = await API.getEventFacility(filter)
        const { data } = result
        this.setState({ mySchedule: data, isLoading: false })
    }

    renderDays() {
        const { navigation } = this.props
        const { currentSemester } = this.state
        const { organization_timezone_name } = this.userInfo
        const facility_id = navigation.getParam('facility_id')
        const output = []
        const dow = moment()
            .tz(organization_timezone_name)
            .day()
        for (let index = 0; index < this.days.length; index += 1) {
            const element = this.days[index]
            const item = (
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'column',
                        width: '100%',
                        backgroundColor: 'rgb(235, 235, 235)',
                    }}
                    key={element.day_id}
                >
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: dow === element.day_id ? 'red' : 'white',
                            marginRight: 1,
                            marginBottom: 1,
                            height: 70,
                        }}
                    >
                        {element.day_id === -1 ? (
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    width: '100%',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: 70,
                                }}
                                onPress={() => {
                                    // this.setState({ semModalVisible: true })
                                    navigation.navigate('Semester', {
                                        changeSemester: ((newSemester) => {
                                            this._changeSemester(newSemester)
                                        }).bind(this),
                                        semesters: this.semesters,
                                        currentSemester: this.state.currentSemester,
                                    })
                                }}
                            >
                                <Text
                                    style={[
                                        scheduleScreen.headerText,
                                        { color: dow === element.day_id ? 'white' : 'black' },
                                    ]}
                                >
                                    {currentSemester.quarter_range_name}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <View>
                                <Text
                                    style={{
                                        fontWeight: 'bold',
                                        fontSize: 15,
                                        color: dow === element.day_id ? 'white' : 'black',
                                    }}
                                >
                                    {element.day_name}
                                </Text>
                            </View>
                        )}
                    </View>
                    {this.renderTimeRanges(element, facility_id, navigation)}
                </View>
            )
            output.push(item)
        }

        return (
            <View
                style={{
                    flex: 1,
                    flexDirection: 'row',
                    height: '100%',
                    width: '100%',
                }}
            >
                {output}
            </View>
        )
    }

    renderTimeRanges(day, facility_id, navigation) {
        const { day_id, day_name } = day
        const { currentSemester } = this.state
        const startM = moment(currentSemester.quarter_range_start_ts)
        const endM = moment(currentSemester.quarter_range_end_ts)
        const output = []
        const { organization_timezone_name } = this.userInfo
        const nowTimeRange = moment()
            .tz(organization_timezone_name)
            .format('HH:mm:ss')
        for (let index = 0; index < this.time_ranges.length; index += 1) {
            const element = this.time_ranges[index]
            const event = this.getEventForSchedule(element, day_id)
            const start_time_range = moment(element.time_range_start_ts, 'HH:mm:ss').format('HH:mm:ss')
            const end_time_range = moment(element.time_range_end_ts, 'HH:mm:ss').format('HH:mm:ss')
            const isNow = nowTimeRange >= start_time_range && nowTimeRange <= end_time_range

            let backgroundColor = !isNow ? 'white' : 'red'
            let title = element.time_range_name
            let event_note = ''
            if (day_id !== -1) {
                // backgroundColor = event && event.color
                backgroundColor = event ? event.event_color : 'rgb(200, 200, 200)'
                title = event ? event.event_title : ''
                event_note = event ? event.event_note : ''
            }
            const item = (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 1,
                        marginBottom: 1,
                        height: 150,
                    }}
                    key={element.time_range_id}
                >
                    {day_id === -1 ? (
                        <View
                            activeOpacity={day_id === -1 ? 1 : 0.3}
                            style={{
                                flex: 1,
                                height: '100%',
                                width: '100%',
                                justifyContent: 'space-evenly',
                                alignItems: 'center',
                                backgroundColor,
                                flexDirection: 'column',
                            }}
                        >
                            <Text style={{ color: isNow ? 'white' : 'black' }}>
                                {start_time_range.slice(0, start_time_range.length - 3)}
                            </Text>
                            <View>
                                <Text style={{ fontWeight: 'bold', fontSize: 15, color: isNow ? 'white' : 'black' }}>
                                    {title}
                                </Text>
                            </View>
                            <Text style={{ color: isNow ? 'white' : 'black' }}>
                                {end_time_range.slice(0, end_time_range.length - 3)}
                            </Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            activeOpacity={day_id === -1 ? 1 : 0.3}
                            style={{
                                flex: 1,
                                height: '100%',
                                width: '100%',
                                justifyContent: 'flex-start',
                                alignItems: 'center',
                                backgroundColor,
                            }}
                            onPress={() => {
                                if (day_id === -1) {
                                    return
                                }

                                if (event) {
                                    navigation.navigate('NewSchedule', {
                                        startStr: startM.format(),
                                        endStr: endM.format(),
                                        dow: day_id,
                                        dow_name: day_name,
                                        facility_id,
                                        event,
                                        time_range: element,
                                        semester: currentSemester,
                                        reloadSchedule: this._getMySchedule.bind(this),
                                    })

                                    return
                                }

                                navigation.navigate('SubjectList', {
                                    facility_id,
                                    startStr: startM.format(),
                                    endStr: endM.format(),
                                    dow: day_id,
                                    dow_name: day_name,
                                    time_range: element,
                                    semester: currentSemester,
                                    reloadSchedule: this._getMySchedule.bind(this),
                                })
                            }}
                        >
                            <Text style={{ fontWeight: 'normal', fontSize: 13, color: 'white' }}>{title}</Text>
                            <Text style={{ fontWeight: 'normal', fontSize: 13, color: 'white' }}>{event_note}</Text>
                        </TouchableOpacity>
                    )}
                    {/* <TouchableOpacity
                        activeOpacity={day_id === -1 ? 1 : 0.3}
                        style={{
                            flex: 1,
                            height: '100%',
                            width: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor,
                        }}
                        onPress={() => {
                            if (day_id === -1) {
                                return
                            }
                            const startM = moment()
                            const endM = moment().add(28, 'day')
                            navigation.navigate('SubjectList', {
                                facility_id,
                                startStr: startM.format(),
                                endStr: endM.format(),
                                dow: day_id,
                                dow_name: day_name,
                                time_range_id: element.time_range_id,
                                time_range_name: element.time_range_name,
                                time_range_start_ts: element.time_range_start_ts,
                                time_range_end_ts: element.time_range_end_ts,
                            })
                        }}
                    >
                        <Text>{title}</Text>
                    </TouchableOpacity> */}
                </View>
            )
            output.push(item)
        }
        return output
    }

    render() {
        const { navigation } = this.props
        const { isLoading, semModalVisible, currentSemester } = this.state
        return (
            <View
                style={{
                    flex: 1,
                    flexDirection: 'column',
                    backgroundColor: 'rgb(235, 235, 235)',
                }}
            >
                <HeaderSchedule headerName="Schedule" navigation={navigation} />

                <ScrollView
                    style={{
                        flex: 1,
                        flexDirection: 'column',
                        backgroundColor: 'rgb(235, 235, 235)',
                    }}
                >
                    {!isLoading && this.renderDays()}

                    <Modal
                        visible={isLoading}
                        transparent
                        animationType="slide"
                        onRequestClose={() => {
                            this.setState({ semModalVisible: false })
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            }}
                        >
                            <View>
                                <ActivityIndicator />
                            </View>
                        </View>
                        {/* <TouchableOpacity
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                alignItems: 'center',
                            }}
                            onPress={() => {
                                this.setState({ semModalVisible: false })
                            }}>
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 5,
                                    padding: 5,
                                    width: '75%',
                                    maxHeight: '75%',
                                }}>
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
                                    data={this.semesters}
                                    keyExtractor={(item) => item.quarter_range_id.toString()}
                                    renderItem={({ item }) => {
                                        return (
                                            <TouchableOpacity
                                                style={{
                                                    width: '100%',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    backgroundColor:
                                                        currentSemester.quarter_range_id === item.quarter_range_id
                                                            ? 'rgb(230, 230, 230)'
                                                            : 'white',
                                                    padding: 25,
                                                    borderRadius: 5,
                                                }}
                                                onPress={() => {
                                                    this.setState({
                                                        semModalVisible: false,
                                                        currentSemester: item,
                                                    })
                                                }}>
                                                <Text
                                                    style={{
                                                        fontWeight: 'bold',
                                                    }}>
                                                    {item.quarter_range_name}
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    }}
                                />
                            </View>
                        </TouchableOpacity> */}
                    </Modal>

                    {/* <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        backgroundColor: 'green',
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            backgroundColor: 'green',
                        }}
                    >
                        <Text>THIEN</Text>
                    </View>
                </View> */}
                    {/* {time_ranges.forEach((e1) => {
                    return (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                backgroundColor: 'green',
                                width: 100,
                                height: 100,
                            }}
                        >
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    backgroundColor: 'green',
                                }}
                            >
                                <Text>{e1.name}</Text>
                            </View>
                            {days.forEach((e2) => {
                                return (
                                    <View
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            backgroundColor: 'yellow',
                                        }}
                                    >
                                        <Text>{e2.name}</Text>
                                    </View>
                                )
                            })}
                        </View>
                    )
                })} */}
                </ScrollView>
            </View>
        )
    }
}
