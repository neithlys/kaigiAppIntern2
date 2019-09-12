// route
const express = require('express')
const moment = require('moment-timezone')
const pg = require('../../../services/postgre')

const router = express.Router()

router.post('/list', (req, res) => {
    const { start_filter, end_filter, facility_id, user_id, filter, defaultDate } = req.body.params
    const { organization_id } = req.body.user
    const sql = `
        SELECT
            s.*,
            td.tbl_temporary_driver_id as temporary_driver,
            (
                CASE WHEN tdf.tbl_temporary_driver_id is null THEN driver_name
                    WHEN tdf.tbl_temporary_driver_driver_id_internal IS NOT NULL THEN u.lastname || ' ' || u.firstname
                    ELSE tdf.tbl_temporary_driver_driver_name
                END
            ) as temporary_driver_name,
            (
                CASE WHEN tdf.tbl_temporary_driver_id is null THEN driver_phone
                    WHEN tdf.tbl_temporary_driver_driver_id_internal IS NOT NULL THEN u.phone_number
                    ELSE tdf.tbl_temporary_driver_driver_phone
                END
            ) as temporary_driver_phone,
            schedule_id,
            s.driver_id as driver_id,
            s.temporary_driver as external_driver,
            s.temporary_driver_name as external_driver_name,
            s.temporary_driver_phone as external_driver_phone,
            td.tbl_temporary_driver_driver_id_internal,
            td.*,
            (
                CASE
                WHEN td.tbl_temporary_driver_id is null THEN 0
                ELSE 1
                END
            ) as rank
        FROM (
            SELECT fac.facility_id,
                fac.organization_id,
                fac.facility_code,
                fac.facility_name,
                tbl_schedule.user_id as driver_id,
                booked_date,
                (
                    CASE
                        WHEN tbl_schedule.user_id != -1 THEN tbl_user.lastname || ' ' || tbl_user.firstname
                        ELSE tbl_schedule.temporary_driver_name
                    END
                ) as driver_name,
                color_code,
                schedule_id,
                (
                    CASE
                        WHEN tbl_schedule.user_id != -1 THEN tbl_user.phone_number
                        ELSE tbl_schedule.temporary_driver_name
                    END
                ) as driver_phone,
                temporary_driver,
                temporary_driver_name,
                temporary_driver_phone,
                is_fake_driver,
                tbl_schedule_booked_date_from_ts,
                tbl_schedule_booked_date_to_ts
            FROM tbl_schedule
            LEFT JOIN tbl_user ON tbl_schedule.user_id = tbl_user.user_id
            INNER JOIN tbl_facility fac ON fac.facility_id = tbl_schedule.facility_id
            AND fac.facility_id = ${facility_id === -1 ? ' fac.facility_id ' : facility_id}
            AND tbl_schedule.user_id = ${user_id === -1 ? ' tbl_schedule.user_id ' : user_id}
            AND
                ('${start_filter}'::TIMESTAMP WITH TIME ZONE, '${end_filter}'::TIMESTAMP WITH TIME ZONE)
                    OVERLAPS
                (tbl_schedule_booked_date_from_ts::timestamp with time zone, tbl_schedule_booked_date_to_ts::timestamp with time zone)
            ) as s
        LEFT JOIN (
            SELECT td2.*
            FROM tbl_temporary_driver td2
            INNER JOIN (
                SELECT MIN(tbl_temporary_driver_from_ts) as tbl_temporary_driver_from_ts
                FROM tbl_temporary_driver
                GROUP BY tbl_temporary_driver_from_ts::date
            ) td1 ON td1.tbl_temporary_driver_from_ts = td2.tbl_temporary_driver_from_ts
        ) td ON
        (tbl_temporary_driver_from_ts::TIMESTAMP WITH TIME ZONE, tbl_temporary_driver_to_ts ::TIMESTAMP WITH TIME ZONE)
            OVERLAPS
        (tbl_schedule_booked_date_from_ts::TIMESTAMP WITH TIME ZONE, tbl_schedule_booked_date_to_ts::TIMESTAMP WITH TIME ZONE)
            AND td.tbl_temporary_driver_driver_id = s.driver_id

        LEFT JOIN (
            SELECT *
            FROM tbl_temporary_driver
            WHERE ("tbl_temporary_driver_from_ts"::TIMESTAMP WITH TIME ZONE,
                    "tbl_temporary_driver_to_ts" ::TIMESTAMP WITH TIME ZONE)
                OVERLAPS
                    (
                        '${defaultDate}'::TIMESTAMP WITH TIME ZONE,
                        '${defaultDate}'::TIMESTAMP WITH TIME ZONE
                    )
        ) tdf ON
            (tdf.tbl_temporary_driver_from_ts::TIMESTAMP WITH TIME ZONE, tdf.tbl_temporary_driver_to_ts ::TIMESTAMP WITH TIME ZONE)
                OVERLAPS
            (tbl_schedule_booked_date_from_ts::TIMESTAMP WITH TIME ZONE, tbl_schedule_booked_date_to_ts::TIMESTAMP WITH TIME ZONE)
                AND tdf.tbl_temporary_driver_driver_id = s.driver_id
        LEFT JOIN tbl_user u ON u.user_id = tdf.tbl_temporary_driver_driver_id_internal
        WHERE s.organization_id = '${organization_id}'
    `

    return pg
        .run(sql)
        .then((result) => {
            let data = []
            if (result.rowCount > 0) {
                data = result.rows.map((e) => {
                    let backgroundColor = 'green'
                    if (e.temporary_driver || e.external_driver) {
                        backgroundColor = '#802005'
                    }

                    return {
                        id: e.schedule_id,
                        title: e.temporary_driver ? e.temporary_driver_name : e.driver_name,
                        backgroundColor,
                        allDay: false,
                        start: e.tbl_schedule_booked_date_from_ts,
                        end: e.tbl_schedule_booked_date_to_ts,
                        facility_id: e.facility_id,
                        facility_code: e.facility_code,
                        facility_name: e.facility_name,
                        driver_id: e.driver_id,
                        driver_name: e.temporary_driver ? e.temporary_driver_name : e.driver_name,
                        driver_phone: e.temporary_driver ? e.temporary_driver_phone : e.driver_phone,
                        temporary_driver: !!e.temporary_driver || e.external_driver,
                        temporary_driver_name: e.temporary_driver_name,
                        temporary_driver_phone: e.temporary_driver_phone,
                        external_driver: e.external_driver,
                        external_driver_name: e.external_driver_name,
                        external_driver_phone: e.external_driver_phone,
                        is_fake_driver: !!e.is_fake_driver,
                        rank: e.rank,
                    }
                })
            }
            if (!filter.includes('internal-driver')) {
                data = data.filter((e) => {
                    return e.temporary_driver
                })
            }
            if (!filter.includes('temporary-driver')) {
                data = data.filter((e) => {
                    return !e.temporary_driver
                })
            }
            return res.status(200).json({
                code: 0,
                data,
            })
        })
        .catch((err) => {
            return res.status(500).json({
                code: 1,
                err,
            })
        })
})

router.post('/insert', (req, res) => {
    const { facility_id, user_id, booked_date } = req.body.params
    const sql1 = `
        SELECT *
        FROM tbl_schedule
        WHERE
        user_id = ${user_id}
        AND booked_date = '${booked_date}'
    `
    pg.run(sql1)
        .then((result1) => {
            if (result1.rowCount === 0) {
                const sql2 = `
                    INSERT INTO tbl_schedule(facility_id, user_id, booked_date)
                    VALUES (${facility_id}, ${user_id}, '${booked_date}')
                `
                return pg.run(sql2).then(() => {
                    return res.status(200).json({
                        code: 0,
                    })
                })
            }
            return res.status(200).json({
                code: 1,
            })
        })
        .catch((err) => {
            return res.status(500).json({
                code: 1,
                err,
            })
        })
})

router.post('/drivers-list', (req, res) => {
    const { organization_id } = req.body.user
    const sql = `
        SELECT firstname, lastname, email, phone_number, user_id as driver_id, is_fake_driver, td.tbl_temporary_driver_id as temporary_driver, td.tbl_temporary_driver_driver_name as temporary_driver_name, td.tbl_temporary_driver_driver_phone as temporary_driver_phone
        FROM tbl_user u
        LEFT JOIN tbl_temporary_driver td ON (tbl_temporary_driver_from::date, (tbl_temporary_driver_to + ((1 || 'days')::interval))::date)
            OVERLAPS
        (now()::date, now()::date) AND td.tbl_temporary_driver_driver_id = u.user_id
        WHERE activation = 1 AND permission_code = '00' AND organization_id = ${organization_id} AND is_fake_driver = 0
        ORDER BY driver_id
    `
    pg.run(sql)
        .then((result) => {
            return res.status(200).json({
                code: 0,
                data: result.rowCount > 0 ? result.rows : [],
            })
        })
        .catch((err) => {
            return res.status(500).json({
                code: 1,
                err,
            })
        })
})

router.post('/remove', (req, res) => {
    const { schedule_id } = req.body.params

    const sql3 = `
        DELETE FROM tbl_schedule
        WHERE schedule_id = ${schedule_id}
    `
    return pg
        .run(sql3)
        .then(() => {
            return res.status(200).json({
                code: 0,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
            })
        })
})

router.post('/remove-no-schedule', (req, res) => {
    const { booked_date_from, booked_date_to, facility_id } = req.body.params

    const sql3 = `
        DELETE FROM tbl_schedule
        WHERE facility_id = ${facility_id}
        AND booked_date::date <= '${booked_date_to}'::date AND booked_date >= '${booked_date_from}'::date
    `
    return pg
        .run(sql3)
        .then(() => {
            return res.status(200).json({
                code: 0,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
            })
        })
})

router.post('/update', (req, res) => {
    const { organization_timezone_name } = req.body.user

    const {
        driver_id,
        schedule_id,
        booked_date,
        facility_id,
        temporary_driver,
        temporary_driver_phone,
        temporary_driver_name,
    } = req.body.params

    const previous_booked_date =
        req.body.params.previous_booked_date !== undefined ? req.body.params.previous_booked_date : null

    const previous_temporary_driver =
        req.body.params.previous_temporary_driver !== undefined ? req.body.params.previous_temporary_driver : null

    const previous_temporary_driver_name =
        req.body.params.previous_temporary_driver_name !== undefined
            ? req.body.params.previous_temporary_driver_name
            : null

    const previous_temporary_driver_phone =
        req.body.params.previous_temporary_driver_phone !== undefined
            ? req.body.params.previous_temporary_driver_phone
            : null

    if (
        previous_booked_date === booked_date &&
        previous_temporary_driver === temporary_driver &&
        previous_temporary_driver_name === temporary_driver_name &&
        previous_temporary_driver_phone === temporary_driver_phone
    ) {
        return res.status(200).json({
            code: -1,
        })
    }

    const booked_date_from_moment = moment(booked_date).tz(organization_timezone_name)
    // const booked_date_to_moment = moment(booked_date_to)
    //     .utc()
    //     .add(Number(timezone), 'hour')
    //     .add(23, 'hour')
    //     .add(45, 'minutes')
    const booked_date_to_moment = moment(booked_date)
        .tz(organization_timezone_name)
        .add(23, 'hour')
        .add(45, 'minutes')

    const sql1 = `
        SELECT *
        FROM (
            SELECT *
            FROM tbl_schedule s
            LEFT JOIN tbl_temporary_driver td ON td.tbl_temporary_driver_driver_id_internal = s.user_id
            WHERE
            (
                facility_id = ${facility_id}
                AND ("tbl_schedule_booked_date_from_ts"::TIMESTAMP WITH TIME ZONE, "tbl_schedule_booked_date_to_ts" ::TIMESTAMP WITH TIME ZONE)
                    OVERLAPS
                (
                    '${booked_date_from_moment.format()}'::TIMESTAMP WITH TIME ZONE,
                    '${booked_date_to_moment.format()}'::TIMESTAMP WITH TIME ZONE
                )
            )
            OR
            (
                ${
                    driver_id === -1
                        ? ' FALSE '
                        : `
                            user_id = ${driver_id}
                            AND ("tbl_schedule_booked_date_from_ts"::TIMESTAMP WITH TIME ZONE, "tbl_schedule_booked_date_to_ts"::TIMESTAMP WITH TIME ZONE)
                                OVERLAPS
                            (
                                '${booked_date_from_moment.format()}'::TIMESTAMP WITH TIME ZONE,
                                '${booked_date_to_moment.format()}'::TIMESTAMP WITH TIME ZONE
                            )
                        `
                }
            )
            OR
            (
                td.tbl_temporary_driver_id IS NOT NULL
                AND
                ("tbl_temporary_driver_from_ts"::TIMESTAMP WITH TIME ZONE, "tbl_temporary_driver_to_ts"::TIMESTAMP WITH TIME ZONE)
                    OVERLAPS
                (
                    '${booked_date_from_moment.format()}'::TIMESTAMP WITH TIME ZONE,
                    '${booked_date_to_moment.format()}'::TIMESTAMP WITH TIME ZONE
                )
            )
        ) sc
        FULL OUTER JOIN (
            SELECT *
            FROM tbl_temporary_driver td
            WHERE td.tbl_temporary_driver_driver_id_internal = ${driver_id}
            AND ("tbl_temporary_driver_from_ts"::TIMESTAMP WITH TIME ZONE, "tbl_temporary_driver_to_ts"::TIMESTAMP WITH TIME ZONE)
                OVERLAPS
            (
                '${booked_date_from_moment.format()}'::TIMESTAMP WITH TIME ZONE,
                '${booked_date_to_moment.format()}'::TIMESTAMP WITH TIME ZONE
            )
        ) td1 ON td1.tbl_temporary_driver_driver_id_internal = sc.user_id
    `

    const sql3 = `
        UPDATE tbl_schedule
        SET booked_date = '${booked_date}', facility_id = ${facility_id}, user_id = ${driver_id}, temporary_driver = ${temporary_driver}, temporary_driver_name = '${temporary_driver_name}', temporary_driver_phone = '${temporary_driver_phone}', tbl_schedule_booked_date_from_ts = '${booked_date_from_moment.format()}', tbl_schedule_booked_date_to_ts = '${booked_date_to_moment.format()}'
        WHERE schedule_id = ${schedule_id}
    `

    return pg
        .run(sql1)
        .then((result1) => {
            if (result1.rowCount === 0) {
                return pg.run(sql3).then(() => {
                    return res.status(200).json({
                        code: 0,
                    })
                })
            }

            return res.status(200).json({
                code: 1,
            })
        })
        .catch((err3) => {
            return res.status(500).json({
                code: 0,
                err3,
            })
        })
})

router.post('/add', (req, res) => {
    const {
        driver_id,
        facility_id,
        temporary_driver,
        temporary_driver_phone,
        temporary_driver_name,
        booked_date_from,
        booked_date_to,
        // tbl_schedule_booked_date_from_ts,
        // tbl_schedule_booked_date_to_ts,
    } = req.body.params
    const { organization_timezone_name } = req.body.user
    const timezone = '+07'
    // const booked_date_from_moment = moment(booked_date_from)
    //     .utc()
    //     .add(Number(timezone), 'hour')
    const booked_date_from_moment = moment(booked_date_from).tz(organization_timezone_name)
    // const booked_date_to_moment = moment(booked_date_to)
    //     .utc()
    //     .add(Number(timezone), 'hour')
    //     .add(23, 'hour')
    //     .add(45, 'minutes')
    const booked_date_to_moment = moment(booked_date_to)
        .tz(organization_timezone_name)
        .add(23, 'hour')
        .add(45, 'minutes')

    const dates = booked_date_to_moment.diff(booked_date_from_moment, 'days') + 1

    const sql1 = `
        SELECT *
        FROM (
            SELECT *
            FROM tbl_schedule s
            LEFT JOIN tbl_temporary_driver td ON td.tbl_temporary_driver_driver_id_internal = s.user_id
            WHERE
            (
                facility_id = ${facility_id}
                AND ("tbl_schedule_booked_date_from_ts"::TIMESTAMP WITH TIME ZONE, "tbl_schedule_booked_date_to_ts" ::TIMESTAMP WITH TIME ZONE)
                    OVERLAPS
                (
                    '${booked_date_from_moment.format()}'::TIMESTAMP WITH TIME ZONE,
                    '${booked_date_to_moment.format()}'::TIMESTAMP WITH TIME ZONE
                )
            )
            OR
            (
                ${
                    driver_id === -1
                        ? ' FALSE '
                        : `
                            user_id = ${driver_id}
                            AND ("tbl_schedule_booked_date_from_ts"::TIMESTAMP WITH TIME ZONE, "tbl_schedule_booked_date_to_ts"::TIMESTAMP WITH TIME ZONE)
                                OVERLAPS
                            (
                                '${booked_date_from_moment.format()}'::TIMESTAMP WITH TIME ZONE,
                                '${booked_date_to_moment.format()}'::TIMESTAMP WITH TIME ZONE
                            )
                        `
                }
            )
            OR
            (
                td.tbl_temporary_driver_id IS NOT NULL
                AND
                ("tbl_temporary_driver_from_ts"::TIMESTAMP WITH TIME ZONE, "tbl_temporary_driver_to_ts"::TIMESTAMP WITH TIME ZONE)
                    OVERLAPS
                (
                    '${booked_date_from_moment.format()}'::TIMESTAMP WITH TIME ZONE,
                    '${booked_date_to_moment.format()}'::TIMESTAMP WITH TIME ZONE
                )
            )
        ) sc
        FULL OUTER JOIN (
            SELECT *
            FROM tbl_temporary_driver td
            WHERE td.tbl_temporary_driver_driver_id_internal = ${driver_id}
            AND ("tbl_temporary_driver_from_ts"::TIMESTAMP WITH TIME ZONE, "tbl_temporary_driver_to_ts"::TIMESTAMP WITH TIME ZONE)
                OVERLAPS
            (
                '${booked_date_from_moment.format()}'::TIMESTAMP WITH TIME ZONE,
                '${booked_date_to_moment.format()}'::TIMESTAMP WITH TIME ZONE
            )
        ) td1 ON td1.tbl_temporary_driver_driver_id_internal = sc.user_id
    `

    let insertData = []
    for (let date = 0; date < dates; date += 1) {
        const booked_date_moment = moment(booked_date_from)
            .utc()
            .add(Number(timezone), 'hour')
            .add(date, date > 1 ? 'days' : 'day')

        const booked_date_start_ts_moment = moment(booked_date_from)
            .utc()
            .add(Number(timezone), 'hour')
            .add(date, date > 1 ? 'days' : 'day')

        const booked_date_to_ts_moment = moment(booked_date_from)
            .utc()
            .add(Number(timezone), 'hour')
            .add(date, date > 1 ? 'days' : 'day')
            .add(23, 'hours')
            .add(45, 'minutes')
            .add(0, 'seconds')

        const eachData = [
            facility_id,
            driver_id,
            temporary_driver,
            temporary_driver_name === '' ? `''` : `'${temporary_driver_name}'`,
            temporary_driver_phone === '' ? `''` : `'${temporary_driver_phone}'`,
            `'${booked_date_from_moment.format('YYYY-MM-DD')}'`,
            `'${booked_date_to_moment.format('YYYY-MM-DD')}'`,
            `'${booked_date_moment.format('YYYY-MM-DD')}'`,
            `'${moment(
                `${booked_date_start_ts_moment.format('YYYY-MM-DD')}T${booked_date_start_ts_moment.format(
                    'HH:mm:ss'
                )}${timezone}:00`
            ).format()}'`,
            `'${moment(
                `${booked_date_to_ts_moment.format('YYYY-MM-DD')}T${booked_date_to_ts_moment.format(
                    'HH:mm:ss'
                )}${timezone}:00`
            ).format()}'`,
        ]
        insertData.push(eachData)
    }
    insertData = insertData.map((e) => `(${e.join(',')})`)
    return pg
        .run(sql1)
        .then((result1) => {
            if (result1.rowCount === 0) {
                const sql2 = `
          INSERT INTO tbl_schedule(facility_id, user_id, temporary_driver, temporary_driver_name, temporary_driver_phone, booked_date_from, booked_date_to, booked_date, tbl_schedule_booked_date_from_ts, tbl_schedule_booked_date_to_ts)
          VALUES ${insertData.join(', ')}
        `

                pg.run(sql2).then(() => {
                    return res.status(200).json({
                        code: 0,
                    })
                })

                return
            }

            res.status(200).json({
                code: 1,
            })
        })
        .catch((err) => {
            return res.status(500).json({
                code: 1,
                err,
            })
        })
})

router.post('/get-schedule-contract', (req, res) => {
    return res.status(200)
})

router.post('/temporary-driver-list', (req, res) => {
    const driver_id = req.body.data

    // const query = `
    //     SELECT td2.*,
    //     td1.json,
    //     td2.tbl_temporary_driver_from_ts::date as tbl_temporary_driver_from_date
    //     FROM tbl_temporary_driver td2
    //     INNER JOIN (
    //     SELECT
    //         MIN(tbl_temporary_driver_from_ts) as tbl_temporary_driver_from_ts,
    //         array_to_json(
    //         (
    //             SELECT array_agg(
    //             (
    //                 SELECT
    //                 td4
    //             )
    //             )

    //         )
    //         ,
    //         true
    //         ) as json
    //     FROM (
    //         SELECT
    //         td3.*,
    //         (CASE WHEN td3.tbl_temporary_driver_driver_id_internal is null THEN td3.tbl_temporary_driver_driver_name ELSE (u.lastname || ' ' || u.firstname) END) as tbl_temporary_driver_driver_name,
    //         (CASE WHEN td3.tbl_temporary_driver_driver_id_internal is null THEN td3.tbl_temporary_driver_driver_phone ELSE (u.phone_number) END) as tbl_temporary_driver_driver_phone
    //         FROM tbl_temporary_driver td3
    //         LEFT JOIN tbl_user u ON u.user_id = td3.tbl_temporary_driver_driver_id_internal
    //         ORDER BY td3.tbl_temporary_driver_from_ts
    //     ) td4
    //     GROUP BY td4.tbl_temporary_driver_from_ts::date
    //     ) td1 ON td1.tbl_temporary_driver_from_ts = td2.tbl_temporary_driver_from_ts
    //     WHERE td2.tbl_temporary_driver_driver_id = ${driver_id}
    //     ORDER BY td2.tbl_temporary_driver_from_ts
    // `

    const query = `
        SELECT td2.*,
            (CASE WHEN td2.tbl_temporary_driver_driver_id_internal is null THEN td2.tbl_temporary_driver_driver_name ELSE (u.lastname || ' ' || u.firstname) END) as tbl_temporary_driver_driver_name,
            (CASE WHEN td2.tbl_temporary_driver_driver_id_internal is null THEN td2.tbl_temporary_driver_driver_phone ELSE (u.phone_number) END) as tbl_temporary_driver_driver_phone
        FROM
            tbl_temporary_driver td2
        LEFT JOIN tbl_user u ON u.user_id = td2.tbl_temporary_driver_driver_id_internal
        WHERE td2.tbl_temporary_driver_driver_id = ${driver_id}
        ORDER BY td2.tbl_temporary_driver_from_ts
    `

    pg.run(query)
        .then(({ rows }) => {
            return res.status(200).json({
                code: 0,
                data: rows,
            })
        })
        .catch((err) => {
            return res.status(500).json({
                code: 1,
                err,
            })
        })
})

router.post('/insert-temporary-driver', (req, res) => {
    // const timezone = '+07'
    const { data } = req.body
    const { startTS, endTS, driver_phone, driver_name, driver_id, driver_id_internal } = data
    const { organization_timezone_name } = req.body.user
    // const start_ts_moment = moment(
    //     `${moment(startTS)
    //         .utc()
    //         .add(Number(timezone), 'hour')
    //         .format('YYYY-MM-DD')}T${moment(startTS)
    //         .utc()
    //         .add(Number(timezone), 'hour')
    //         .format('HH:mm:ss')}${timezone}:00`
    // )
    const start_ts_moment = moment(startTS).tz(organization_timezone_name)
    // const end_ts_moment = moment(
    //     `${moment(endTS)
    //         .utc()
    //         .add(Number(timezone), 'hour')
    //         .format('YYYY-MM-DD')}T${moment(endTS)
    //         .utc()
    //         .add(Number(timezone), 'hour')
    //         .format('HH:mm:ss')}${timezone}:00`
    // )
    const end_ts_moment = moment(endTS).tz(organization_timezone_name)
    const sql1 = `
        SELECT *
        FROM tbl_temporary_driver
        WHERE tbl_temporary_driver_driver_id = ${driver_id}
        AND (tbl_temporary_driver_from_ts::TIMESTAMP WITH TIME ZONE, tbl_temporary_driver_to_ts::TIMESTAMP WITH TIME ZONE)
        OVERLAPS
        ('${start_ts_moment.format()}'::TIMESTAMP WITH TIME ZONE, '${end_ts_moment.format()}'::TIMESTAMP WITH TIME ZONE)
    `

    const sql2 = `
        SELECT *
        FROM tbl_schedule
        WHERE user_id = ${driver_id_internal}
        AND (tbl_schedule_booked_date_from_ts::TIMESTAMP WITH TIME ZONE, tbl_schedule_booked_date_to_ts::TIMESTAMP WITH TIME ZONE)
        OVERLAPS
        ('${start_ts_moment.format()}'::TIMESTAMP WITH TIME ZONE, '${end_ts_moment.format()}'::TIMESTAMP WITH TIME ZONE)
    `

    const sql3 = `
        INSERT INTO tbl_temporary_driver (tbl_temporary_driver_driver_name, tbl_temporary_driver_driver_phone, tbl_temporary_driver_driver_id, tbl_temporary_driver_from_ts, tbl_temporary_driver_to_ts, tbl_temporary_driver_driver_id_internal)
        VALUES ('${driver_name}', '${driver_phone}', ${driver_id}, '${start_ts_moment.format()}', '${end_ts_moment.format()}', ${driver_id_internal ||
        null})
    `

    pg.run(sql1)
        .then((result1) => {
            if (result1.rowCount === 0) {
                if (driver_id_internal) {
                    return pg.run(sql2).then((result2) => {
                        if (result2.rowCount === 0) {
                            return pg.run(sql3).then(({ rows }) => {
                                res.status(200).json({
                                    code: 0,
                                    data: rows,
                                })
                            })
                        }

                        return res.status(200).json({
                            code: 1,
                        })
                    })
                }

                return pg.run(sql3).then(({ rows }) => {
                    res.status(200).json({
                        code: 0,
                        data: rows,
                    })
                })
            }

            return res.status(200).json({
                code: 1,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 0,
                error,
            })
        })
})

router.post('/delete-temporary-driver', (req, res) => {
    const { temporary_id } = req.body
    const query = `
        DELETE FROM public.tbl_temporary_driver
        WHERE tbl_temporary_driver_id = '${temporary_id}';
    `
    pg.run(query)
        .then(({ rows }) => {
            return res.status(200).json({
                code: 0,
                data: rows,
            })
        })
        .catch((err) => {
            return res.status(500).json({
                code: 1,
                err,
            })
        })
})

router.post('/get-driver-working-nearly-for-schedule', (req, res) => {
    const { now } = req.body.data
    const theDate = moment(now)
    const days = moment(theDate.format())
    /*
        Lấy ngày cuối cùng của schedule từng facility
    */
    const sql = `
        SELECT facility_id, max(booked_date) as date
        FROM tbl_schedule
        GROUP BY facility_id
        ORDER BY date
    `

    pg.run(sql)
        .then((result) => {
            /*
                Kiểm tra xem ngày cuối của facility với thời gian truyền vào có bé hơn 30 ngày không
                Sau đó lấy danh sách các user chạy thường xuyên tính từ ngày được truyền vào trở về trước 7 ngày
            */
            if (Math.abs(moment(result.rows[0].date).diff(moment(days), 'days')) <= 30) {
                const query = `
                    SELECT sc.facility_id, f.facility_name, sc.user_id,(u.lastname || ' '::text) || u.firstname as user_name, max(sc.count_driver)
                    FROM(
                        SELECT s.facility_id,s.user_id,count(s.user_id) as count_driver
                        FROM tbl_schedule s
                        INNER JOIN tbl_facility f ON f.facility_id = s.facility_id
                        INNER JOIN tbl_category ca ON ca.category_id = f.category_id
                        WHERE ( '${days.add(-7, 'days').format()}'::date,'${days.add(8, 'days').format()}'::date)
                            OVERLAPS ("booked_date"::date,"booked_date"::date)
                            AND ca.is_specialized =1
                        GROUP BY s.facility_id,s.user_id
                        ORDER BY count_driver desc
                        ) sc
                    LEFT JOIN tbl_user u ON u.user_id = sc.user_id
                    LEFT JOIN tbl_facility f ON f.facility_id = sc.facility_id
                    GROUP BY sc.facility_id, sc.user_id, f.facility_name,user_name
                `

                return pg
                    .run(query)
                    .then(({ rows }) => {
                        const notiList = []
                        /*
                            Thêm các schedule vào bảng notifications
                        */
                        rows.forEach((element) => {
                            notiList.push(`('please_add_schedule_for_facilities','${JSON.stringify(element)}')`)
                        })
                        const sql2 = `
                            INSERT INTO tbl_notifications(notifications_title, notifications_content)
                            VALUES ${notiList.join(', ')};
                        `
                        return pg
                            .run(sql2)
                            .then((result1) => {
                                return res.status(200).json({
                                    code: 1,
                                    data: result1.rows,
                                })
                            })
                            .catch((error) => {
                                return res.status(500).json({
                                    code: 1,
                                    error,
                                })
                            })
                    })
                    .catch((err) => {
                        return res.status(500).json({
                            code: 1,
                            err,
                        })
                    })
            }

            return res.status(200).json({
                code: 0,
            })
        })
        .catch((err) => {
            return res.status(500).json({
                code: 1,
                err,
            })
        })
})

module.exports = router
