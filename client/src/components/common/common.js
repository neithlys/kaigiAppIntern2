import Snackbar from 'react-native-snackbar'

const baseUrl = 'https://faas-csv.asia/'

const manualUrl = baseUrl + 'manual/mobile/'

const manualScheduleUrl = manualUrl + 'schedule/'

const manualCalendarUrl = manualUrl + 'calendar/'

const manualSettingUrl = manualUrl + 'setting/'

const showMessage = (
    message = '',
    type = 1,
    titleAction = 'OK',
    colorAction = 'white',
    isLong = false
) => {
    Snackbar.show({
        title: message,
        backgroundColor: type === 1 ? 'green' : 'red',
        duration: isLong ? Snackbar.LENGTH_LONG : Snackbar.LENGTH_SHORT,
        action: {
            title: titleAction,
            color: colorAction,
        },
        color: colorAction,
    })
}

const colorsList = [
    {
        id: 1,
        value: 'red',
    },
    {
        id: 2,
        value: 'orange',
    },
    {
        id: 3,
        value: 'yellow',
    },
    {
        id: 4,
        value: 'green',
    },
    {
        id: 5,
        value: 'blue',
    },
    {
        id: 6,
        value: 'indigo',
    },
    {
        id: 7,
        value: 'purple',
    },
    {
        id: 8,
        value: 'black',
    },
]

const days = [
    {
        day_id: -1,
        day_name: '',
    },
    {
        day_id: 1,
        day_name: 'MON',
    },
    {
        day_id: 2,
        day_name: 'TUE',
    },
    {
        day_id: 3,
        day_name: 'WED',
    },
    {
        day_id: 4,
        day_name: 'THU',
    },
    {
        day_id: 5,
        day_name: 'FRI',
    },
    {
        day_id: 6,
        day_name: 'SAT',
    },
]

const shortProfileSetting = {
    renew: 3,
    background: '0_0_background.jpg',
    event_type: [
        'calendar_my_event',
        'calendar_relative_event',
        'calendar_others_event',
        'calendar_has_temporariness_event',
    ],
    driver_type: ['schedule_internal_driver', 'schedule_temporary_driver'],
    event_color: {
        self: 'green',
        others: 'gray',
        relevant: 'blue',
        temporariness: '#802005',
    },
    facility_type: [
        'schedule_internal_facility',
        'schedule_temporary_facility',
    ],
    facility: {
        free: {
            color: 'blue',
        },
        busy: {
            color: 'red',
        },
    },
}

const longProfileSetting = {
    renew: 3,
    background: '0_0_background.jpg',
    event_type: [
        'calendar_my_event',
        'calendar_relative_event',
        'calendar_others_event',
        'calendar_has_temporariness_event',
    ],
    driver_type: ['schedule_internal_driver', 'schedule_temporary_driver'],
    event_color: {
        self: 'green',
        others: 'gray',
        relevant: 'blue',
        temporariness: '#802005',
    },
    facility_type: [
        'schedule_internal_facility',
        'schedule_temporary_facility',
    ],
    facility: {
        free: {
            color: 'blue',
        },
        busy: {
            color: 'red',
        },
        waiting: {
            color: '#008a00',
            timeBeforeEvent: 15,
        },
        entering: {
            color: '#fa6800',
            timeAfterEvent: 15,
        },
    },
}

const imagesManualSchedule = [
    `${manualScheduleUrl}schedule1.png`,
    `${manualScheduleUrl}schedule1.png`,
    `${manualScheduleUrl}schedule1.png`,
    `${manualScheduleUrl}schedule1.png`,
    `${manualScheduleUrl}schedule1.png`,
    `${manualScheduleUrl}schedule1.png`,
    `${manualScheduleUrl}schedule1.png`,
    `${manualScheduleUrl}schedule1.png`,
    `${manualScheduleUrl}schedule1.png`,
    `${manualScheduleUrl}schedule1.png`,
]

const imagesManualCalendar = [
    `${manualCalendarUrl}calendar1.png`,
    `${manualCalendarUrl}calendar1.png`,
    `${manualCalendarUrl}calendar1.png`,
    `${manualCalendarUrl}calendar1.png`,
    `${manualCalendarUrl}calendar1.png`,
    `${manualCalendarUrl}calendar1.png`,
    `${manualCalendarUrl}calendar1.png`,
    `${manualCalendarUrl}calendar1.png`,
    `${manualCalendarUrl}calendar1.png`,
    `${manualCalendarUrl}calendar1.png`,
]

const imagesManualSetting = [
    `${manualSettingUrl}setting1.png`,
    `${manualSettingUrl}setting1.png`,
    `${manualSettingUrl}setting1.png`,
    `${manualSettingUrl}setting1.png`,
    `${manualSettingUrl}setting1.png`,
    `${manualSettingUrl}setting1.png`,
    `${manualSettingUrl}setting1.png`,
    `${manualSettingUrl}setting1.png`,
    `${manualSettingUrl}setting1.png`,
    `${manualSettingUrl}setting1.png`,
    `${manualSettingUrl}setting1.png`,
]

const removeDuplicates = (myArr, prop) => {
    return myArr.filter((obj, pos, arr) => {
        return arr.map((mapObj) => mapObj[prop]).indexOf(obj[prop]) === pos
    })
}

export {
    showMessage,
    colorsList,
    days,
    removeDuplicates,
    shortProfileSetting,
    longProfileSetting,
    imagesManualSchedule,
    imagesManualCalendar,
    imagesManualSetting,
}
