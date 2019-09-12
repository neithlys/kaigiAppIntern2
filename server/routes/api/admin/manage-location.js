const express = require('express')

const router = express.Router()
const db = require('../../../services/postgre')

router.post('/list', (req, res) => {
    const { organization_id } = req.body.user
    const locationId = (req.body.location_id && req.body.location_id.length > 0 && req.body.location_id) || []
    const sql = `
        SELECT loc.*, use.lastname || ' ' || use.firstname as created_by_name
        FROM tbl_location loc
        INNER JOIN tbl_user use ON use.user_id = loc.created_by
        WHERE ${
            locationId.length > 0 ? `location_id IN (${locationId.join(', ')})` : 'TRUE'
        } AND loc.organization_id = ${organization_id} ORDER BY location_id`
    db.run(sql)
        .then((result) => {
            res.status(200).json({
                code: 0,
                data: result.rowCount > 0 ? result.rows : [],
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
    const object = {
        ...req.body.data,
        organization_id: req.body.user.organization_id,
        created_by: req.body.user.user_id,
    }
    const fieldName = Object.keys(object)
    const fieldValue = fieldName.map((item) => db.value(object[item]))
    const sql = `
        INSERT INTO tbl_location(${fieldName.join(', ')})
        VALUES(${fieldValue.join(', ')})
    `
    db.run(sql)
        .then((result) => {
            if (result.rowCount === 0) {
                throw new Error('')
            }
            return res.status(200).json({
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

router.post('/delete', (req, res) => {
    const { location_id } = req.body
    const sql = `
        UPDATE tbl_location
        SET activation = 0
        WHERE location_id = ${location_id}
    `
    if (typeof location_id !== 'number' || location_id < 0) {
        res.status(500).json({
            code: 1,
        })
    } else {
        db.run(sql)
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

router.post('/update', (req, res) => {
    const { data } = req.body
    data.updated_by = req.body.user.user_id
    db.update('tbl_location', data, `location_id = ${data.location_id}`)
        .then((result) => {
            return res.status(200).json({
                code: 0,
                result,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
            })
        })
})

module.exports = router
