// route
const express = require('express')

const router = express.Router()
const path = require('path')
const errorHandler = require('../middlewares/error-handler')

router.use('/public', require('./public'))
router.use('/api', require('../routes/api'))

router.get('/*', (req, res) => res.sendFile(path.join(__dirname, '../web/index.html')))
router.get(/.*/, (req, res) =>
    res.status(404).json({
        error: 404,
    })
)

router.use(errorHandler)

module.exports = router
