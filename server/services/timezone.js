const moment = require('moment-timezone')

const toTimeZone = (beforeTime = moment(), timezone = '+07:00', dateFormat = 'YYYY-MM-DD', timeFormat = 'HH:mm:ss') => {
    const operator = timezone.slice(0, 1)
    const hour = Number(timezone.slice(1, 3))
    const minute = Number(timezone.slice(4))
    const afterTime = moment(beforeTime)
        .utc()
        .add(Number(operator + hour), 'hour')
        .add(Number(operator + minute), 'minute')
    return moment(`${afterTime.format(dateFormat)}T${afterTime.format(timeFormat)}${timezone}`)
}

module.exports = toTimeZone
