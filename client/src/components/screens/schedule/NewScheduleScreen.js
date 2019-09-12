import React, { Component } from 'react'
import { Text, View, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList } from 'react-native'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'
import moment from 'moment-timezone'
import AsyncStorage from '@react-native-community/async-storage'
import Snackbar from 'react-native-snackbar'
import * as API from '../../../networking/service'
import HeaderNewSchedule from './HeaderNewSchedule'
import * as common from '../../common/common'

const newScheduleStyles = StyleSheet.create({
    eachField: {
        width: '100%',
        height: 100,
        flexDirection: 'column',
        marginVertical: 10,
    },
    eachFieldMini: {
        width: '100%',
        flexDirection: 'column',
        marginVertical: 10,
    },
    eachLabel: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    textInput: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 17,
        backgroundColor: 'rgb(215, 215, 215)',
        borderRadius: 5,
        marginTop: 5,
        paddingLeft: 10,
    },
    buttonField: {
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'green',
        alignSelf: 'center',
        borderRadius: 5,
        padding: 20,
        marginVertical: 10,
    },
    buttonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
})

export default class NewScheduleScreen extends Component {
    constructor(props) {
        super(props)
        this.userInfo = {}
        const {
            navigation: {
                state: { params },
            },
        } = this.props
        this.state = {
            semester: params.semester || null,
            time_range: params.time_range || null,
            dow: params.dow || -1,
            dow_name: params.dow_name || -1,
            event: params.event || null,
            isEditable: false,
            isJoinable: false,
            isCreatable: false,
            isMember: false,
            colorModalVisible: false,
        }
        ;(this.backupEvent = params.event || null), (this._createSubject = this._createSubject.bind(this))
        this._joinSubject = this._joinSubject.bind(this)
        this._updateSubject = this._updateSubject.bind(this)
        this._deleteSubject = this._deleteSubject.bind(this)
    }

    async componentDidMount() {
        this.userInfo = JSON.parse(await AsyncStorage.getItem('userInfo'))
        const { user_id, permission_code } = this.userInfo
        const { event } = this.state
        let isEditable = false
        let isJoinable = false
        let isCreatable = false
        let isMember = false
        if (!event) {
            isEditable = false
            isCreatable = true
            isJoinable = false
        } else {
            isMember = !!event.joiner_list_ids.find((e) => e.user_id === user_id)
            if (event.owner_id === user_id) {
                isEditable = true
                isCreatable = false
                isJoinable = true
            } else if (Number(permission_code) >= 66) {
                isEditable = true
                isCreatable = false
                isJoinable = true
            } else {
                isEditable = false
                isCreatable = false
                isJoinable = true
            }
        }
        this.setState({ isCreatable, isEditable, isJoinable, isMember })
    }

    async _createSubject() {
        const { navigation } = this.props
        const { startStr, endStr, facility_id, reloadSubject, reloadSchedule } = navigation.state.params
        const { organization_timezone_name, user_id } = this.userInfo
        const { event, time_range, dow, semester } = this.state
        if (!event.event_title) {
            Snackbar.show({
                title: 'Title can not be empty',
                backgroundColor: 'red',
                duration: Snackbar.SHORT_INDEFINITE,
                action: {
                    title: 'OK',
                    color: 'white',
                },
            })

            return
        }
        if (!time_range || !semester) {
            Snackbar.show({
                title: 'Error !',
                backgroundColor: 'red',
                duration: Snackbar.SHORT_INDEFINITE,
                action: {
                    title: 'OK',
                    color: 'white',
                },
            })

            return
        }
        const events = []
        const start = moment(startStr)
            .tz(organization_timezone_name)
            .format('YYYY-MM-DD')
        const end = moment(endStr)
            .tz(organization_timezone_name)
            .format('YYYY-MM-DD')
        const dates = moment(end).diff(moment(start), 'day')
        for (let index = 0; index <= dates; index += 1) {
            const element = moment(start).add(index, 'day')
            if (element.day() === dow) {
                const { time_range_id } = time_range
                const start_ts = moment(`${element.format('YYYY-MM-DD')} ${time_range.time_range_start_ts}`).format()
                const end_ts = moment(`${element.format('YYYY-MM-DD')} ${time_range.time_range_end_ts}`).format()
                event.joiner_list = JSON.stringify([user_id])
                events.push({
                    ...event,
                    joiner_list: JSON.stringify([{ user_id }]),
                    start_ts,
                    end_ts,
                    facility_id,
                    time_range_id,
                })
            }
        }

        const result = await API.addSubject(events)
        if (result.error) {
            common.showMessage('Error', 0)

            return
        }

        common.showMessage('Successfully', 1)

        reloadSchedule && reloadSchedule()

        reloadSubject && reloadSubject()

        navigation.goBack()
    }

    async _joinSubject() {
        const { navigation } = this.props
        const { startStr, endStr, facility_id, reloadSchedule, reloadSubject } = navigation.state.params
        const { user_id, organization_timezone_name } = this.userInfo
        const { event, isMember } = this.state
        if (!event) {
            return
        }
        const { event_id } = event
        let joiner_list_ids = event.joiner_list_ids || []
        if (isMember) {
            joiner_list_ids = joiner_list_ids.filter((e) => e.user_id !== user_id)
        } else {
            joiner_list_ids.push({ user_id })
        }

        const start_sem = moment(startStr)
            .tz(organization_timezone_name)
            .format()

        const end_sem = moment(endStr)
            .tz(organization_timezone_name)
            .format()

        const { event_title } = event

        const result = await API.joinSubject({
            event: {
                joiner_list: JSON.stringify(joiner_list_ids),
            },
            start_sem,
            end_sem,
            facility_id,
            event_title: this.backupEvent.event_title,
            event_note: this.backupEvent.event_note,
        })

        if (result.error) {
            common.showMessage('Error', 0)

            return
        }

        common.showMessage('Successfully', 1)

        reloadSchedule && reloadSchedule()

        reloadSubject && reloadSubject()

        navigation.goBack()
    }

    async _updateSubject() {
        const { navigation } = this.props
        const { startStr, endStr, facility_id, reloadSchedule, reloadSubject } = navigation.state.params
        const { organization_timezone_name } = this.userInfo
        const { event, time_range } = this.state
        if (!event.event_title) {
            Snackbar.show({
                title: 'Title can not be empty',
                backgroundColor: 'red',
                duration: Snackbar.SHORT_INDEFINITE,
                action: {
                    title: 'OK',
                    color: 'white',
                },
            })

            return
        }
        const start_sem = moment(startStr)
            .tz(organization_timezone_name)
            .format()
        const end_sem = moment(endStr)
            .tz(organization_timezone_name)
            .format()

        const { event_title, event_note, event_color } = event
        const result = await API.updateSubject({
            event: {
                event_title,
                event_note,
                event_color,
            },
            time_range_id: time_range.time_range_id,
            start_sem,
            end_sem,
            facility_id,
            event_title: this.backupEvent.event_title,
            event_note: this.backupEvent.event_note,
        })
        if (result.error) {
            common.showMessage('Error', 0)

            return
        }

        common.showMessage('Successfully', 1)

        reloadSchedule && reloadSchedule()

        reloadSubject && reloadSubject()

        navigation.goBack()
    }

    async _deleteSubject() {
        const { navigation } = this.props
        const { startStr, endStr, facility_id, reloadSchedule, reloadSubject } = navigation.state.params
        const { organization_timezone_name } = this.userInfo
        const { time_range, event } = this.state
        if (!event.event_title) {
            Snackbar.show({
                title: 'Title can not be empty',
                backgroundColor: 'red',
                duration: Snackbar.SHORT_INDEFINITE,
                action: {
                    title: 'OK',
                    color: 'white',
                },
            })

            return
        }
        const events = []
        const start_sem = moment(startStr)
            .tz(organization_timezone_name)
            .format()
        const end_sem = moment(endStr)
            .tz(organization_timezone_name)
            .format()

        events.push(event)

        const { event_title, event_note, event_color } = event

        const result = await API.deleteSubject({
            events,
            time_range_id: time_range.time_range_id,
            start_sem,
            end_sem,
            facility_id,
            event_title: this.backupEvent.event_title,
            event_note: this.backupEvent.event_note,
        })
        if (result.error) {
            common.showMessage('Error', 0)

            return
        }

        common.showMessage('Successfully', 1)

        reloadSchedule && reloadSchedule()

        reloadSubject && reloadSubject()

        navigation.goBack()
    }

    render() {
        const {
            time_range,
            semester,
            dow_name,
            isCreatable,
            isEditable,
            isJoinable,
            isMember,
            colorModalVisible,
            event,
        } = this.state
        let event_title = ''
        let event_note = ''
        let event_color = ''
        if (event) {
            event_title = event.event_title
            event_color = event.event_color
            event_note = event.event_note
        }
        const { navigation } = this.props
        return (
            <View
                style={{
                    flex: 1,
                }}
            >
                <HeaderNewSchedule headerName="SubjectList" navigation={navigation} />
                <ScrollView
                    style={{
                        flex: 1,
                        backgroundColor: 'rgb(235, 235, 235)',
                        width: '100%',
                        flexDirection: 'column',
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            padding: 20,
                        }}
                    >
                        <View style={newScheduleStyles.eachField}>
                            <Text style={newScheduleStyles.eachLabel}>Title: </Text>
                            <TextInput
                                editable={isEditable || isCreatable}
                                style={newScheduleStyles.textInput}
                                value={event && event_title ? event_title : ''}
                                onChangeText={(value) => {
                                    this.setState({ event: { ...event, event_title: value } })
                                }}
                            />
                        </View>
                        <View style={newScheduleStyles.eachField}>
                            <Text style={newScheduleStyles.eachLabel}>Note: </Text>
                            <TextInput
                                editable={isEditable || isCreatable}
                                style={newScheduleStyles.textInput}
                                value={event && event_note ? event_note : ''}
                                onChangeText={(value) => {
                                    this.setState({ event: { ...event, event_note: value } })
                                }}
                            />
                        </View>
                        <View style={newScheduleStyles.eachField}>
                            <Text style={newScheduleStyles.eachLabel}>Color: </Text>
                            <TouchableOpacity
                                style={[
                                    newScheduleStyles.textInput,
                                    {
                                        backgroundColor: event && event_color ? event_color : 'green',
                                        color: 'white',
                                        alignItems: 'flex-start',
                                    },
                                ]}
                                onPress={() => {
                                    if (!isEditable && !isCreatable) {
                                        return
                                    }
                                    this.setState({ colorModalVisible: true })
                                }}
                            />
                        </View>
                        <View style={newScheduleStyles.eachFieldMini}>
                            <Text style={newScheduleStyles.eachLabel}>
                                Period: {time_range ? time_range.time_range_name : ''}
                            </Text>
                        </View>
                        <View style={newScheduleStyles.eachFieldMini}>
                            <Text style={newScheduleStyles.eachLabel}>Day: {dow_name}</Text>
                        </View>
                        <View style={newScheduleStyles.eachFieldMini}>
                            <Text style={newScheduleStyles.eachLabel}>
                                Semester: {semester ? semester.quarter_range_name : ''}
                            </Text>
                        </View>
                        {isCreatable && (
                            <TouchableOpacity style={newScheduleStyles.buttonField} onPress={this._createSubject}>
                                <Text style={newScheduleStyles.buttonText}>Add</Text>
                            </TouchableOpacity>
                        )}
                        {isEditable && (
                            <TouchableOpacity style={newScheduleStyles.buttonField} onPress={this._updateSubject}>
                                <Text style={newScheduleStyles.buttonText}>Update</Text>
                            </TouchableOpacity>
                        )}
                        {isEditable && (
                            <TouchableOpacity style={newScheduleStyles.buttonField} onPress={this._deleteSubject}>
                                <Text style={newScheduleStyles.buttonText}>Delete</Text>
                            </TouchableOpacity>
                        )}
                        {isJoinable && (
                            <TouchableOpacity style={newScheduleStyles.buttonField} onPress={this._joinSubject}>
                                <Text style={newScheduleStyles.buttonText}>{isMember ? 'Out' : 'Join'}</Text>
                            </TouchableOpacity>
                        )}
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
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => {
                                    return (
                                        <TouchableOpacity
                                            style={{
                                                width: '100%',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                backgroundColor: item.value,
                                                // borderWidth: 1,
                                                // borderColor: event.event_color === item.value ? 'black' : 'white',
                                                padding: 20,
                                                borderRadius: 5,
                                            }}
                                            onPress={() => {
                                                this.setState({
                                                    colorModalVisible: false,
                                                    event: { ...event, event_color: item.value },
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
        )
    }
}
