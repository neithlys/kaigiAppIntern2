import React, { Component } from 'react'
import { Text, View, FlatList, TouchableOpacity } from 'react-native'
import * as API from '../../../networking/service'
import HeaderSubjectList from './HeaderSubjectList'
import { removeDuplicates } from '../../common/common'
export default class SubjectListScreen extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isLoading: true,
            subjectList: [],
        }
    }

    componentDidMount() {
        this._getSubjectList()
    }

    async _getSubjectList() {
        const { navigation } = this.props
        const { startStr, endStr, facility_id, dow, time_range } = navigation.state.params
        const { time_range_id } = time_range
        const filter = {
            startStr,
            endStr,
            facility_id,
            eventType: ['self', 'relevant', 'others'],
            dow,
            time_range_id,
            permission_code: '99',
        }
        const result = await API.getEventFacility(filter)
        const { data } = result
        const uniqueData = removeDuplicates(data, 'event_title')
        this.setState({ subjectList: uniqueData, isLoading: false })
    }

    render() {
        const { navigation } = this.props
        const {
            facility_id,
            dow,
            startStr,
            endStr,
            dow_name,
            time_range,
            semester,
            reloadSchedule,
        } = navigation.state.params
        const { time_range_name } = time_range
        const { subjectList, isLoading } = this.state
        return (
            <View
                style={{
                    flex: 1,
                    flexDirection: 'column',
                    backgroundColor: 'rgb(200, 200, 200)',
                }}
            >
                <HeaderSubjectList headerName="SubjectList" navigation={navigation} />

                <View
                    style={{
                        width: '100%',
                        height: 50,
                        justifyContent: 'space-evenly',
                        alignItems: 'center',
                        backgroundColor: 'black',
                        flexDirection: 'row',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: 'white',
                        }}
                    >
                        {`Period: ${time_range_name}`}
                    </Text>
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: 'white',
                        }}
                    >
                        {` Day: ${dow_name}`}
                    </Text>
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: 'white',
                        }}
                    >
                        {`Semester: ${semester.quarter_range_name}`}
                    </Text>
                </View>
                <FlatList
                    ItemSeparatorComponent={() => {
                        return (
                            <View
                                style={{
                                    width: '100%',
                                    height: 5,
                                }}
                            />
                        )
                    }}
                    data={subjectList}
                    keyExtractor={(item) => item.event_id.toString()}
                    renderItem={({ item }) => {
                        return (
                            <TouchableOpacity
                                style={{
                                    width: '100%',
                                    height: 100,
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: item.event_color,
                                }}
                                onPress={() => {
                                    navigation.navigate('NewSchedule', {
                                        facility_id,
                                        dow,
                                        dow_name,
                                        startStr,
                                        endStr,
                                        event: item,
                                        time_range,
                                        semester,
                                        reloadSubject: this._getSubjectList.bind(this),
                                        reloadSchedule,
                                    })
                                }}
                            >
                                <Text>{item.event_title}</Text>
                                <Text>{item.event_note}</Text>
                            </TouchableOpacity>
                        )
                    }}
                    ListFooterComponent={() => {
                        return (
                            subjectList.length === 0 &&
                            !isLoading && (
                                <View
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: 20,
                                    }}
                                >
                                    <Text>No data found</Text>
                                </View>
                            )
                        )
                    }}
                />
                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate('NewSchedule', {
                            facility_id,
                            dow,
                            dow_name,
                            startStr,
                            endStr,
                            time_range,
                            semester,
                            reloadSubject: this._getSubjectList.bind(this),
                            reloadSchedule,
                        })
                    }}
                    style={{
                        width: 50,
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        right: 20,
                        bottom: 40,
                        backgroundColor: 'black',
                        borderRadius: 25,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 25,
                            fontWeight: 'bold',
                            color: 'white',
                        }}
                    >
                        +
                    </Text>
                </TouchableOpacity>
            </View>
        )
    }
}
