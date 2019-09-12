import React, { Component } from 'react'
import { Text, View, FlatList, TouchableOpacity } from 'react-native'
import HeaderSemester from './HeaderSemester'

export default class SemesterScreen extends Component {
    constructor(props) {
        super(props)
        this.semesters = this.props.navigation.state.params.semesters
        this.state = {
            currentSemester: this.props.navigation.state.params.currentSemester,
        }
    }

    render() {
        const { currentSemester } = this.state
        const { navigation } = this.props
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgb(230, 230, 230)',
                }}
            >
                <HeaderSemester
                    headerName="Semester"
                    navigation={navigation}
                    callBack={() => {
                        this.props.navigation.state.params.changeSemester(this.state.currentSemester)
                    }}
                />

                <View
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 5,
                        padding: 5,
                        flex: 1,
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
                                            currentSemester: item,
                                        })
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {item.quarter_range_name}
                                    </Text>
                                </TouchableOpacity>
                            )
                        }}
                    />
                </View>
            </View>
        )
    }
}
