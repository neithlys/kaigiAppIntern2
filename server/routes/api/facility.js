// route
const express = require('express')
const moment = require('moment-timezone')

const router = express.Router()
const postgre = require('../../services/postgre')

// get list of all facility
router.get('/', (req, res) => {
    const { organization_id } = req.body.user
    const sql = `
        SELECT f.*, tf.tbl_temporary_facility_faclitity_name as temporary_facility_name, tf.tbl_temporary_facility_facility_code as temporary_facility_code
        FROM tbl_facility f
        LEFT JOIN tbl_temporary_facility tf ON tf.tbl_temporary_facility_faclitity_id = f.facility_id AND (tbl_temporary_facility_from::TIMESTAMP with time zone, tbl_temporary_facility_to::date)
            OVERLAPS
        (now()::TIMESTAMP with time zone, now()::TIMESTAMP with time zone)
        WHERE f.organization_id = ${organization_id}
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

// get 1 facility by id
router.get('/:facility_id', (req, res) => {
    const { facility_id } = req.params
    postgre
        .select('tbl_facility', '*', `facility_id = ${Number(facility_id)}`)
        .then(({ rows }) =>
            res.json({
                data: (rows.length > 0 && rows[0]) || null,
            })
        )
        .catch((err) =>
            res.json({
                code: 1,
                err,
            })
        )
})

// get list of all facility with current status
router.post('/status', (req, res) => {
    const { user, role } = req.body
    const { organization_id } = req.body.user
    const now = req.body.now ? req.body.now : moment().format()
    // const ev = `
    //     SELECT
    //     facility_id,
    //     json_agg(row_to_json((SELECT r FROM (SELECT
    //     event_id,
    //     event_title,
    //     e.start,
    //     e.end,
    //     e.user_id,
    //     e.status_code,
    //     u.email
    //     ) r ORDER BY e.start::timestamp with time zone))) as event_list
    //     FROM v_event e
    //     LEFT JOIN tbl_user u ON u.user_id = e.user_id
    //     WHERE is_deleted = false
    //     GROUP BY facility_id
    // `
    const ev = `
        SELECT
            facility_id,
            json_agg(
                row_to_json(
                    (
                        SELECT
                            r
                        FROM (
                            SELECT
                                event_id,
                                event_title,
                                e.start,
                                e.end,
                                e.user_id,
                                e.status_code,
                                u.email,
                                IS_MEMBER(${user.user_id}, e.event_id) as role
                        ) r
                        ORDER BY e.start::timestamp with time zone
                    )
                )
            ) as event_list
        FROM v_event e
        LEFT JOIN tbl_user u ON u.user_id = e.user_id
        WHERE is_deleted = false
        AND (timestamp with time zone '${now}' , timestamp with time zone '${now}'
        + (${user.waiting} || ' minutes')::interval)
                OVERLAPS
            (e.start::timestamp with time zone, e.end::timestamp with time zone)
         AND   ${
             role !== null && role !== undefined
                 ? ` IS_MEMBER(${user.user_id}, e.event_id) IN  (${role.join(', ')}) `
                 : ` TRUE  `
         }

        GROUP BY facility_id
    `

    const schedule = `
        SELECT
            td.tbl_temporary_driver_id as temporary_driver,
            (
                CASE
                    WHEN td.tbl_temporary_driver_id is null THEN driver_name
                    WHEN td.tbl_temporary_driver_driver_id_internal IS NOT NULL THEN u.lastname || ' ' || u.firstname
                    ELSE td.tbl_temporary_driver_driver_name
                END
            ) as driver_name,
            (
                CASE
                    WHEN td.tbl_temporary_driver_id is null THEN driver_phone
                    WHEN td.tbl_temporary_driver_driver_id_internal IS NOT NULL THEN u.phone_number
                    ELSE td.tbl_temporary_driver_driver_phone
                END
            ) as driver_phone,
            facility_id,
            schedule_id,
            s.driver_id as driver_id,
            td.tbl_temporary_driver_driver_id_internal
        FROM (
            SELECT (CASE WHEN s.temporary_driver IS TRUE THEN s.temporary_driver_name ELSE lastname || ' ' || firstname END) as driver_name, (CASE WHEN s.temporary_driver IS TRUE THEN s.temporary_driver_phone ELSE phone_number END) as driver_phone, facility_id, schedule_id, u.user_id as driver_id, tbl_schedule_booked_date_from_ts, tbl_schedule_booked_date_to_ts
            FROM tbl_user u
            LEFT JOIN tbl_schedule s ON s.user_id = u.user_id
            WHERE booked_date::date = '${now}'::date
                AND u.activation = 1
        ) as s
        LEFT JOIN tbl_temporary_driver td ON (tbl_temporary_driver_from_ts::TIMESTAMP WITH TIME ZONE, tbl_temporary_driver_to_ts ::TIMESTAMP WITH TIME ZONE)
            OVERLAPS
        (tbl_schedule_booked_date_from_ts::TIMESTAMP WITH TIME ZONE, tbl_schedule_booked_date_to_ts::TIMESTAMP WITH TIME ZONE)
            AND ('${now}' BETWEEN tbl_temporary_driver_from_ts AND tbl_temporary_driver_to_ts) AND ('${now}' BETWEEN tbl_schedule_booked_date_from_ts::TIMESTAMP WITH TIME ZONE AND tbl_schedule_booked_date_to_ts::TIMESTAMP WITH TIME ZONE)
            AND td.tbl_temporary_driver_driver_id = s.driver_id
        LEFT JOIN tbl_user u ON u.user_id = td.tbl_temporary_driver_driver_id_internal
    `

    const query = `
        SELECT
            f.facility_id,
            (
                CASE
                    WHEN tf.tbl_temporary_facility_id IS NULL THEN f.facility_code
                    WHEN tf.tbl_temporary_facility_facility_id_internal IS NOT NULL THEN f_i.facility_code
                    ELSE tf.tbl_temporary_facility_facility_code
                END
            ) as facility_code,
            (
                CASE
                    WHEN tf.tbl_temporary_facility_id IS NULL THEN f.facility_name
                    WHEN tf.tbl_temporary_facility_facility_id_internal IS NOT NULL THEN f_i.facility_name
                    ELSE tf.tbl_temporary_facility_facility_name
                END
            ) as facility_name,
            f.facility_capacity,
            f.category_id,
            f.location_id,
            f.facility_image_url,
            ev.event_list,
            c.is_specialized,
            c.need_driver,
            c.need_schedule,
            now() as status_at,
            sche.driver_name,
            sche.driver_phone,
            sche.schedule_id,
            sche.driver_id,
            (tf.tbl_temporary_facility_id IS NOT NULL) AS temporary_facility
        FROM tbl_facility f
        INNER JOIN tbl_organization organ ON organ.organization_id = ${organization_id}
        LEFT JOIN (${ev}) ev ON (
            ev.facility_id = f.facility_id

        )
        LEFT JOIN (${schedule}) sche ON sche.facility_id = f.facility_id
        LEFT JOIN tbl_category c ON c.category_id = f.category_id
        LEFT JOIN tbl_temporary_facility tf ON
            (tbl_temporary_facility_from_ts::TIMESTAMP with time zone, tbl_temporary_facility_to_ts::TIMESTAMP with time zone)
                OVERLAPS
            ('${now}'::TIMESTAMP with time zone, '${now}'::TIMESTAMP with time zone)
            AND tf.tbl_temporary_facility_facility_id = f.facility_id
        LEFT JOIN tbl_facility f_i ON f_i.facility_id = tf.tbl_temporary_facility_facility_id_internal
        WHERE f.organization_id = ${organization_id} AND f.facility_activation = 1
        ORDER BY f.facility_id
    `

    postgre
        .run(query)
        .then(({ rows }) => {
            res.json({
                code: 0,
                data: rows,
            })
        })
        .catch((err) => {
            res.json({
                code: 1,
                err,
            })
        })
})

module.exports = router
