// route
const express = require('express')

const api = express.Router()
const auth = require('../../middlewares/auth')
const authAdmin = require('../../middlewares/admin-authen')
api.use('/auth', require('./auth'))

api.post('/admin/*', authAdmin.verifyAdmin)
api.use('/admin', require('./admin'))

api.post('*', auth.verifyToken)
api.use('/common', require('./common'))
api.use('/event', require('./event'))
api.use('/object', require('./object'))
api.use('/facility', require('./facility'))
api.use('/category', require('./category'))
api.use('/location', require('./location'))
api.use('/setting', require('./setting'))
api.use('/profile', require('./profile'))

module.exports = api
