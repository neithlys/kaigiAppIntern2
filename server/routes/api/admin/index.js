// route
const express = require('express')

const api = express.Router()

// config router here
api.use('/manage-object', require('./manage-object'))
api.use('/manage-account', require('./manage-account'))
api.use('/manage-type', require('./manage-type'))
api.use('/manage-facility', require('./manage-facility'))
api.use('/manage-schedule', require('./manage-schedule'))
api.use('/manage-category', require('./manage-category'))
api.use('/manage-location', require('./manage-location'))
api.use('/manage-status', require('./manage-status'))
api.use('/manage-time-range', require('./manage-time-range'))
api.use('/manage-profile', require('./manage-profile'))
api.use('/manage-setting', require('./manage-setting'))

module.exports = api
