// route
const express = require('express')

const router = express.Router()
const db = require('../../../services/postgre')

router.post('/insert', (req, res) => {
    const object = req.body.data
    const fieldName = Object.keys(object)
    const fieldValue = fieldName.map((item) => db.value(object[item]))
    db.run(`INSERT INTO tbl_object (${fieldName.join(', ')}) VALUES (${fieldValue.join(', ')})`)
        .then((result) => {
            if (result.rowCount === 0) throw new Error('')
            else
                res.status(200).json({
                    code: 0,
                })
        })
        .catch((error) =>
            res.status(500).json({
                code: 1,
                error,
            })
        )
})

// config router here
router.post('/list', (req, res) => {
    const objectId = (req.body.object_id && req.body.object_id.length > 0 && req.body.object_id) || []
    db.select(
        'tbl_object',
        '*',
        `${objectId.length > 0 ? `object_id IN (${objectId.join(', ')})` : 'TRUE'} ORDER BY object_id`
    )
        .then((result) => {
            res.status(200).json({
                code: 0,
                data: result.rowCount > 0 ? result.rows : [],
            })
        })
        .catch((error) =>
            res.status(500).json({
                code: 1,
                data: [],
                error,
            })
        )
})

router.post('/delete', (req, res) => {
    const { object_id } = req.body
    if (typeof object_id !== 'number' || object_id < 0) {
        res.status(500).json({
            code: 1,
        })
    } else {
        db.delete('tbl_object', `object_id = ${object_id}`)
            .then((result) => {
                if (result.rowCount === 0) throw new Error('')
                else
                    res.status(200).json({
                        code: 0,
                    })
            })
            .catch((error) =>
                res.status(500).json({
                    code: 1,
                    error,
                })
            )
    }
})

module.exports = router
