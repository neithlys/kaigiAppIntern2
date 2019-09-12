const express = require('express')
const moment = require('moment-timezone')

const router = express.Router()
const db = require('../../../services/postgre')

router.post('/list', (req, res) => {
    const { time_range_activation } = req.body
    // const { organization_id } = req.body.user
    let sql1 = ` WHERE time_range_activation is true `
    if (!time_range_activation) {
        sql1 = ` `
    }
    const sql = `
        SELECT *
        FROM tbl_time_range
       ${sql1}
    `
    db.run(sql)
        .then((result) => {
            return res.status(200).json({
                code: 0,
                data: result.rows,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
            })
        })
})

router.post('/insert', (req, res) => {
    const { user_id } = req.body.user
    const { data } = req.body
    /*
        Kiểm tra xem có tồn tại mốc thời gian sắp thêm vào chưa ( theo thời gian và theo kỳ )
    */
    // const start_time = moment(data.time_range_start_ts).format('HH:mm:SS')
    // const end_time = moment(data.time_range_start_ts).format('HH:mm:SS')
    const sql = `
        SELECT *
        FROM  tbl_time_range
        WHERE ('${data.time_range_start_ts}':: time with time zone,
                '${data.time_range_end_ts}':: time with time zone )
                OVERLAPS ("time_range_start_ts","time_range_end_ts" )
        AND   (date '${data.time_range_apply_from_ts}'- (1 || 'days')::interval,
            date '${data.time_range_apply_to_ts}'+ (1 || 'days')::interval )
            OVERLAPS ("time_range_apply_from_ts","time_range_apply_to_ts" )
        `

    return db.run(sql).then((result) => {
        if (result.rowCount > 0) {
            return res.status(500).json({
                code: 1,
            })
        }
        data.time_range_created_by = user_id
        data.time_range_created_at = moment().format()
        return db
            .insert('tbl_time_range', [data])
            .then(() => {
                return res.status(200).json({
                    code: 0,
                })
            })
            .catch((error) => {
                return res.status(500).json({
                    code: 2,
                    error,
                })
            })
    })
})

router.post('/update', (req, res) => {
    const { user_id } = req.body.user
    const { data } = req.body
    /*
        Kiểm tra xem có tồn tại mốc thời gian sắp thêm vào chưa ( theo thời gian và theo kỳ )
    */
    // const start_time = moment(data.time_range_start_ts).format('HH:mm:SS')
    // const end_time = moment(data.time_range_start_ts).format('HH:mm:SS')
    const sql = `
        SELECT *
        FROM  tbl_time_range
        WHERE ('${data.time_range_start_ts}':: time with time zone,
                '${data.time_range_end_ts}':: time with time zone )
                OVERLAPS ("time_range_start_ts","time_range_end_ts" )
        AND   (date '${data.time_range_apply_from_ts}'- (1 || 'days')::interval,
            date '${data.time_range_apply_to_ts}'+ (1 || 'days')::interval )
            OVERLAPS ("time_range_apply_from_ts","time_range_apply_to_ts" )
        AND time_range_id != ${data.time_range_id}
        `

    return db.run(sql).then((result) => {
        if (result.rowCount > 0) {
            return res.status(500).json({
                code: 1,
            })
        }
        data.time_range_updated_by = user_id
        data.time_range_updated_at = moment().format()
        return db
            .update('tbl_time_range', data, `time_range_id = ${data.time_range_id}`)
            .then(() => {
                return res.status(200).json({
                    code: 0,
                })
            })
            .catch((error) => {
                return res.status(500).json({
                    code: 2,
                    error,
                })
            })
    })
})

router.post('/delete', (req, res) => {
    // const { organization_id } = req.body.user
    const { data } = req.body
    const params = {
        time_range_id: data.time_range_id,
        time_range_activation: false,
    }
    if (data.time_range_activation) {
        params.time_range_activation = true
    }
    return db
        .update('tbl_time_range', params, `time_range_id = ${data.time_range_id}`)
        .then(() => {
            return res.status(200).json({
                code: 0,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 2,
                error,
            })
        })
})

module.exports = router
