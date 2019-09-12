const express = require('express')

const router = express.Router()

router.get('/test', (req, res) =>
    res.status(200).json({
        code: 0,
    })
)

router.get('/download-manual', (req, res) => {
    const fileName = `./public/manual/FaaS Management System Manual Version 1.0.docx`
    res.download(fileName, (err) => {
        if (err) {
            throw err
        }
    })
})

module.exports = router
