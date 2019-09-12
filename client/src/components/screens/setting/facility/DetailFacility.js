import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Picker, ScrollView, Switch } from 'react-native'
import FloatingLabel from 'react-native-floating-labels'
import {
    insertAccount,
    insertLocation,
    getCategoryList,
    getLocationList,
    insertFacility,
    insertCategory,
    getPermissionList,
    getTimeRange,
    insertTimeRange,
} from '../../../../networking/service'
import HeaderDetail from './HeaderDetailFacility'
import AsyncStorage from '@react-native-community/async-storage'
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize'
import AppText from '../../../CustomText'
import moment from 'moment-timezone'
import DateTimePicker from 'react-native-modal-datetime-picker'
export default class DetailFacility extends Component {
    constructor(props) {
        super(props)
        this.state = {
            email: '',
            fname: '',
            lname: '',
            permission: '',
            lstPermit: [],
            phone: '',
            pass: '',
            confirmPass: '',
            locate: '',
            lstCate: [],
            lstLocate: [],
            category: '',
            Id: '',
            nameFacility: '',
            capacity: '',
            address: '',
            note: '',
            locateName: '',
            cateName: '',
            switch1: false,
            switch2: false,
            switch3: false,
            switch4: false,
            scheduleName: '',
            eventStart: moment().format('YYYY-MM-DD'),
            timeStart: moment().format('HH:mm'),
            eventEnd: moment()
                .add(1, 'days')
                .format('YYYY-MM-DD'),
            timeEnd: moment()
                .add(1, 'hours')
                .format('HH:mm'),
            isDateStart: false,
            isDateEnd: false,
            isTimeStart: false,
            isTimeEnd: false,
        }
    }

    componentWillMount = () => {
        getCategoryList().then((res) => {
            if (res.code === 0) {
                this.setState({ lstCate: res.data })
            } else this.setState({ lstCate: [] })
        })
        getLocationList().then((res) => {
            if (res.code === 0) {
                this.setState({ lstLocate: res.data })
            } else this.setState({ lstLocate: [] })
        })
        getPermissionList().then((res) => {
            // console.log(res.data)
            if (res.code === 0) {
                res.data.forEach((element) => {
                    element.permission_name_code =
                        element.permission_name_code
                            .slice(16)
                            .charAt(0)
                            .toUpperCase() + element.permission_name_code.slice(17)
                })
                this.setState({ lstPermit: res.data })
            } else
                this.setState({
                    lstPermit: [],
                })
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
        var newDate
        if (moment() <= moment(date)) {
            newDate = moment(date).format('YYYY-MM-DD')
        } else {
            // alert("Can't set time in past")
            newDate = moment().format('YYYY-MM-DD')
        }
        this.setState({ eventStart: newDate, isDateStart: !this.state.isDateStart })
    }

    handleDatePickedEnd = (date) => {
        var newDate
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

    _register = async () => {
        const { navigation } = this.props
        const title = navigation.getParam('title', 'NO-TITLE') + ''
        var user = await AsyncStorage.getItem('userInfo')
        user = JSON.parse(user)
        if (title === 'User') {
            if (this.state.pass === this.state.confirmPass) {
                var data = {
                    email: this.state.email,
                    password: this.state.pass,
                    confirmPassword: this.state.confirmPass,
                    firstname: this.state.fname,
                    lastname: this.state.lname,
                    phone_number: this.state.phone,
                    permission_code: this.state.permission,
                }
            } else {
                var data = {}
            }
            insertAccount(data).then((res) => {
                if (res.code === 0) {
                    this.setState({
                        email: '',
                        pass: '',
                        confirmPass: '',
                        fname: '',
                        lname: '',
                        phone: '',
                    })
                    alert('success')
                } else alert('Failed')
            })
        } else if (title === 'location') {
            var data = {
                location_name: this.state.locateName,
            }
            insertLocation(data).then((res) => {
                if (res.code === 0) {
                    this.setState({
                        locateName: '',
                    })
                    alert('success')
                } else alert('Failed')
            })
        } else if (title === 'Facility') {
            var data = {
                facility_code: this.state.Id,
                facility_name: this.state.nameFacility,
                facility_capacity: this.state.capacity,
                facility_address: this.state.address,
                location_id: this.state.locate,
                category_id: this.state.category,
                facility_note: this.state.note,
                organization_id: user.organization_id,
            }
            insertFacility(data).then((res) => {
                if (res.code === 0) {
                    this.setState({
                        Id: '',
                        nameFacility: '',
                        address: '',
                        capacity: '',
                        note: '',
                    })
                    alert('success')
                } else {
                    alert('Failed')
                }
            })
        } else if (title === 'category') {
            var need_driver = this.state.switch1 === false ? 0 : 1
            var is_equipment = this.state.switch2 === false ? 0 : 1
            var is_specialized = this.state.switch3 === false ? 0 : 1
            var need_equipment = this.state.switch4 === false ? 0 : 1
            var data = {
                organization_id: user.organization_id,
                category_name: this.state.cateName,
                need_equipment: need_equipment,
                is_specialized: is_specialized,
                is_equipment: is_equipment,
                need_driver: need_driver,
            }
            insertCategory(data).then((res) => {
                if (res.code === 0) {
                    this.setState({
                        cateName: '',
                    })
                    alert('success')
                } else {
                    alert('Failed')
                }
            })
        } else if (title === 'schedule') {
            var data = {
                time_range_name: this.state.scheduleName,
                time_range_start_ts: moment(this.state.timeStart, 'HH:mm:ssZ').format('HH:mm:ssZ'),
                time_range_end_ts: moment(this.state.timeEnd, 'HH:mm:ssZ').format('HH:mm:ssZ'),
                time_range_apply_from_ts: this.state.eventStart,
                time_range_apply_to_ts: this.state.eventEnd,
                time_range_created_at: moment().format(),
            }
            // console.log(data)
            insertTimeRange(data).then((res) => {
                if (res.code === 0) {
                    this.setState({
                        scheduleName: '',
                    })
                    alert('success')
                } else {
                    alert('Failed')
                }
            })
        }
    }

    render() {
        const { navigation } = this.props
        const title = navigation.getParam('title', 'NO-TITLE') + ''
        return (
            <View style={{ flex: 1 }}>
                <HeaderDetail headerName={title} navigation={this.props.navigation} />
                {title === 'User' ? (
                    <ScrollView>
                        <View style={styles.container}>
                            <FloatingLabel
                                labelStyle={styles.labelInput}
                                inputStyle={styles.input}
                                style={styles.formInput}
                                onChangeText={(email) => {
                                    this.setState({ email })
                                }}
                                value={this.state.email}>
                                <AppText i18nKey={'email'} />
                            </FloatingLabel>
                            <FloatingLabel
                                labelStyle={styles.labelInput}
                                inputStyle={styles.input}
                                style={styles.formInput}
                                onChangeText={(fname) => {
                                    this.setState({ fname })
                                }}
                                value={this.state.fname}>
                                <AppText i18nKey={'fname'} />
                            </FloatingLabel>
                            <FloatingLabel
                                labelStyle={styles.labelInput}
                                inputStyle={styles.input}
                                style={styles.formInput}
                                onChangeText={(lname) => {
                                    this.setState({ lname })
                                }}
                                value={this.state.lname}>
                                <AppText i18nKey={'lname'} />
                            </FloatingLabel>
                            <View
                                style={{
                                    height: 60,
                                    width: '80%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: 10,
                                    marginBottom: 10,
                                }}>
                                <Picker
                                    selectedValue={this.state.permission}
                                    style={{
                                        height: RFValue(100),
                                        width: '100%',
                                    }}
                                    itemStyle={{
                                        fontSize: RFValue(20),
                                        height: RFValue(100),
                                    }}
                                    onValueChange={(itemValue, itemIndex) => this.setState({ permission: itemValue })}>
                                    {this.state.lstPermit.map((value, index) => {
                                        return (
                                            <Picker.Item
                                                key={index}
                                                label={value.permission_name_code}
                                                value={value.permission_code}
                                            />
                                        )
                                    })}
                                </Picker>
                            </View>
                            <FloatingLabel
                                labelStyle={styles.labelInput}
                                inputStyle={styles.input}
                                style={styles.formInput}
                                onChangeText={(phone) => {
                                    this.setState({ phone })
                                }}
                                keyboardType={'numeric'}
                                value={this.state.phone}>
                                <AppText i18nKey={'phone'} />
                            </FloatingLabel>
                            <FloatingLabel
                                labelStyle={styles.labelInput}
                                inputStyle={styles.input}
                                style={styles.formInput}
                                onChangeText={(pass) => {
                                    this.setState({ pass })
                                }}
                                secureTextEntry={true}
                                value={this.state.pass}>
                                <AppText i18nKey={'password'} />
                            </FloatingLabel>
                            <FloatingLabel
                                labelStyle={styles.labelInput}
                                inputStyle={styles.input}
                                style={styles.formInput}
                                onChangeText={(confirmPass) => {
                                    this.setState({ confirmPass })
                                }}
                                secureTextEntry={true}
                                value={this.state.confirmPass}>
                                <AppText i18nKey={'confirmPass'} />
                            </FloatingLabel>
                            <TouchableOpacity style={styles.btnSubmit} onPress={this._register}>
                                <Text style={styles.btnContent}>
                                    <AppText i18nKey={'signUp'} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                ) : title === 'location' ? (
                    <View style={styles.container}>
                        <FloatingLabel
                            labelStyle={styles.labelInput}
                            inputStyle={styles.input}
                            style={styles.formInput}
                            onChangeText={(locateName) => {
                                this.setState({ locateName })
                            }}
                            value={this.state.locateName}>
                            <AppText i18nKey={'locateName'} />
                        </FloatingLabel>
                        <TouchableOpacity style={styles.btnSubmit} onPress={this._register}>
                            <Text style={styles.btnContent}>
                                <AppText i18nKey={'addLocation'} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : title === 'Facility' ? (
                    <ScrollView>
                        <View style={styles.container}>
                            <View
                                style={{
                                    height: 60,
                                    width: '80%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: 10,
                                    marginBottom: 10,
                                }}>
                                <Picker
                                    selectedValue={this.state.category}
                                    style={{
                                        height: RFValue(100),
                                        width: '100%',
                                    }}
                                    itemStyle={{
                                        fontSize: RFValue(20),
                                        height: RFValue(100),
                                    }}
                                    onValueChange={(itemValue, itemIndex) => this.setState({ category: itemValue })}>
                                    {this.state.lstCate.map((value, index) => {
                                        return (
                                            <Picker.Item
                                                key={index}
                                                label={value.category_name}
                                                value={value.category_id}
                                            />
                                        )
                                    })}
                                </Picker>
                            </View>
                            <FloatingLabel
                                labelStyle={styles.labelInput}
                                inputStyle={styles.input}
                                style={styles.formInput}
                                onChangeText={(Id) => {
                                    this.setState({ Id })
                                }}
                                value={this.state.Id}>
                                <AppText i18nKey={'ID'} />
                            </FloatingLabel>
                            <FloatingLabel
                                labelStyle={styles.labelInput}
                                inputStyle={styles.input}
                                style={styles.formInput}
                                onChangeText={(nameFacility) => {
                                    this.setState({ nameFacility })
                                }}
                                value={this.state.nameFacility}>
                                <AppText i18nKey={'name'} />
                            </FloatingLabel>
                            <FloatingLabel
                                labelStyle={styles.labelInput}
                                inputStyle={styles.input}
                                style={styles.formInput}
                                onChangeText={(capacity) => {
                                    this.setState({ capacity })
                                }}
                                value={this.state.capacity}
                                keyboardType={'numeric'}>
                                <AppText i18nKey={'Capacity'} />
                            </FloatingLabel>
                            <View
                                style={{
                                    height: 60,
                                    width: '80%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: 10,
                                    marginBottom: 10,
                                }}>
                                <Picker
                                    selectedValue={this.state.locate}
                                    style={{
                                        height: RFValue(100),
                                        width: '100%',
                                    }}
                                    itemStyle={{
                                        fontSize: RFValue(20),
                                        height: RFValue(100),
                                    }}
                                    onValueChange={(itemValue, itemIndex) => this.setState({ locate: itemValue })}>
                                    {this.state.lstLocate.map((value, index) => {
                                        return (
                                            <Picker.Item
                                                key={index}
                                                label={value.location_name}
                                                value={value.location_id}
                                            />
                                        )
                                    })}
                                </Picker>
                            </View>
                            <FloatingLabel
                                labelStyle={styles.labelInput}
                                inputStyle={styles.input}
                                style={styles.formInput}
                                onChangeText={(address) => {
                                    this.setState({ address })
                                }}
                                value={this.state.address}>
                                <AppText i18nKey={'Address'} />
                            </FloatingLabel>
                            <FloatingLabel
                                labelStyle={styles.labelInput}
                                inputStyle={styles.input}
                                style={styles.formInput}
                                onChangeText={(note) => {
                                    this.setState({ note })
                                }}
                                value={this.state.note}>
                                <AppText i18nKey={'note'} />
                            </FloatingLabel>
                            <TouchableOpacity style={styles.btnSubmit} onPress={this._register}>
                                <Text style={styles.btnContent}>
                                    <AppText i18nKey={'addFacility'} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                ) : title === 'category' ? (
                    <View style={styles.container}>
                        <FloatingLabel
                            labelStyle={styles.labelInput}
                            inputStyle={styles.input}
                            style={styles.formInput}
                            onChangeText={(cateName) => {
                                this.setState({ cateName })
                            }}
                            value={this.state.cateName}>
                            <AppText i18nKey={'cateName'} />
                        </FloatingLabel>
                        <View
                            style={{ width: '80%', flexDirection: 'row', margin: 10, justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 20 }}>
                                <AppText i18nKey={'needDriver'} />
                            </Text>
                            <Switch
                                onValueChange={() => this.setState({ switch1: !this.state.switch1 })}
                                value={this.state.switch1}
                            />
                        </View>
                        <View
                            style={{ width: '80%', flexDirection: 'row', margin: 10, justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 20 }}>
                                <AppText i18nKey={'isEquipment'} />
                            </Text>
                            <Switch
                                onValueChange={() => this.setState({ switch2: !this.state.switch2 })}
                                value={this.state.switch2}
                            />
                        </View>
                        <View
                            style={{ width: '80%', flexDirection: 'row', margin: 10, justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 20 }}>
                                <AppText i18nKey={'isSpecialized'} />
                            </Text>
                            <Switch
                                onValueChange={() => this.setState({ switch3: !this.state.switch3 })}
                                value={this.state.switch3}
                            />
                        </View>
                        <View
                            style={{ width: '80%', flexDirection: 'row', margin: 10, justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 20 }}>
                                <AppText i18nKey={'needEquipment'} />
                            </Text>
                            <Switch
                                onValueChange={() => this.setState({ switch4: !this.state.switch4 })}
                                value={this.state.switch4}
                            />
                        </View>
                        <TouchableOpacity style={styles.btnSubmit} onPress={this._register}>
                            <Text style={styles.btnContent}>
                                <AppText i18nKey={'addCategory'} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.container}>
                        <FloatingLabel
                            labelStyle={styles.labelInput}
                            inputStyle={styles.input}
                            style={styles.formInput}
                            onChangeText={(scheduleName) => {
                                this.setState({ scheduleName })
                            }}
                            value={this.state.scheduleName}>
                            <AppText i18nKey={'scheduleName'} />
                        </FloatingLabel>

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
                                <AppText i18nKey={'start'} />:
                            </Text>
                            {/* <View>
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
                                    minimumDate={new Date()} //chi dung dc cho ios
                                />
                            </View> */}
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
                                <AppText i18nKey={'end'} />:
                            </Text>
                            {/* <View>
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
                            </View> */}
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
                        <TouchableOpacity style={styles.btnSubmit} onPress={this._register}>
                            <Text style={styles.btnContent}>
                                <AppText i18nKey={'addSchedule'} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        height: 60,
        paddingBottom: 10,
        fontSize: 20,
        borderWidth: 0,
        borderBottomWidth: 1.5,
        borderBottomColor: 'black',
    },
    labelInput: {
        color: 'grey',
    },
    formInput: {
        marginBottom: 20,
        width: '80%',
        borderColor: 'black',
    },
    btnSubmit: {
        marginTop: 10,
        height: 45,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        width: 250,
        borderRadius: 30,
        backgroundColor: '#00BFFF',
    },
    btnContent: {
        fontSize: 20,
        color: 'white',
        textAlign: 'center',
    },
})
