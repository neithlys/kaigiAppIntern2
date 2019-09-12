// route
const express = require('express')

const router = express.Router()
const moment = require('moment-timezone')
const postgre = require('../../services/postgre')

router.post('/user-list', (req, res) => {
    const { organization_id } = req.body.user

    postgre
        .select(
            'tbl_user',
            'user_id, email, firstname, lastname',
            `activation = 1 AND permission_code <> 100 AND organization_id = ${organization_id}`
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

router.post('/available-user-for-event', (req, res) => {
    // const { start, end, event_id } = req.body
    const { user } = req.body

    postgre
        .select(
            'tbl_user',
            'user_id, email, firstname, lastname',
            `activation = 1 AND permission_code != '100' AND permission_code != '00' AND organization_id = ${user.organization_id}`
        )
        .then((result2) => {
            res.status(200).json({
                code: 0,
                data: result2.rowCount > 0 ? result2.rows : [],
            })
        })
        .catch((error) => {
            res.status(500).json({
                code: 1,
                data: [],
                error,
            })
        })

    // postgre
    //     .select(
    //         'v_event',
    //         'joiner_list_ids',
    //         `
    //         (timestamp with time zone '${start}' - (${
    //             user.waiting
    //         } || ' minutes')::interval, timestamp with time zone '${end}' + (${user.entering} || ' minutes')::interval)
    //         OVERLAPS
    //         ("start"::timestamp with time zone, "end"::timestamp with time zone)
    //         AND is_deleted = false
    //         AND ${event_id ? `event_id != ${event_id}` : 'TRUE'}
    //     `
    //     )
    //     .then((result1) => {
    //         let busyUsers = []
    //         const array = result1.rowCount > 0 ? result1.rows.map((e1) => e1.joiner_list_ids.map((e) => e.user_id)) : []
    //         array.forEach((element) => {
    //             busyUsers = busyUsers.concat(element)
    //         })
    //         if (user.permission_code !== '99' && user.permission_code !== '100') {
    //             busyUsers = busyUsers.concat([user.user_id])
    //         }
    //         busyUsers = Array.from(new Set(busyUsers))
    //         postgre
    //             .select(
    //                 'tbl_user',
    //                 'user_id, email, firstname, lastname',
    //                 `${
    //                     busyUsers.length !== 0 ? `user_id NOT IN (${busyUsers.join(', ')})` : 'TRUE'
    //                 } AND activation = 1 AND permission_code != '100' AND permission_code != '00' AND organization_id = ${
    //                     user.organization_id
    //                 }`
    //             )
    //             .then((result2) => {
    //                 res.status(200).json({
    //                     code: 0,
    //                     data: result2.rowCount > 0 ? result2.rows : [],
    //                 })
    //             })
    //             .catch((error) => {
    //                 res.status(500).json({
    //                     code: 1,
    //                     data: [],
    //                     error,
    //                 })
    //             })
    //     })
    //     .catch((error) => {
    //         res.status(500).json({
    //             code: 1,
    //             data: [],
    //             error,
    //         })
    //     })
})

router.post('/events-with-time', (req, res) => {
    const { start, end, facility_id, event_id, user } = req.body
    const condition1 = event_id !== '' ? ` event_id <> ${event_id}` : ' TRUE'
    const condition2 = `
        (
        (timestamp with time zone '${start}'- (${user.waiting} || ' minutes')::interval, timestamp with time zone '${end}' + (${user.entering} || ' minutes')::interval)
            OVERLAPS
        (start_ts::timestamp with time zone, end_ts::timestamp with time zone)
        )
        AND
        facility_id = ${facility_id}
        AND ${condition1}
        AND is_deleted = false
    `

    const sql = `
        SELECT *
        FROM (
            SELECT *
            FROM v_event
            WHERE
               ${condition2}
        ) v
        FULL OUTER JOIN (
            SELECT *
            FROM tbl_temporary_facility
            WHERE
            (tbl_temporary_facility_facility_id_internal = ${facility_id})
                AND (tbl_temporary_facility_from_ts::TIMESTAMP WITH TIME ZONE, tbl_temporary_facility_to_ts ::TIMESTAMP WITH TIME ZONE)
                OVERLAPS
                (TIMESTAMP WITH TIME ZONE '${start}'- (${user.waiting} || ' minutes')::interval,TIMESTAMP WITH TIME ZONE '${end}' + (${user.entering} || ' minutes')::interval)
        ) e ON e.tbl_temporary_facility_facility_id_internal = v.facility_id
    `
    postgre
        .run(sql)
        .then((result1) => {
            res.status(200).json({
                code: 0,
                data: result1.rowCount > 0 ? result1.rows : [],
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

router.post('/facility-list', (req, res) => {
    const { organization_id, organization_timezone_name } = req.body.user
    const need_driver = req.body.params && req.body.params.need_driver ? req.body.params.need_driver : null
    const need_equipment = req.body.params && req.body.params.need_equipment ? req.body.params.need_equipment : null
    const is_equipment = req.body.params && req.body.params.is_equipment ? req.body.params.is_equipment : null
    const is_specialized = req.body.params && req.body.params.is_specialized ? req.body.params.is_specialized : null
    const others = req.body.params && req.body.params.others ? req.body.params.others : null
    const now = (req.body.params && req.body.params.now ? moment(req.body.params.now) : moment())
        .tz(organization_timezone_name)
        .format('YYYY-MM-DD')
    const sql = `
        SELECT
        facility.*,
        (u.lastname || ' '::text) || u.firstname AS facility_default_driver_name,
        (u.phone_number) AS facility_default_driver_phone
        FROM (
        SELECT f.*, c.equipments, c.is_specialized, c.need_equipment, c.need_driver,c.is_equipment, u.user_id, u.email, (u.lastname || ' '::text) || u.firstname AS owner_name
        FROM tbl_facility f ,tbl_category c, tbl_user u
        WHERE f.organization_id = ${organization_id}
            AND f.facility_activation = 1
            ${need_driver !== null ? ` AND c.need_driver = ${need_driver} ` : ' '}
            ${need_equipment !== null ? ` AND c.need_equipment = ${need_equipment} ` : ' '}
            ${is_equipment !== null ? ` AND c.is_equipment = ${is_equipment} ` : ' '}
            ${is_specialized !== null ? ` AND c.is_specialized = ${is_specialized} ` : ' '}
            ${others !== null ? ` AND c.need_equipment != ${others} AND c.need_driver != ${others} ` : ' '}
        AND f.category_id = c.category_id AND u.user_id = f.facility_created_by
        ) as facility
        LEFT JOIN (
        SELECT sc_gp.facility_id as facility_id, user_id as facility_default_driver_id
        FROM (
            SELECT facility_id, max(from_date) as from_date
            FROM tbl_schedule_contract
            WHERE from_date::date <= '${now}'::date
            GROUP BY facility_id
            ORDER BY from_date
        ) sc_gp
        INNER JOIN tbl_schedule_contract sc ON sc.facility_id = sc_gp.facility_id AND sc.from_date = sc_gp.from_date
        ) sc ON sc.facility_id = facility.facility_id
        LEFT JOIN tbl_user u ON u.user_id = sc.facility_default_driver_id
        ORDER BY facility.facility_id
    `
    return postgre
        .run(sql)
        .then((result) => {
            return res.status(200).json({
                code: 0,
                data: result.rowCount > 0 ? result.rows : [],
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                data: [],
                error,
            })
        })
})

router.post('/category-list', (req, res) => {
    const { organization_id } = req.body.user
    postgre
        .select(
            'tbl_category',
            'category_id,category_name',
            `organization_id=${organization_id} AND activation = 1 AND is_equipment = 1 `
        )
        .then(({ rows }) =>
            res.json({
                code: 0,
                data: rows,
            })
        )
        .catch((err) =>
            res.json({
                code: 1,
                err,
            })
        )
})

router.post('/notifications-list', (req, res) => {
    // const { organization_id } = req.body.user
    const sql = `
        SELECT *
        FROM tbl_notifications
        WHERE notifications_is_read = false
        AND notifications_is_show = true
        ORDER BY notifications_created_at DESC
    `

    postgre
        .run(sql)
        .then(({ rows }) =>
            res.json({
                code: 0,
                data: rows,
            })
        )
        .catch((err) =>
            res.json({
                code: 1,
                err,
            })
        )
})

router.post('/check-notifications-list', (req, res) => {
    const { notifications_id } = req.body
    const sql = `
        UPDATE tbl_notifications
        SET notifications_is_read = true
        WHERE notifications_id = ${notifications_id}
    `

    postgre
        .run(sql)
        .then(({ rows }) =>
            res.json({
                code: 0,
                data: rows,
            })
        )
        .catch((err) =>
            res.json({
                code: 1,
                err,
            })
        )
})

router.post('/un-show-notifications-list', (req, res) => {
    const sql = `
        UPDATE tbl_notifications
        SET notifications_is_show = false
    `

    postgre
        .run(sql)
        .then(({ rows }) =>
            res.json({
                code: 0,
                data: rows,
            })
        )
        .catch((err) =>
            res.json({
                code: 1,
                err,
            })
        )
})

router.post('/get-quarters-list', (req, res) => {
    const query = `
        SELECT *
        FROM tbl_quarter_range
    `

    postgre
        .run(query)
        .then((result) =>
            res.status(200).json({
                code: 0,
                data: result.rows,
            })
        )
        .catch((error) => {
            res.status(500).json({
                code: 1,
                error,
            })
        })
})

router.post('/get-time-ranges-list', (req, res) => {
    const { time_range_activation } = req.body
    // const { organization_id } = req.body.user
    let sql1 = ` WHERE time_range_activation = true `
    if (!time_range_activation) {
        sql1 = ` `
    }

    const sql = `
        SELECT *
        FROM tbl_time_range
        ${sql1}
    `

    postgre
        .run(sql)
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

module.exports = router
