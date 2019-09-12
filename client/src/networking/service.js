import AsyncStorage from '@react-native-community/async-storage'
import moment from 'moment-timezone'

const urlApi = 'http://192.168.11.114:3003/api'

// const urlApiOld = "https://faas-csv.asia:443/api";
async function login(email, pass) {
    try {
        const response = await fetch(`${urlApi}/auth/login`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password: pass,
            }),
        })
        const responseJson = await response.json()
        return responseJson
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function verify() {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/auth/verify-token`, {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
        })
        const responseJson = await response.json()
        if (responseJson.err !== undefined) {
            return {
                code: 1,
                user: [],
            }
        }
        return {
            code: 0,
            user: responseJson.user,
        }
    } catch (error) {
        return {
            code: 1,
            user: [],
            error,
        }
    }
}
async function getLocationList() {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/admin/manage-location/list`, {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function locationList() {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/location/list`, {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
        })
        const responseJson = await response.json()
        return responseJson
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}
async function getRoomList(filter) {
    const userToken = await AsyncStorage.getItem('userToken')
    const curDate = moment().format()
    try {
        // get color tu api setting
        const responseSetting = await fetch(`${urlApi}/setting`, {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
        })
        const responseJsonSetting = await responseSetting.json()
        // get room status tu API
        const response = await fetch(`${urlApi}/facility/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify(filter),
        })
        const responseJson = await response.json()

        // xu ly
        //
        const data = responseJson.data.map((e) => {
            let status = 'AVAILABLE'
            let { color } = responseJsonSetting.defaultSetting.facility.free
            if (e.event_list !== null) {
                e.event_list.forEach((event) => {
                    if (moment(event.start).format() <= curDate && curDate <= moment(event.end).format()) {
                        status = 'USING'
                        color = responseJsonSetting.defaultSetting.facility.busy.color
                    } else {
                        status = 'AVAILABLE'
                        color = responseJsonSetting.defaultSetting.facility.free.color
                    }
                })
            }

            return {
                ...e,
                status,
                color,
            }
        })
        // responseJson.data.forEach((statusFacility) => {
        //     if (statusFacility.event_list !== null) {
        //         statusFacility.event_list.forEach((event) => {
        //             if (moment(event.start).format() <= curDate && curDate <= moment(event.end).format()) {
        //                 statusFacility.status = 'USING'
        //                 statusFacility.color = responseJsonSetting.defaultSetting.facility.busy.color
        //             } else {
        //                 statusFacility.status = 'AVAILABLE'
        //                 statusFacility.color = responseJsonSetting.defaultSetting.facility.free.color
        //             }
        //         })
        //     } else {
        //         statusFacility.status = 'AVAILABLE'
        //         statusFacility.color = responseJsonSetting.defaultSetting.facility.free.color
        //     }
        // })
        //
        return {
            code: 0,
            data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function getCategoryList() {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/admin/manage-category/list`, {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function categoryList() {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/category/list`, {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
        })
        const responseJson = await response.json()
        return responseJson
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function getStatusRoom() {
    const userToken = await AsyncStorage.getItem('userToken')
    const now = moment().format('YYYY-MM-DD')
    try {
        const response = await fetch(`${urlApi}/facility/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                now,
            }),
        })
        const responseJson = await response.json()
        return {
            code: 0,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function getEventFacility(filter) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/event/list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                filter,
            }),
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function getSemester(filter) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/common/get-quarters-list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                filter,
            }),
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function getTimeRanges(filter, isSetting = false) {
    const userToken = await AsyncStorage.getItem('userToken')
    const api = !isSetting ? `${urlApi}/common/get-time-ranges-list` : `${urlApi}/admin/manage-time-range/list`
    try {
        const response = await fetch(`${urlApi}/common/get-time-ranges-list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                filter,
            }),
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function deleteTimeRange(data) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        let response = await fetch(urlApi + '/admin/manage-time-range/delete', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                data: data,
            }),
        })
        let responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
        }
    }
}

async function updateTimeRange(data) {
    const userToken = await AsyncStorage.getItem('userToken')
    // console.log(data)
    try {
        let response = await fetch(urlApi + '/admin/manage-time-range/update', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                data: data,
            }),
        })
        let responseJson = await response.json()
        // console.log(responseJson)
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
        }
    }
}

async function getUserAvailable(start, end, eventId) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/common/available-user-for-event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                start,
                end,
                event_id: eventId,
            }),
        })
        const responseJson = await response.json()
        return {
            code: 0,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function getUserAccount() {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/admin/manage-account/list`, {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
        })
        const responseJson = await response.json()
        return {
            code: 0,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function getSetting() {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const responseSetting = await fetch(`${urlApi}/setting`, {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
        })
        const responseJsonSetting = await responseSetting.json()
        return {
            code: 0,
            data: responseJsonSetting.defaultSetting,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function checkEventWithTime(start, end, facilityId, eventId) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/common/events-with-time`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                start,
                end,
                facility_id: facilityId,
                event_id: eventId,
            }),
        })

        const responseJson = await response.json()

        return {
            code: 0,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function addEvent(event) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/event/add`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                event,
                check_category: [],
            }),
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function addSubject(events) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/event/add-subject`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                events,
                check_category: [],
            }),
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function updateSetting(data, organization_id) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const formData = new FormData()
        formData.append('data', JSON.stringify(data))
        formData.append('organization_id', JSON.stringify(organization_id))
        let responseSetting = await fetch(urlApi + '/setting/update', {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
            body: formData,
        })
        let responseJsonSetting = await responseSetting.json()
        // console.log(responseJsonSetting)
        return {
            code: 0,
            data: responseJsonSetting,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
        }
    }
}

async function updateSubject(params) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/event/update-subject`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify(params),
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function deleteSubject(params) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/event/delete-subject`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify(params),
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function joinSubject(params) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/event/join-subject`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify(params),
        })
        const responseJson = await response.json()
        console.log(responseJson)
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function updateCategory(data) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const formData = new FormData()
        formData.append('data', JSON.stringify(data))
        const response = await fetch(`${urlApi}/admin/manage-category/update`, {
            method: 'POST',
            headers: {
                'Content-type': 'multipart/form-data',
                Authorization: userToken,
            },
            body: formData,
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function updateUser(data) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/admin/manage-account/update`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                data,
            }),
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function updateFacility(data) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const formData = new FormData()
        formData.append('data', JSON.stringify(data))
        const response = await fetch(`${urlApi}/admin/manage-facility/update`, {
            method: 'POST',
            headers: {
                'Content-type': 'multipart/form-data',
                Authorization: userToken,
            },
            body: formData,
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function updateLocation(data) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/admin/manage-location/update`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                data,
            }),
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function getFacilityList() {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/admin/manage-facility/list`, {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
        })
        const responseJson = await response.json()
        //
        return {
            code: 0,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function insertAccount(data) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/admin/manage-account/insert`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                data,
            }),
        })
        const responseJson = await response.json()
        return responseJson
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function insertFacility(data) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const formData = new FormData()
        formData.append('data', JSON.stringify(data))
        const response = await fetch(`${urlApi}/admin/manage-facility/insert`, {
            method: 'POST',
            headers: {
                'Content-type': 'multipart/form-data',
                Authorization: userToken,
            },
            body: formData,
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function insertCategory(data) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const formData = new FormData()
        formData.append('data', JSON.stringify(data))
        const response = await fetch(`${urlApi}/admin/manage-category/insert`, {
            method: 'POST',
            headers: {
                'Content-type': 'multipart/form-data',
                Authorization: userToken,
            },
            body: formData,
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function insertLocation(data) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/admin/manage-location/insert`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                data,
            }),
        })
        const responseJson = await response.json()

        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function getPermissionList() {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/admin/manage-account/permission-list`, {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function getProfile() {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/profile`, {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
        })
        const responseJson = await response.json()
        return {
            code: 0,
            data: responseJson.personal,
            setting: responseJson.setting,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function updateProfile(data, setting = null) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const formData = new FormData()
        formData.append('personal', JSON.stringify(data))
        if (setting) {
            formData.append('setting', JSON.stringify(setting))
        }
        const response = await fetch(`${urlApi}/profile/update`, {
            method: 'POST',
            headers: {
                Authorization: userToken,
            },
            body: formData,
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.personal,
            setting: responseJson.setting,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function editEvent(event) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/event/edit`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                event,
                check_category: [],
            }),
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function deleteEvent(event_id, user) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/event/remove`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                user,
                event_id,
            }),
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

async function joinEvent(event) {
    const userToken = await AsyncStorage.getItem('userToken')
    try {
        const response = await fetch(`${urlApi}/event/join-event`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: userToken,
            },
            body: JSON.stringify({
                event,
            }),
        })
        const responseJson = await response.json()
        return {
            code: responseJson.code,
            data: responseJson.data,
        }
    } catch (error) {
        return {
            code: 1,
            data: [],
            error,
        }
    }
}

export {
    getRoomList,
    getLocationList,
    login,
    verify,
    getCategoryList,
    getStatusRoom,
    getUserAvailable,
    getSetting,
    getUserAccount,
    checkEventWithTime,
    addEvent,
    updateCategory,
    updateUser,
    updateFacility,
    getEventFacility,
    getFacilityList,
    updateLocation,
    insertAccount,
    insertLocation,
    insertFacility,
    insertCategory,
    getPermissionList,
    getProfile,
    updateProfile,
    editEvent,
    deleteEvent,
    categoryList,
    locationList,
    addSubject,
    joinEvent,
    joinSubject,
    updateSubject,
    deleteSubject,
    getTimeRanges,
    getSemester,
    updateSetting,
}
