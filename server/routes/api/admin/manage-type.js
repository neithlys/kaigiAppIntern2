// route
const express = require('express')

const router = express.Router()

const db = require('../../../services/postgre')

router.post('/list', (req, res) => {
    const typeId = (req.body.object_type_id && req.body.object_type_id.length > 0 && req.body.object_type_id) || []
    db.select(
        'tbl_object_type',
        '*',
        `${typeId.length > 0 ? `object_type_id IN (${typeId.join(', ')})` : 'TRUE'} ORDER BY object_type_id`
    )
        .then((result) => {
            const data = result.rowCount === 0 ? [] : result.rows
            res.status(200).json({
                code: 0,
                data,
            })
        })
        .catch((error) => {
            res.status(500).json({
                code: 1,
                data: [],
                error,
            })
        })
})

router.post('/insert', (req, res) => {
    const typeObject = req.body.data
    const fieldName = Object.keys(typeObject)
    const fieldValue = fieldName.map((item) => db.value(typeObject[item]))
    db.run(`INSERT INTO tbl_object_type (${fieldName.join(', ')}) VALUES (${fieldValue.join(', ')})`)
        .then((result) => {
            if (result.rowCount === 0) throw new Error('No data was added')
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

router.post('/update', (req, res) => {
    const typeObject = req.body.data
    if (typeof typeObject.object_type_id !== 'number' || typeObject.object_type_id < 0) {
        res.status(500).json({
            code: 1,
        })
    } else {
        db.update('tbl_object_type', typeObject, `object_type_id = ${typeObject.object_type_id}`)
            .then((result) => {
                if (result.rowCount === 0) throw new Error('No data was updated')
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

router.post('/delete', (req, res) => {
    const { object_type_id } = req.body
    if (typeof object_type_id !== 'number' || object_type_id < 0) {
        res.status(500).json({
            code: 1,
        })
    } else {
        db.delete('tbl_object_type', `object_type_id = ${object_type_id}`)
            .then((result) => {
                if (result.rowCount === 0) throw new Error('No data was deleted')
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
