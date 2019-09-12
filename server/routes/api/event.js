/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
// route
const express = require('express')
const multer = require('multer')

const upload = multer().single('file')
const router = express.Router()
const moment = require('moment-timezone')
const pdf = require('html-pdf')
const fs = require('fs')
const path = require('path')
const pg = require('../../services/postgre')
// const toTimeZone = require('../../services/timezone')

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index += 1) {
        await callback(array[index], index, array)
    }
}

async function getFreeCategory(
    check_category,
    start,
    end,
    facility_id,
    loops,
    organization_id,
    same_event = null,
    user
) {
    const r1category = check_category.join(' or f1.category_id =')
    const cacategory = check_category.join(' or ca.category_id = ')
    const facilities = []

    const flagSQL = `
    SELECT f1.*
    FROM tbl_facility f1
    ${
        !same_event
            ? `LEFT JOIN (
        SELECT fac.facility_id, fac.facility_code
        FROM tbl_facility fac
        INNER JOIN (
            SELECT *
            FROM  (
                SELECT *
                FROM v_event
                WHERE (timestamp with time zone '${moment(start).format()}'- (${user.waiting} || 'minutes')::interval,
                timestamp with time zone '${moment(end).format()}'+ (${user.entering} ||' minutes')::interval)
                  OVERLAPS ("start"::timestamp with time zone, "end"::timestamp with time zone)
              AND is_deleted = false
            ) v

            FULL OUTER JOIN (
                SELECT *
                FROM tbl_temporary_facility
                WHERE (tbl_temporary_facility_from_ts::TIMESTAMP WITH TIME ZONE, tbl_temporary_facility_to_ts ::TIMESTAMP WITH TIME ZONE)
                      OVERLAPS
                      (TIMESTAMP WITH TIME ZONE '${moment(start).format()}'- (${user.waiting} || 'minutes')::interval,
                       TIMESTAMP WITH TIME ZONE '${moment(end).format()}' + (${user.entering} ||' minutes')::interval)
            ) tf ON tf.tbl_temporary_facility_facility_id_internal = v.facility_id

            ) e ON (fac.facility_id = e.facility_id OR fac.facility_id = e.tbl_temporary_facility_facility_id_internal)
          INNER JOIN tbl_category ca ON fac.category_id = ca.category_id
          WHERE (ca.category_id = ${cacategory} )
      ) as f2 ON f1.facility_id = f2.facility_id
      WHERE f2.facility_id is null`
            : `WHERE TRUE`
    }

    AND f1.organization_id =${organization_id}
    AND (f1.category_id = ${r1category} )
    AND f1.facility_activation = 1
    `

    await pg
        .run(flagSQL)
        .then(async (flagResult) => {
            const ids = []
            check_category.forEach((e) => {
                const id = flagResult.rows.find((e1) => e1.category_id === e)
                if (id) {
                    ids.push(id)
                }
            })
            facilities.push(ids)
        })
        .catch(() => {})
    return facilities
}

const mapDate = (item) => {
    const itemDup = item
    const { start, end } = itemDup
    if (start && Date.parse(start)) itemDup.start = new Date(start).toISOString()
    if (end && Date.parse(end)) itemDup.end = new Date(end).toISOString()
    return itemDup
}

router.post('/info', (req, res) => {
    const { event_id, user } = req.body
    const query = `
    SELECT v_e.*, u.email, IS_MEMBER(${user.user_id}, event_id) AS role
    FROM v_event v_e
    LEFT JOIN tbl_user u ON u.user_id = v_e.user_id
    WHERE v_e.event_id = ${Number(event_id)}
  `
    pg.run(query)
        .then((result) => {
            res.json({
                code: 0,
                data: (result.rowCount > 0 && mapDate(result.rows[0])) || null,
            })
        })
        .catch((err) => {
            res.json({
                code: 1,
                err,
            })
        })
})

router.post('/event-childs', (req, res) => {
    const { event_id } = req.body
    const query = `
        SELECT f.category_id,f.facility_name,v_e.*
        FROM tbl_event v_e
        INNER JOIN tbl_facility f on v_e.facility_id = f.facility_id
        WHERE v_e.father_id = ${Number(event_id)}
        AND is_deleted = false
    `
    pg.run(query)
        .then((rows) => {
            res.status(200).json({
                code: 0,
                data: rows,
            })
        })
        .catch((err) => {
            res.status(500).json({
                code: 1,
                err,
            })
        })
})

router.post('/event-father', (req, res) => {
    const { event_id } = req.body
    const query = `
        SELECT f.category_id, f.facility_name, v_e.*
        FROM tbl_event v_e
        INNER JOIN tbl_facility f on v_e.facility_id = f.facility_id
        WHERE v_e.event_id = ${Number(event_id)}
        AND is_deleted = false
    `
    pg.run(query)
        .then((rows) => {
            res.status(200).json({
                code: 0,
                data: (rows.rows.length === 1 && rows.rows[0]) || null,
            })
        })
        .catch((err) => {
            res.status(500).json({
                code: 1,
                err,
            })
        })
})

router.post('/list', (req, res) => {
    const { organization_id } = req.body.user
    const { filter, user } = req.body
    const { facility_id, startStr, endStr, category_event, time_range_id, dow, permission_code, eventType } = filter
    const is_auto = req.body.is_auto || false
    let arrCategory = ''
    if (category_event) {
        if (category_event === 'allFacilityDriver') {
            arrCategory = 'AND cat.need_driver = 1'
        }
        if (category_event === 'allFacilityIsEquipment') {
            arrCategory = 'AND cat.need_equipment = 1'
        }
        if (category_event === 'allFacilityOthers') {
            arrCategory = 'AND cat.need_driver = 0 AND cat.need_equipment = 0'
        }
    }
    const sql = `
        SELECT
            fac.*,
            v_event.*, cat.* ,
            IS_MEMBER(${user.user_id}, event_id) as role, us.booked_date, us.driver_id, us.driver_name, us.driver_phone,
            tf.tbl_temporary_facility_id as temporary_facility,
            (
                CASE
                WHEN tf.tbl_temporary_facility_facility_id_internal IS NULL THEN tf.tbl_temporary_facility_facility_code
                ELSE f_i.facility_code
                END
            ) as temporary_facility_facility_code,
            (
                CASE
                WHEN tf.tbl_temporary_facility_facility_id_internal is null THEN tf.tbl_temporary_facility_facility_name
                ELSE f_i.facility_name
                END
            ) as temporary_facility_facility_name,
            (
                CASE
                WHEN (
                    SELECT tbl_temporary_facility_id
                    FROM tbl_temporary_facility tf1
                    WHERE
                    (tbl_temporary_facility_from_ts::TIMESTAMP with time zone, tbl_temporary_facility_to_ts::TIMESTAMP with time zone)
                        OVERLAPS
                    ("start"::TIMESTAMP with time zone, "end"::TIMESTAMP with time zone)

                    AND tf1.tbl_temporary_facility_facility_id = v_event.facility_id
                    LIMIT 1
                )IS NULL THEN false
                ELSE true
                END
            ) as is_facility_temporary,
            (
                CASE
                WHEN (
                    SELECT tbl_temporary_driver_id
                    FROM tbl_temporary_driver td
                    WHERE
                        (tbl_temporary_driver_from_ts::TIMESTAMP with time zone, tbl_temporary_driver_to_ts ::TIMESTAMP with time zone)
                            OVERLAPS
                        ("start"::TIMESTAMP with time zone, "end"::TIMESTAMP with time zone)
                        AND td.tbl_temporary_driver_driver_id = us.driver_id
                        LIMIT 1
                )
                IS NULL THEN false
                ELSE true
                END
            ) as is_driver_temporary,
            evc.equipments,
            u.lastname || ' ' || u.firstname as owner_name
        FROM v_event
        INNER JOIN tbl_user u ON u.user_id = v_event.owner_id
        INNER JOIN (
            SELECT v.event_id as e_id,array_to_json(array_agg(ev), false) AS equipments
            FROM v_event v
            LEFT JOIN (
                    SELECT *
                    FROM tbl_facility f
                    LEFT JOIN (
                        SELECT *
                        FROM tbl_event
                    ) e on f.facility_id = e.facility_id
                    LEFT JOIN tbl_category c ON c.category_id = f.category_id
                    WHERE is_deleted = false
                ) ev
            ON v.event_id = ev.father_id
            GROUP BY v.event_id
        ) evc ON evc.e_id = v_event.event_id
        INNER JOIN tbl_facility fac ON fac.facility_id = v_event.facility_id
        INNER JOIN tbl_category cat ON cat.category_id = fac.category_id  ${arrCategory}
        LEFT JOIN (
            SELECT s.facility_id, s.booked_date ,u.user_id as driver_id, u.lastname || ' ' || u.firstname as driver_name, u.phone_number as driver_phone
            FROM tbl_user u
            INNER JOIN (
                SELECT *
                FROM tbl_schedule
            ) s ON s.user_id = u.user_id
            WHERE u.activation = 1
        ) us ON (us.facility_id =  v_event.facility_id and v_event.start_ts::date <= us.booked_date and v_event.end_ts::date >= us.booked_date
            AND
                CASE
                WHEN v_event.start_ts::date > now()::date
                    THEN us.booked_date::date = v_event.start_ts::date
                WHEN v_event.end_ts::date < now()::date
                    THEN us.booked_date::date = v_event.end_ts::date
                    ELSE us.booked_date::date = now()::date
                END
            )
        LEFT JOIN tbl_temporary_facility tf ON
            (tbl_temporary_facility_from_ts::TIMESTAMP with time zone, tbl_temporary_facility_to_ts ::TIMESTAMP with time zone)
                OVERLAPS
            ("start"::TIMESTAMP with time zone, "end"::TIMESTAMP with time zone)
            AND (now() BETWEEN tbl_temporary_facility_from_ts AND tbl_temporary_facility_to_ts)
            AND (now() BETWEEN "start"::TIMESTAMP WITH TIME ZONE AND "end"::TIMESTAMP WITH TIME ZONE)
            AND tf.tbl_temporary_facility_facility_id = v_event.facility_id
        LEFT JOIN tbl_facility f_i ON f_i.facility_id = tf.tbl_temporary_facility_facility_id_internal
        WHERE (v_event.facility_id = ${Number(facility_id) ||
            `v_event.facility_id AND ${is_auto ? 'TRUE' : 'is_auto = false'}`})
        AND (
        FALSE
            OR (${eventType.includes('self')} AND IS_MEMBER(${user.user_id}, event_id) = 2)
            OR (${eventType.includes('relevant')} AND IS_MEMBER(${user.user_id}, event_id) = 1)
            OR (${eventType.includes('others')} AND IS_MEMBER(${user.user_id}, event_id) = 0)
        )
        AND fac.organization_id = ${organization_id}
        AND
            (timestamp with time zone '${startStr}', timestamp with time zone '${endStr}')
                OVERLAPS
            ("start"::timestamp with time zone, "end"::timestamp with time zone)
        AND is_deleted = false
        AND ${time_range_id ? ` time_range_id =  ${time_range_id}` : ` TRUE `}
        AND ${dow ? `EXTRACT(DOW FROM  start_ts) = ${dow}` : ` TRUE `}
        AND ${permission_code ? `u.permission_code = '${permission_code}'` : ` TRUE `}
    `
    pg.run(sql)
        .then(({ rows }) => {
            let data = rows
            if (!filter.eventType.includes('temporariness')) {
                data = rows.filter((e) => {
                    return !e.is_driver_temporary && !e.is_facility_temporary
                })
            }
            data.forEach((element, index) => {
                let event_color = ''
                const selfColor =
                    user.userSetting && user.userSetting.event_color && user.userSetting.event_color.self
                        ? user.userSetting.event_color.self
                        : 'green'
                switch (element.role) {
                    case 0:
                        event_color =
                            user.userSetting && user.userSetting.event_color && user.userSetting.event_color.others
                                ? user.userSetting.event_color.others
                                : 'white'
                        break
                    case 1:
                        event_color =
                            user.userSetting && user.userSetting.event_color && user.userSetting.event_color.relevant
                                ? user.userSetting.event_color.relevant
                                : 'blue'
                        break
                    case 2:
                        event_color = element.event_color ? element.event_color : selfColor
                        break
                    default:
                        break
                }
                if (element.is_driver_temporary || element.is_facility_temporary) {
                    event_color =
                        user.userSetting && user.userSetting.event_color && user.userSetting.event_color.temporariness
                            ? user.userSetting.event_color.temporariness
                            : 'rgb(128, 32, 5)'
                }
                data[index].event_color = event_color
            })

            return res.status(200).json({
                code: 0,
                data: data.map(mapDate),
            })
        })
        .catch((err) => {
            return res.status(500).json({
                code: 1,
                err,
            })
        })
})

router.post('/add', (req, res) => {
    const { event, user, check_category, start_ts_default, end_ts_default } = req.body
    const { user_id, organization_id } = user
    event.user_id = user_id
    delete event.event_schedule_id
    const sql = `
        SELECT need_driver, need_equipment
        FROM tbl_facility f
        INNER JOIN tbl_category cat ON cat.category_id = f.category_id
        WHERE f.facility_id = ${event.facility_id} ;
    `

    pg.run(sql)
        .then(async (result) => {
            if (result.rowCount === 1) {
                const { need_driver, need_equipment } = result.rows[0]
                if (need_driver === 1) {
                    return pg.insert('tbl_event', [event]).then(() =>
                        res.status(200).json({
                            code: 0,
                        })
                    )
                }
                if (need_equipment === 1 && check_category.length > 0) {
                    const { start_ts, end_ts, facility_id } = event
                    const momentStartTs = moment(start_ts_default)
                    const momentEndTs = moment(end_ts_default)
                    const loops = moment(momentEndTs, 'YYYY-MM-DD').diff(moment(momentStartTs, 'YYYY-MM-DD'), 'day')
                    const errCategory = []
                    const success = await getFreeCategory(
                        check_category,
                        start_ts,
                        end_ts,
                        facility_id,
                        loops,
                        organization_id,
                        user.same_event,
                        user
                    )
                    if (!success.length || (loops && success.length !== loops + 1) || (!loops && success.length - 1)) {
                        return res.status(200).json({
                            code: 2,
                        })
                    }

                    success.forEach((element) => {
                        check_category.forEach((e) => {
                            const id = element.find((e1) => e1.category_id === e)
                            if (!id) {
                                const ids = errCategory.find((e1) => e1 === e)
                                if (!ids) {
                                    errCategory.push(e)
                                }
                            }
                        })
                    })
                    let sql1 = 'SELECT'
                    if (errCategory.length === 0) {
                        const valuesSchedule = []

                        success.forEach((element) => {
                            element.forEach((e) => {
                                valuesSchedule.push(
                                    `('${event.event_title}', ${event.user_id}, '${start_ts}', '${end_ts}', '${e.facility_id}','number')`
                                )
                            })
                        })

                        sql1 = `
                            INSERT INTO public.tbl_event(
                                event_title, user_id, start_ts, end_ts, facility_id, father_id)
                            VALUES ${valuesSchedule.join(', ')};
                        `
                    } else {
                        return res.status(200).json({
                            code: 2,
                            err: errCategory,
                        })
                    }
                    return pg.insert('tbl_event', [event]).then(() => {
                        const sql2 = `
                            SELECT * from tbl_event where event_title ='${event.event_title}'
                            and start_ts ='${event.start_ts}' and end_ts= '${event.end_ts}'
                            and is_deleted = false
                        `
                        return pg.run(sql2).then((resultsql2) => {
                            sql1 = sql1.replace(/number/g, resultsql2.rows[0].event_id)
                            return pg.run(sql1).then(() =>
                                res.status(200).json({
                                    code: 0,
                                })
                            )
                        })
                    })
                }

                const sql1 = ' SELECT'
                return pg.run(sql1).then(() => {
                    return pg.insert('tbl_event', [event]).then(() =>
                        res.status(200).json({
                            code: 0,
                        })
                    )
                })
            }
            return res.status(200).json({
                code: 1,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
            })
        })
})

router.post('/add-subject', (req, res) => {
    const { events, user } = req.body
    const { user_id } = user
    const newEvents = events.map((e) => {
        return {
            ...e,
            user_id,
        }
    })

    return pg
        .insert('tbl_event', newEvents)
        .then(({ rows }) =>
            res.status(200).json({
                code: 0,
                data: rows,
            })
        )
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
                data: [],
            })
        })
})

router.post('/update-subject', (req, res) => {
    /*
        Cap nhat nhieu su kien cua cung time_range, nguoi tao, cung tieu de, cung ghi chu
    */
    const { event, start_sem, end_sem, facility_id, event_title } = req.body

    const condition = `
        (start_ts::timestamp with time zone, end_ts::timestamp with time zone)
            OVERLAPS
        ('${start_sem}'::timestamp with time zone, '${end_sem}'::timestamp with time zone)
        AND facility_id = '${facility_id}'
        AND event_title = '${event_title}'
    `

    return pg
        .update('tbl_event', event, condition)
        .then(({ rows }) =>
            res.status(200).json({
                code: 0,
                data: rows,
            })
        )
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
                data: [],
            })
        })
})

router.post('/delete-subject', (req, res) => {
    /*
        Xoa nhieu su kien cua cung time_range, nguoi tao, tieu de, ghi chu
    */
    const { start_sem, end_sem, facility_id, event_title } = req.body

    const condition = `
        (start_ts::timestamp with time zone, end_ts::timestamp with time zone)
            OVERLAPS
        ('${start_sem}'::timestamp with time zone, '${end_sem}'::timestamp with time zone)
        AND facility_id = '${facility_id}'
        AND event_title = '${event_title}'
    `
    return pg
        .delete('tbl_event', condition)
        .then(({ rows }) => {
            res.status(200).json({
                code: 0,
                data: rows,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
                data: [],
            })
        })
})

router.post('/add-regular-event', (req, res) => {
    const { regularEvent, user } = req.body
    const { user_id } = user
    const joiner_list = JSON.stringify(regularEvent.joiner_list)
    /*
    Vì Date của postgres không có time Stamp nên phải chuyển tay từ utc hệ thống sang VN
  */

    const regular_from = moment(regularEvent.regular_from)
        .add(7, 'hour')
        .format()
    const regular_to = moment(regularEvent.regular_to)
        .add(7, 'hour')
        .format()

    /*
        Lấy các regular bận trong khoản thời gian truyền vào
    */

    const query = `
        SELECT *
        FROM tbl_regular_events r
        WHERE ('${moment(regularEvent.start_ts).format('HH:mm:SS')}':: time without time zone,
            '${moment(regularEvent.end_ts).format('HH:mm:SS')}':: time without time zone)
            OVERLAPS ("regular_events_start_ts":: time without time zone,"regular_events_end_ts":: time without time zone )
            AND (date '${regular_from}'- (1 || 'days')::interval, date '${regular_to}'+ (1 || 'days')::interval )
                OVERLAPS ("regular_events_from_date","regular_events_to_date" )
        AND r.regular_events_facility_id = ${regularEvent.facility_id}
    `
    return pg
        .run(query)
        .then((result) => {
            if (result.rowCount > 0) {
                const existDate = []
                /*
                    Trích xuất các ngày của những regular bận
                */
                result.rows.forEach((element) => {
                    const startM = moment(element.regular_events_from_date)
                    const endM = moment(element.regular_events_to_date)
                    const typeLoop = element.regular_events_type
                    let loop = null
                    let loopMonth = null
                    switch (typeLoop) {
                        case 2:
                            loop = 7
                            while (
                                startM.format('dddd') !== moment(element.regular_events_start_ts).format('dddd') &&
                                startM.diff(endM) <= 0
                            ) {
                                startM.add(1, 'days')
                            }
                            break
                        case 3:
                            if (startM.date() > moment(element.regular_events_start_ts).date()) {
                                startM.date(moment(element.regular_events_start_ts).date()).add(1, 'months')
                            } else {
                                startM.date(moment(element.regular_events_start_ts).date())
                            }
                            loopMonth = 1
                            break
                        default:
                            loop = 1
                            break
                    }

                    while (startM.diff(endM) <= 0 && startM.diff(regular_to) <= 0) {
                        const ids = existDate.find((e) => {
                            return moment(e).format('YYYY-MM-DD') === startM.format('YYYY-MM-DD')
                        })
                        if (!ids) {
                            existDate.push(startM.format())
                        }
                        if (loopMonth) {
                            startM.add(loopMonth, 'months')
                        } else {
                            startM.add(loop, 'days')
                        }
                    }
                })
                /*
                    Kiểm tra sự kiện vừa tạo có trùng ngày tự động tạo với các sự kiện lặp khác không
                */
                const typeLoop = regularEvent.regular_event
                let loop = null
                let loopMonth = null
                const startM = moment(regular_from)
                const endM = moment(regular_to)
                let errorDate = false
                switch (typeLoop) {
                    case 2:
                        loop = 7
                        while (
                            startM.format('dddd') !== moment(regularEvent.regular_events_start_ts).format('dddd') &&
                            startM.diff(endM) <= 0
                        ) {
                            startM.add(1, 'days')
                        }
                        break
                    case 3:
                        if (startM.date() > moment(regularEvent.regular_events_start_ts).date()) {
                            startM.date(moment(regularEvent.regular_events_start_ts).date()).add(1, 'months')
                        } else {
                            startM.date(moment(regularEvent.regular_events_start_ts).date())
                        }
                        loopMonth = 1
                        break
                    default:
                        loop = 1
                        break
                }
                while (startM.diff(endM) <= 0) {
                    const ids = existDate.find((e) => {
                        return moment(e).format('YYYY-MM-DD') === startM.format('YYYY-MM-DD')
                    })
                    if (ids) {
                        errorDate = true
                        break
                    }
                    if (loopMonth) {
                        startM.add(loopMonth, 'months')
                    } else {
                        startM.add(loop, 'days')
                    }
                }
                if (errorDate) {
                    return res.status(200).json({
                        code: 5,
                    })
                }
            }
            const select_category = regularEvent.select_category || []
            // if (regularEvent.select_category) {
            //     select_category = regularEvent.select_category
            // }
            const regular_events_child_category_id = JSON.stringify(select_category)
            const sql = `
                INSERT INTO public.tbl_regular_events(
                    regular_events_event_title,
                    regular_events_user_id, regular_events_start_ts,
                    regular_events_end_ts, regular_events_from_date,
                    regular_events_to_date,
                    regular_events_facility_id, regular_events_joiner_list,
                    regular_events_note,regular_events_type, regular_events_child_category_id)
                VALUES ('${regularEvent.event_title}',
                    '${user_id}',
                    '${regularEvent.start_ts}',
                    '${regularEvent.end_ts}',
                    '${regular_from}',
                    '${regular_to}',
                    '${regularEvent.facility_id}',
                    '${joiner_list}',
                    '${regularEvent.note || ''}',
                    '${regularEvent.regular_event || null}',
                    '${regular_events_child_category_id}');
            `
            return pg
                .run(sql)
                .then(() => {
                    return res.status(200).json({
                        code: 0,
                    })
                })
                .catch((error) => {
                    return res.status(500).json({
                        code: 0,
                        error,
                    })
                })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 0,
                error,
            })
        })
})

router.post('/edit-regular-event', (req, res) => {
    const { regularEvent, user } = req.body
    const { user_id } = user
    const joiner_list = JSON.stringify(regularEvent.joiner_list)
    /*
    Vì Date của postgres không có time Stamp nên phải chuyển tay từ utc hệ thống sang VN
  */

    const regular_from = moment(regularEvent.regular_from)
        .add(7, 'hour')
        .format()
    const regular_to = moment(regularEvent.regular_to)
        .add(7, 'hour')
        .format()

    /*
        Lấy các regular bận trong khoản thời gian truyền vào
    */

    const query = `
        SELECT *
        FROM tbl_regular_events r
        WHERE ('${moment(regularEvent.start_ts).format('HH:mm:SS')}':: time without time zone,
            '${moment(regularEvent.end_ts).format('HH:mm:SS')}':: time without time zone)
            OVERLAPS ("regular_events_start_ts":: time without time zone,"regular_events_end_ts":: time without time zone )
            AND (date '${regular_from}'- (1 || 'days')::interval, date '${regular_to}'+ (1 || 'days')::interval )
                OVERLAPS ("regular_events_from_date","regular_events_to_date" )
        AND r.regular_events_facility_id = ${regularEvent.facility_id}
        AND r.regular_events_event_id != ${regularEvent.regular_events_id}
    `
    return pg
        .run(query)
        .then((result) => {
            if (result.rowCount > 0) {
                const existDate = []
                /*
                    Trích xuất các ngày của những regular bận
                */
                result.rows.forEach((element) => {
                    const startM = moment(element.regular_events_from_date)
                    const endM = moment(element.regular_events_to_date)
                    const typeLoop = element.regular_events_type
                    let loop = null
                    let loopMonth = null
                    switch (typeLoop) {
                        case 2:
                            loop = 7
                            while (
                                startM.format('dddd') !== moment(element.regular_events_start_ts).format('dddd') &&
                                startM.diff(endM) <= 0
                            ) {
                                startM.add(1, 'days')
                            }
                            break
                        case 3:
                            if (startM.date() > moment(element.regular_events_start_ts).date()) {
                                startM.date(moment(element.regular_events_start_ts).date()).add(1, 'months')
                            } else {
                                startM.date(moment(element.regular_events_start_ts).date())
                            }
                            loopMonth = 1
                            break
                        default:
                            loop = 1
                            break
                    }

                    while (startM.diff(endM) <= 0 && startM.diff(regular_to) <= 0) {
                        const ids = existDate.find((e) => {
                            return moment(e).format('YYYY-MM-DD') === startM.format('YYYY-MM-DD')
                        })
                        if (!ids) {
                            existDate.push(startM.format())
                        }
                        if (loopMonth) {
                            startM.add(loopMonth, 'months')
                        } else {
                            startM.add(loop, 'days')
                        }
                    }
                })
                /*
                    Kiểm tra sự kiện vừa tạo có trùng ngày tự động tạo với các sự kiện lặp khác không
                */
                const typeLoop = regularEvent.regular_event
                let loop = null
                let loopMonth = null
                const startM = moment(regular_from)
                const endM = moment(regular_to)
                let errorDate = false
                switch (typeLoop) {
                    case 2:
                        loop = 7
                        while (
                            startM.format('dddd') !== moment(regularEvent.regular_events_start_ts).format('dddd') &&
                            startM.diff(endM) <= 0
                        ) {
                            startM.add(1, 'days')
                        }
                        break
                    case 3:
                        if (startM.date() > moment(regularEvent.regular_events_start_ts).date()) {
                            startM.date(moment(regularEvent.regular_events_start_ts).date()).add(1, 'months')
                        } else {
                            startM.date(moment(regularEvent.regular_events_start_ts).date())
                        }
                        loopMonth = 1
                        break
                    default:
                        loop = 1
                        break
                }
                while (startM.diff(endM) <= 0) {
                    const ids = existDate.find((e) => {
                        return moment(e).format('YYYY-MM-DD') === startM.format('YYYY-MM-DD')
                    })
                    if (ids) {
                        errorDate = true
                        break
                    }
                    if (loopMonth) {
                        startM.add(loopMonth, 'months')
                    } else {
                        startM.add(loop, 'days')
                    }
                }
                if (errorDate) {
                    return res.status(200).json({
                        code: 5,
                    })
                }
            }
            const select_category = regularEvent.select_category || []
            // if (regularEvent.select_category) {
            //     select_category = regularEvent.select_category
            // }
            const regular_events_child_category_id = JSON.stringify(select_category)
            const sql1 = `
                INSERT INTO public.tbl_regular_events(
                    regular_events_event_title,
                    regular_events_user_id, regular_events_start_ts,
                    regular_events_end_ts, regular_events_from_date,
                    regular_events_to_date,
                    regular_events_facility_id, regular_events_joiner_list,
                    regular_events_note,regular_events_type, regular_events_child_category_id)
                VALUES ('${regularEvent.event_title}',
                    '${user_id}',
                    '${regularEvent.start_ts}',
                    '${regularEvent.end_ts}',
                    '${regular_from}',
                    '${regular_to}',
                    '${regularEvent.facility_id}',
                    '${joiner_list}',
                    '${regularEvent.note || ''}',
                    '${regularEvent.regular_event || null}',
                    '${regular_events_child_category_id}');

                UPDATE tbl_regular_events
                SET regular_events_is_active = false
                WHERE  regular_events_event_id = ${regularEvent.regular_events_id};
            `
            let condition = `TRUE`
            if (regularEvent.type_edit_regular_events === 1) {
                condition = `
                    start_ts::date >= '${regular_from}'::date
                `
            }

            const sql2 = `
                DELETE FROM tbl_event
                WHERE regular_events_id = ${regularEvent.regular_events_id}
                AND ${condition} ;
            `

            const sql = sql1 + sql2
            return pg
                .run(sql)
                .then(() => {
                    return res.status(200).json({
                        code: 0,
                    })
                })
                .catch((error) => {
                    return res.status(500).json({
                        code: 0,
                        error,
                    })
                })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 0,
                error,
            })
        })
})

// router.post('/edit-regular-event', (req, res) => {
//     const { regularEvent, user } = req.body
//     const { user_id } = user
//     const joiner_list = JSON.stringify(regularEvent.joiner_list)
//     /*
//         Vì Date của postgres không có time Stamp nên phải chuyển tay từ utc hệ thống sang VN
//     */
//     const regular_from = moment(regularEvent.regular_from)
//         .add(7, 'hour')
//         .format()
//     const regular_to = moment(regularEvent.regular_to)
//         .add(7, 'hour')
//         .format()
//     /*
//         Thêm regular event mới vào đồng thời deactive regular cũ
//     */
//     const regular_events_child_category_id = JSON.stringify(regularEvent.select_category)
//     const sql1 = `
//         INSERT INTO public.tbl_regular_events(
//         regular_events_event_title,
//         regular_events_user_id, regular_events_start_ts,
//         regular_events_end_ts, regular_events_from_date,
//         regular_events_to_date,
//         regular_events_facility_id, regular_events_joiner_list,
//         regular_events_note,regular_events_type,regular_events_child_category_id)
//         VALUES (
//         '${regularEvent.event_title}',
//         '${user_id}',
//         '${regularEvent.start_ts}',
//         '${regularEvent.end_ts}',
//         '${regular_from}',
//         '${regular_to}',
//         '${regularEvent.facility_id}',
//         '${joiner_list}',
//         '${regularEvent.note || ''}',
//         '${regularEvent.regular_event || null}',
//         '${regular_events_child_category_id}'
//         );

//         UPDATE tbl_regular_events
//         SET regular_events_is_active = false
//         WHERE  regular_events_event_id = ${regularEvent.regular_events_id};
//     `
//     let condition = `TRUE`
//     if (regularEvent.type_edit_regular_events === 1) {
//         condition = `
//             start_ts::date >= '${regular_from}'::date
//         `
//     }

//     const sql2 = `
//         DELETE FROM tbl_event
//         WHERE regular_events_id = ${regularEvent.regular_events_id}
//         AND ${condition} ;
//     `

//     const sql = sql1 + sql2
//     pg.run(sql)
//         .then(() => {
//             return res.status(200).json({
//                 code: 0,
//             })
//         })
//         .catch((error) => {
//             return res.status(500).json({
//                 code: 1,
//                 error,
//             })
//         })
// })

router.post('/edit', (req, res) => {
    const { event } = req.body
    // const { organization_id } = user
    event.updated_at = moment().utc()
    const sql = `
        SELECT need_driver
        FROM tbl_facility f
        INNER JOIN tbl_category cat ON cat.category_id = f.category_id
        WHERE f.facility_id = ${event.facility_id}
    `
    return pg
        .run(sql)
        .then(async (result) => {
            if (result.rowCount === 1) {
                return pg.update('tbl_event', event, `event_id = ${event.event_id}`).then(() => {
                    return res.status(200).json({
                        code: 0,
                    })
                })
            }
            return res.status(200).json({
                code: 1,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
            })
        })
})

router.post('/father-edit', (req, res) => {
    const { event, user, child_list, start_ts_default, end_ts_default, select_category } = req.body
    const { user_id, organization_id } = user
    if (event.user_id !== user_id && !(Number(user.permission_code) >= 66)) {
        return res.status(500).json({
            code: 7,
        })
    }

    event.updated_at = moment().utc()
    /*
    Kiểm tra facility của event có tồn tại hay không
  */
    const sql = `
        SELECT need_equipment
        FROM tbl_facility f
        INNER JOIN tbl_category cat ON cat.category_id = f.category_id
        WHERE f.facility_id = ${event.facility_id}
    `
    return pg
        .run(sql)
        .then(async (result) => {
            const { need_equipment } = result.rows[0]
            if (result.rowCount === 1) {
                if (need_equipment === 1) {
                    // const check_category = []
                    // child_list.forEach((e) => {
                    //     const id = check_category.find((element) => element === e.category_id)
                    //     if (!id) {
                    //         check_category.push(e.category_id)
                    //     }
                    // })
                    const sql1 = `
                        DELETE FROM tbl_event e
                        WHERE e.father_id = ${event.event_id}
                    `
                    return pg.run(sql1).then(async () => {
                        if (select_category.length === 0) {
                            return pg.update('tbl_event', event, `event_id = ${event.event_id}`).then(() => {
                                return res.status(200).json({
                                    code: 0,
                                })
                            })
                        }
                        const { start_ts, end_ts, facility_id } = event
                        const momentStartTs = moment(start_ts_default)
                        const momentEndTs = moment(end_ts_default)
                        const loops = moment(momentEndTs, 'YYYY-MM-DD').diff(moment(momentStartTs, 'YYYY-MM-DD'), 'day')
                        /*
                            Lấy các Category rảnh trong khoản thời gian được chọn
                        */
                        const success = await getFreeCategory(
                            select_category,
                            start_ts,
                            end_ts,
                            facility_id,
                            loops,
                            organization_id,
                            user.same_event,
                            user
                        )

                        // if (!success.length || (loops && success.length !== loops + 1) || (!loops && success.length - 1)) {
                        //     errCategory.push(1)
                        // }

                        /*
                            Lấy ra các Category lỗi
                        */
                        const errCategory = []
                        success.forEach((element) => {
                            select_category.forEach((e) => {
                                const id = element.find((e1) => e1.category_id === e)
                                if (!id) {
                                    const ids = errCategory.find((e1) => e1 === e)
                                    if (!ids) {
                                        errCategory.push(e)
                                    }
                                }
                            })
                        })
                        /*
                            Insert các sự kiện khi không có category nào bận
                        */
                        let sql2 = ''
                        if (errCategory.length === 0) {
                            const valuesSchedule = []
                            success.forEach((element) => {
                                element.forEach((e) => {
                                    valuesSchedule.push(
                                        `('${event.event_title}', ${event.user_id}, '${start_ts}', '${end_ts}', '${e.facility_id}','${event.event_id}')`
                                    )
                                })
                            })
                            sql2 = `
                                INSERT INTO public.tbl_event(
                                    event_title, user_id, start_ts, end_ts, facility_id, father_id)
                                VALUES ${valuesSchedule.join(', ')};
                            `

                            return pg.run(sql2).then(() => {
                                return pg.update('tbl_event', event, `event_id = ${event.event_id}`).then(() => {
                                    return res.status(200).json({
                                        code: 0,
                                    })
                                })
                            })
                        }
                        /*
                            Khi Category bận => Insert các event con cũ vào lại
                        */
                        const valuesSchedule = []
                        child_list.forEach((element) => {
                            const joiner_list = JSON.stringify(element.joiner_list)

                            valuesSchedule.push(`(${element.event_id}, '${element.event_title}', ${element.user_id},
                            ${element.object_id}, '${element.start_ts}', '${element.end_ts}',
                            '${element.all_day}', ${element.start_date}, ${element.end_date},
                            '${element.created_at}', ${element.updated_at},
                            ${element.facility_id}, '${joiner_list}', '${element.status_code}',
                            ${element.check_in}, ${element.check_out}, ${element.event_note}, ${element.father_id})
                        `)
                        })
                        sql2 = `
                            INSERT INTO public.tbl_event
                            VALUES ${valuesSchedule.join(', ')};
                        `
                        return pg.run(sql2).then(() => {
                            return res.status(200).json({
                                code: 2,
                            })
                        })
                    })
                }
                return res.status(200).json({
                    code: 4,
                })
            }
            return res.status(200).json({
                code: 3,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
            })
        })
})

router.post('/drop-event', (req, res) => {
    const { params } = req.body
    const sql = `
        UPDATE tbl_event
        SET start_ts = '${params.start_ts}', end_ts = '${params.end_ts}'
        WHERE event_id = ${params.event_id}
        AND is_deleted = false
    `
    return pg
        .run(sql)
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

router.post('/check-in', (req, res) => {
    const { event_id, user } = req.body
    pg.select(
        'tbl_event',
        ['event_id', `is_member(${user.user_id}, ${event_id}) as role`],
        `event_id = ${event_id}
        AND (now()::timestamp with time zone  - (${user.entering} || ' minutes')::interval,
        now()::timestamp with time zone  + (${user.waiting} || ' minutes')::interval)
        OVERLAPS
        ("start_ts"::timestamp with time zone, "start_ts"::timestamp with time zone)`
    )
        .then(({ rows }) => {
            if (rows.length === 0) {
                res.json({
                    code: 1,
                    err: 'event khong ton tai, chua dien ra hoac da het thoi gian checkin',
                })
            }
            if (rows[0].role === 0 || rows[0].role === 1) {
                res.json({
                    code: 1,
                    err: 'Ban khong co quyen chinh sua event cua nguoi khac',
                })
            }
            const event = {
                event_id,
                status_code: 1,
                check_in: 'now()',
            }
            return pg.update('tbl_event', event, `event_id = ${event.event_id} AND is_deleted = false`).then(() =>
                res.json({
                    code: 0,
                })
            )
        })
        .catch((err) =>
            res.json({
                code: 1,
                err,
            })
        )
})

router.post('/check-out', (req, res) => {
    const { event_id, user } = req.body
    pg.select(
        'tbl_event',
        ['event_id', `is_member(${user.user_id}, ${event_id}) as role`],
        `event_id = ${event_id} AND is_deleted = false
        AND (now()::timestamp with time zone, now()::timestamp with time zone )
        OVERLAPS
        ("start_ts"::timestamp with time zone, "end_ts"::timestamp with time zone)
        `
    )
        .then(({ rows }) => {
            if (rows.length === 0) {
                res.json({
                    code: 1,
                    err: 'event khong ton tai hoac da het su kien',
                })
            }
            if (rows[0].role === 0 || rows[0].role === 1) {
                res.json({
                    code: 1,
                    err: 'Ban khong co quyen chinh sua event cua nguoi khac',
                })
            }
            const event = {
                event_id,
                status_code: 2,
                check_out: 'now()',
            }
            return pg.update('tbl_event', event, `event_id = ${event.event_id} AND is_deleted = false`).then(() =>
                res.json({
                    code: 0,
                })
            )
        })
        .catch((err) =>
            res.json({
                code: 1,
                err,
            })
        )
})

router.post('/get-role-code', (req, res) => {
    const { event_id, user } = req.body
    const sql = `
        SELECT get_permission(${user.user_id}, ${event_id}) as role_code
        FROM tbl_event
        WHERE tbl_event.event_id = ${event_id}
        AND is_deleted = false
    `
    pg.run(sql)
        .then(({ rows }) => {
            if (rows.length === 0) {
                return res.status(200).json({
                    code: 0,
                    err: 'Event does not exist',
                })
            }
            return res.status(200).json({
                code: 0,
                role_code: rows[0].role_code,
            })
        })
        .catch((err) => {
            res.status(500).json({
                code: 1,
                err,
            })
        })
})

router.get('/auto-end', (req) => {
    const { user } = req.body
    const query = `
        SELECT organization_id
        FROM tbl_organization
        WHERE organization_status = 4
    `
    pg.run(query)
        .then((result) => {
            let sql = `SELECT`
            if (result.rowCount > 0) {
                const { rows } = result
                const organization_id = []
                rows.forEach((element) => {
                    organization_id.push(element.organization_id)
                })
                sql = `
                    UPDATE tbl_event eve
                    SET end_ts = start_ts + (${user.entering} || ' minutes')::interval, status_code = -1
                    FROM tbl_user use
                    WHERE use.user_id = eve.user_id
                    AND use.organization_id IN (${organization_id.join(', ')})
                    AND status_code = 0
                    AND(start_ts::date = now()::date)
                    AND(DATE_PART('hour', now()) - DATE_PART('hour', start_ts) = 0)
                    AND((DATE_PART('minute', now()) - DATE_PART('minute', start_ts)) > ${user.entering})
                    AND is_deleted = false
                `
            }

            return pg
                .run(sql)
                .then(() => {}, () => {})
                .catch(() => {})
        })
        .catch(() => {})
})

router.post('/remove', (req, res) => {
    const { user, event_id } = req.body
    const { user_id } = user
    const sql = `
        SELECT get_permission(${user_id}, ${event_id}) AS permission
        FROM tbl_event
        WHERE event_id = ${event_id}
        AND is_deleted = false
    `
    pg.run(sql)
        .then((result) => {
            const { permission } = result.rows[0]
            if (permission === 1 || permission === 0) {
                return res.status(200).json({
                    code: 2,
                })
            }
            const sql1 = `
                Update tbl_event set is_deleted = true
                where event_id = ${event_id}
            `
            return pg.run(sql1).then(() => {
                const sql2 = `
                        Update tbl_event set is_deleted = true
                        where father_id = ${event_id}
                    `
                return pg.run(sql2).then(() => {
                    res.status(200).json({
                        code: 0,
                    })
                })
            })
        })
        .catch((error) => {
            res.status(500).json({
                code: 1,
                error,
            })
        })
})

// router.post('/add-delete-event', (req, res) => {
//     const { eventDelete } = req.body

//     const sql = `
//     INSERT INTO tbl_event_deleted(
//         facility_id, date_delete)
//        VALUES ('${eventDelete.facility_id}', '${eventDelete.date_delete}')
//   `

//     pg.run(sql)
//         .then(() => {
//             res.status(200).json({
//                 code: 0,
//             })
//         })
//         .catch((error) => {
//             res.status(500).json({
//                 code: 1,
//                 error,
//             })
//         })
// })

router.post('/next', (req, res) => {
    const { user } = req.body
    pg.select(
        'v_event',
        '*, ("start"::timestamp with time zone < now()) as isCurrent',
        `is_member(${user.user_id}, event_id) > 0 AND is_deleted = false and ("end"::timestamp with time zone > now())`,
        'start::timestamp with time zone',
        '1'
    )
        .then(({ rows }) =>
            res.json({
                code: 0,
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

router.post('/get-driver-for-event', (req, res) => {
    const { facility_id, start_ts, end_ts, now } = req.body.params
    const start = moment(start_ts, 'YYYY-MM-DD')
    const end = moment(end_ts, 'YYYY-MM-DD')
    const theDate = moment(now, 'YYYY-MM-DD')
    let condition = ''
    const passedDays = theDate.diff(start, 'day')
    const remainDays = end.diff(theDate, 'day')

    if (passedDays < 0) {
        condition = `booked_date = '${start.format()}'::date`
    } else if (passedDays >= 0 && remainDays >= 0) {
        condition = `booked_date = '${theDate.add(passedDays, 'day').format()}'::date`
    } else {
        condition = `booked_date = '${end.format()}'::date`
    }
    const sql = `
        SELECT s.facility_id, s.booked_date, u.user_id as driver_id, u.lastname || ' ' || u.firstname as driver_name, u.phone_number as driver_phone
        FROM tbl_user u
        INNER JOIN (
            SELECT *
            FROM v_schedule
            WHERE facility_id = ${facility_id}
                AND ${condition}
        ) s ON s.user_id = u.user_id
        WHERE u.activation = 1
    `

    pg.run(sql)
        .then((result) => {
            if (result.rowCount === 1)
                return res.status(200).json({
                    code: 0,
                    data: result.rows[0],
                })
            return res.status(200).json({
                code: 2,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                error,
            })
        })
})

router.post('/get-child-events-for-event', (req, res) => {
    const { start_ts, end_ts, now, event_id } = req.body.params
    const start = moment(start_ts, 'YYYY-MM-DD')
    const end = moment(end_ts, 'YYYY-MM-DD')
    const theDate = moment(now, 'YYYY-MM-DD')
    let condition = ''
    const passedDays = theDate.diff(start, 'day')
    const remainDays = end.diff(theDate, 'day')
    if (passedDays < 0) {
        condition = `("start_ts"::timestamp with time zone,"end_ts"::timestamp with time zone )
        OVERLAPS (timestamp with time zone '${start.format()}'::date,timestamp with time zone '${start
            .add(1, 'day')
            .format()}'::date) `
    } else if (passedDays >= 0 && remainDays >= 0) {
        condition = `("start_ts"::timestamp with time zone,"end_ts"::timestamp with time zone )
        OVERLAPS (timestamp with time zone '${theDate.format()}'::date,timestamp with time zone '${theDate
            .add(1, 'day')
            .format()}'::date) `
    } else {
        condition = `("start_ts"::timestamp with time zone,"end_ts"::timestamp with time zone )
        OVERLAPS (timestamp with time zone '${end.format()}'::date,timestamp with time zone '${end
            .add(1, 'day')
            .format()}'::date) `
    }
    const sql = `
        SELECT *
        FROM tbl_facility f
        LEFT JOIN (
            SELECT *
            FROM tbl_event
            WHERE ${condition}
        ) e on f.facility_id = e.facility_id
        LEFT JOIN tbl_category c ON c.category_id = f.category_id
        WHERE e.father_id ='${event_id}'
        AND is_deleted = false
    `

    pg.run(sql)
        .then((result) => {
            if (result.rowCount >= 1)
                return res.status(200).json({
                    code: 0,
                    data: result.rows,
                })
            return res.status(200).json({
                code: 2,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                error,
            })
        })
})

router.post('/get-temporaries-for-event', (req, res) => {
    const { params } = req.body
    const { start_ts, end_ts, facility_id } = params
    const start = moment(start_ts)
    const end = moment(end_ts)
    // const theDate = moment(now, 'YYYY-MM-DD')
    let condition = ''
    // const passedDays = theDate.diff(start, 'day')
    // const remainDays = end.diff(theDate, 'day')
    // if (passedDays < 0) {
    //     condition = `("start_ts"::timestamp with time zone,"end_ts"::timestamp with time zone )
    //     OVERLAPS (timestamp with time zone '${start.format()}'::date,timestamp with time zone '${start.add(1, 'day').format()}'::date) `
    // } else if (passedDays >= 0 && remainDays >= 0) {
    //     condition = `("start_ts"::timestamp with time zone,"end_ts"::timestamp with time zone )
    //     OVERLAPS (timestamp with time zone '${theDate.format()}'::date,timestamp with time zone '${theDate.add(1, 'day').format()}'::date) `
    // } else {
    //     condition = `("start_ts"::timestamp with time zone,"end_ts"::timestamp with time zone )
    //     OVERLAPS (timestamp with time zone '${end.format()}'::date,timestamp with time zone '${end.add(1, 'day').format()}'::date) `
    // }
    condition = `
        ("tbl_temporary_facility_from_ts"::timestamp with time zone,"tbl_temporary_facility_to_ts"::timestamp with time zone )
        OVERLAPS (timestamp with time zone '${start.format()}'::timestamp with time zone,timestamp with time zone '${end
        .add(1, 'day')
        .format()}'::timestamp with time zone)
    `
    const sql = `
        SELECT *
        FROM tbl_temporary_facility
        WHERE tbl_temporary_facility_facility_id = ${facility_id}
        AND ${condition}
        ORDER BY tbl_temporary_facility_from_ts
    `
    return pg
        .run(sql)
        .then((result) => {
            let sql1 = `SELECT`
            if (params.user_id) {
                sql1 = `
                    SELECT *
                    FROM tbl_temporary_driver
                    WHERE
                        ("tbl_temporary_driver_from_ts"::timestamp with time zone,"tbl_temporary_driver_to_ts"::timestamp with time zone )
                        OVERLAPS (timestamp with time zone '${start.format()}',timestamp with time zone '${end
                    .add(1, 'day')
                    .format()}')
                    AND tbl_temporary_driver_driver_id = ${params.user_id}
                `
            } else {
                return res.status(200).json({
                    code: 0,
                    data: result.rows,
                })
            }
            return pg.run(sql1).then((result1) => {
                if (result.rowCount >= 1) {
                    if (result1.rowCount > 0) {
                        const rowsDriver = result.rows.map((e) => {
                            return {
                                ...e,
                                driver_name: result1.rows[0].tbl_temporary_driver_driver_name,
                            }
                        })
                        return res.status(200).json({
                            code: 0,
                            data: rowsDriver,
                        })
                    }
                    return res.status(200).json({
                        code: 0,
                        data: result.rows,
                    })
                }
                return res.status(200).json({
                    code: 2,
                })
            })
        })
        .catch((error) => {
            return res.status(500).json({
                error,
            })
        })
})

router.post('/save-report', (req, res1) => {
    // const { user } = req.body
    upload(req, res1, (errUpload) => {
        if (!errUpload) {
            const { html, fileName } = req.body
            // const { html, user_id } = req.body
            // const now = moment().format('YYYY_MM_DD_HH_mm_SS')
            const fileDirName = `./public/report/event/${fileName}.pdf`
            const pathDelete = './public/report/event'
            /*
                Xóa các file trước trong folder
            */
            fs.readdir(pathDelete, (err, files) => {
                if (err) throw err
                files.forEach((file) => {
                    fs.unlink(path.join(pathDelete, file), (err1) => {
                        if (err1) throw err1
                    })
                })
            })
            /*
                Tạo file vào trong folder
            */
            pdf.create(html, {
                orientation: 'landscape',
            }).toFile(fileDirName, (err2) => {
                if (err2) {
                    res1.status(500).json({
                        code: 1,
                        err2,
                    })
                }
                res1.download(fileDirName, (err3) => {
                    if (err3) {
                        throw err3
                    }
                    // fs.unlink(fileDirName, (err4) => {
                    //     if (err4) throw err4
                    // })
                })
            })
        }
    })
})

router.post('/delete-report', (req) => {
    const { fileName } = req.body
    // const now = moment().format('YYYY_MM_DD_HH_mm_SS')
    const fileDirName = `./public/report/event/${fileName}.pdf`
    fs.unlink(fileDirName, (err4) => {
        if (err4) throw err4
    })
})

router.post('/join-event', (req, res) => {
    const { event } = req.body
    pg.update('tbl_event', event, `event_id = ${event.event_id}`)
        .then(() => {
            return res.status(200).json({
                code: 0,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                error,
            })
        })
})

router.post('/join-subject', (req, res) => {
    const { event, event_title, start_sem, end_sem, facility_id } = req.body

    const condition = `
        (start_ts::timestamp with time zone, end_ts::timestamp with time zone)
            OVERLAPS
        ('${start_sem}'::timestamp with time zone, '${end_sem}'::timestamp with time zone)
        AND facility_id = '${facility_id}'
        AND event_title = '${event_title}'
    `
    pg.update('tbl_event', event, condition)
        .then(({ rows }) => {
            return res.status(200).json({
                code: 0,
                data: rows,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                error,
                data: [],
            })
        })
})

// router.post('/auto-add-event', (req, res) => {
//     const { params } = req.body
//     const { facility_id, start_date, end_date, facility_name, facility_note, user_id } = params
//     const start = moment(start_date)
//     const end = moment(end_date)
//     const sql = `SELECT *
//         FROM tbl_event
//         WHERE facility_id = '${facility_id}'
//         AND ("start_ts", ("end_ts" + ((1 || 'days')::interval)))
//                 OVERLAPS (timestamp with time zone '${start.format()}', timestamp with time zone '${end.format()}')
//     `

//     pg.run(sql)
//         .then(({ rows }) => {
//             const existDate = []
//             rows.forEach((e) => {
//                 const start_e = moment(e.start_ts)
//                 const end_e = moment(e.end_ts)
//                 while (start_e.diff(end_e) <= 0) {
//                     existDate.push(start_e.format())
//                     start_e.add(1, 'day')
//                 }
//             })
//             const allDate = []
//             while (start.diff(end) < 0) {
//                 const ids = existDate.find((e) => {
//                     return moment(e).format('YYYY-MM-DD') === start.format('YYYY-MM-DD')
//                 })
//                 if (!ids) {
//                     const startStr = start.format()
//                     allDate.push(
//                         `('${facility_note || facility_name}', ${user_id}, '${startStr}', '${moment(startStr)
//                             .add(23, 'hours')
//                             .add(45, 'minutes')
//                             .format()}', '${facility_id}', true)`
//                     )
//                 }

//                 start.add(1, 'day')
//             }
//             let sql1 = `SELECT`
//             if (allDate.length > 0) {
//                 sql1 = `
//                     INSERT INTO public.tbl_event(
//                         event_title, user_id, start_ts, end_ts, facility_id, is_auto)
//                     VALUES ${allDate.join(', ')};
//                 `
//             }

//             return pg
//                 .run(sql1)
//                 .then((result) => {
//                     return res.status(200).json({
//                         code: 0,
//                         data: result.rows,
//                     })
//                 })
//                 .catch((error) => {
//                     return res.status(500).json({
//                         error,
//                     })
//                 })
//         })
//         .catch((error) => {
//             return res.status(500).json({
//                 error,
//             })
//         })
// })

// router.post('/auto-add-all-event-now', (req, res) => {
//     const { now } = req.body
//     const theDate = moment(now)
//     const sql = `
//         SELECT f.*
//         FROM tbl_facility f
//         INNER JOIN tbl_category ca ON ca.category_id = f.category_id
//         WHERE ca.is_specialized = 1
//             AND f.facility_activation = 1
//             AND ca.activation = 1
//             AND f.facility_id NOT IN
//         (
//             SELECT facility_id
//             FROM v_event
//             WHERE
//                  ("start"::timestamp with time zone,"end"::timestamp with time zone )
//                     OVERLAPS ( now()::timestamp with time zone,now()::timestamp with time zone )
//                 AND is_auto = true
//         )
//     `

//     return pg
//         .run(sql)
//         .then(({ rows }) => {
//             const allDate = []
//             let sql1 = ` SELECT true; `
//             if (rows.length > 0) {
//                 const startStr = theDate.format()
//                 rows.forEach((element) => {
//                     allDate.push(
//                         `('${element.facility_name || element.note}', ${element.facility_created_by}, '${theDate.format()}', '${moment(startStr)
//                             .add(23, 'hours')
//                             .add(45, 'minutes')
//                             .add(0, 'seconds')
//                             .format()}', '${element.facility_id}', true)`
//                     )
//                 })
//                 sql1 = `
//                     INSERT INTO public.tbl_event(
//                         event_title, user_id, start_ts, end_ts, facility_id, is_auto)
//                     VALUES ${allDate.join(', ')};
//                 `
//             }

//             return pg
//                 .run(sql1)
//                 .then((result) => {
//                     return res.status(200).json({
//                         code: 0,
//                         data: result.rows,
//                     })
//                 })
//                 .catch((error) => {
//                     return res.status(500).json({
//                         error,
//                     })
//                 })
//             // return res.status(200).json({
//             //     code: 0,
//             //     data: rows,
//             // })
//         })
//         .catch((error) => {
//             return res.status(500).json({
//                 error,
//             })
//         })
// })

router.post('/auto-add-all-event', (req, res) => {
    const { user } = req.body
    const { start, end } = req.body.data
    /*
        Tạo sự kiện của xe chuyên dụng luôn bắt đầu từ 0h -> 23h VN mà server FAAS lại là GMT nên phải +7 tiếng.
    */
    // const fakeDateStart = moment(start)
    //     .utc()
    //     .add(7, 'hours')
    // const dateStart = moment(`${fakeDateStart.format('YYYY-MM-DD')}T00:00:00+07:00`)
    // const fakeDateEnd = moment(end)
    //     .utc()
    //     .add(7, 'hours')
    // const dateEnd = moment(`${fakeDateEnd.format('YYYY-MM-DD')}T00:00:00+07:00`)
    const dateStart = moment(start).tz(user.organization_timezone_name)
    const dateEnd = moment(end).tz(user.organization_timezone_name)

    /*
        Lấy danh sách xe luôn bận
    */
    const sql = `
        SELECT f.*
        FROM tbl_facility f
        INNER JOIN tbl_category ca ON ca.category_id = f.category_id
        WHERE ca.is_specialized = 1
            AND f.facility_activation = 1
            AND ca.activation = 1
    `

    return pg
        .run(sql)
        .then((result) => {
            if (result.rowCount > 0) {
                /*
                 Lấy danh sách các event của xe luôn bận
                */
                const sql1 = `
                    SELECT *
                    FROM tbl_event e
                    INNER JOIN tbl_facility f ON f.facility_id = e.facility_id
                    INNER JOIN tbl_category ca ON ca.category_id = f.category_id
                    WHERE ca.is_specialized = 1
                        AND f.facility_activation = 1
                        AND ca.activation = 1
                        AND (timestamp with time zone '${dateStart.format()}',
                            (timestamp with time zone '${dateEnd.format()}' + ((1 || 'days')::interval)))
                        OVERLAPS ("start_ts","end_ts" )
                        ${user.same_event ? `AND is_auto = true` : ` `}
                `

                return pg
                    .run(sql1)
                    .then(({ rows }) => {
                        let sql2 = `
                            SELECT true;
                        `
                        const allDate = []

                        result.rows.forEach((element) => {
                            /*
                                Lấy danh sách các event con của từng xe
                            */
                            const eventsOfElement = rows.filter((e) => e.facility_id === element.facility_id)
                            const existDate = []
                            /*
                                Lấy danh sách các ngày bận của event con
                            */
                            eventsOfElement.forEach((e) => {
                                const start_e = moment(e.start_ts)
                                const end_e = moment(e.end_ts)
                                while (start_e.diff(end_e) <= 0) {
                                    existDate.push(start_e.format())
                                    start_e.add(1, 'day')
                                }
                            })
                            /*
                                Kiểm tra xem thời gian nhập vào có bé hơn ngày tạo của xe hay không
                            */
                            const startM = moment(dateStart.format())

                            if (
                                moment(moment(start).format('YYYY-MM-DD')).diff(
                                    moment(moment(element.facility_created_at).format('YYYY-MM-DD')),
                                    'day'
                                ) <= 0
                            ) {
                                startM
                                    .year(moment(element.facility_created_at).year())
                                    .month(moment(element.facility_created_at).month())
                                    .date(moment(element.facility_created_at).date())
                            }

                            const endM = moment(dateEnd.format())

                            /*
                                Chạy vòng lặp gán câu lệnh sql insert vào biến tạm
                            */
                            while (startM.diff(endM) <= 0) {
                                const ids = existDate.find((e) => {
                                    return moment(e).format('YYYY-MM-DD') === startM.format('YYYY-MM-DD')
                                })
                                if (!ids) {
                                    const startStr = startM.format()
                                    allDate.push(
                                        `('${element.facility_name || element.facility_note}', ${
                                            element.facility_created_by
                                        }, '${startStr}', '${moment(startStr)
                                            .add(23, 'hours')
                                            .add(45, 'minutes')
                                            .format()}', '${element.facility_id}', true)`
                                    )
                                }
                                startM.add(1, 'days')
                            }
                        })

                        /*
                            Chạy câu lệnh INSERT
                        */
                        if (allDate.length > 0) {
                            sql2 = `
                                INSERT INTO public.tbl_event(
                                    event_title, user_id, start_ts, end_ts, facility_id, is_auto)
                                VALUES ${allDate.join(', ')};
                            `
                        }

                        return pg
                            .run(sql2)
                            .then((result1) => {
                                return res.status(200).json({
                                    code: 0,
                                    data: result1.rows,
                                })
                            })
                            .catch((error) => {
                                return res.status(500).json({
                                    error,
                                })
                            })
                    })
                    .catch((error) => {
                        return res.status(500).json({
                            error,
                        })
                    })
            }
            return res.status(200).json({
                code: 0,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                error,
            })
        })
})

router.post('/auto-add-all-regular-events', (req, res) => {
    const { user } = req.body
    const { organization_id } = user
    const { start, end } = req.body.data
    // const timezone = '+07'
    /*
        Tạo sự kiện của xe chuyên dụng luôn bắt đầu từ 0h -> 23h VN mà server FAAS lại là GMT nên phải +7 tiếng.
    */
    // const fakeDateStart = moment(start)
    //     .utc()
    //     .add(Number(timezone), 'hours')

    // const dateStart = moment(`${fakeDateStart.format('YYYY-MM-DD')}T00:00:00${timezone}:00`)
    // const fakeDateEnd = moment(end)
    //     .utc()
    //     .add(Number(timezone), 'hours')
    // const dateEnd = moment(`${fakeDateEnd.format('YYYY-MM-DD')}T00:00:00${timezone}:00`)
    const dateStart = moment(start).tz(user.organization_timezone_name)
    const dateEnd = moment(end).tz(user.organization_timezone_name)
    /*
        Lấy danh sách các event thường kì và event con của nó
    */
    const sql = `
        SELECT r.*, array_to_json(array_agg(e),false) as events
        FROM tbl_regular_events r
        LEFT JOIN (
            SELECT *
            FROM tbl_event
            ${user.same_event ? `WHERE regular_events_id is not null` : ``}
        ) e
        ON (
            r.regular_events_facility_id = e.facility_id
            AND ("start_ts":: time without time zone, "end_ts":: time without time zone)
                OVERLAPS ("regular_events_start_ts":: time without time zone,"regular_events_end_ts":: time without time zone )
            AND ("start_ts":: date, end_ts ::date)
            OVERLAPS ("regular_events_from_date"::date,(regular_events_to_date+ (1 || 'days')::interval)::date )
        )
        WHERE regular_events_is_active = true

        AND (timestamp with time zone '${dateStart.format()}', timestamp with time zone '${dateEnd.format()}' )
            OVERLAPS ("regular_events_from_date", "regular_events_to_date" )
        GROUP BY r.regular_events_event_id
    `
    return pg
        .run(sql)
        .then(async (result) => {
            let sql2 = `
                SELECT true;
            `
            const allDate = []
            const allChildCategory = []
            const childForSearch = []
            await asyncForEach(result.rows, async (element) => {
                /*
                    Lấy danh sách các event con của event thường kì
                */
                const eventsOfElement = element.events
                const existDate = []
                /*
                    Lấy danh sách các ngày bận của event con
                */

                if (eventsOfElement[0] !== null) {
                    eventsOfElement.forEach((e) => {
                        const start_e = moment(e.start_ts)
                        const end_e = moment(e.end_ts)
                        while (start_e.diff(end_e) <= 0) {
                            existDate.push(start_e.format())
                            start_e.add(1, 'day')
                        }
                    })
                }
                /*
                    Kiểm tra xem thời gian nhập vào có bé hơn ngày bắt đầu của event thường kì hay không
                */

                const startM = moment(dateStart.format())

                if (
                    moment(moment(start).format('YYYY-MM-DD')).diff(
                        moment(moment(element.regular_events_from_date).format('YYYY-MM-DD')),
                        'day'
                    ) <= 0
                ) {
                    startM
                        .year(moment(element.regular_events_from_date).year())
                        .month(moment(element.regular_events_from_date).month())
                        .date(moment(element.regular_events_from_date).date())
                }
                const endM = moment(dateEnd.format())

                if (
                    moment(moment(end).format('YYYY-MM-DD')).diff(
                        moment(moment(element.regular_events_to_date).format('YYYY-MM-DD')),
                        'day'
                    ) >= 0
                ) {
                    endM.year(moment(element.regular_events_to_date).year())
                        .month(moment(element.regular_events_to_date).month())
                        .date(moment(element.regular_events_to_date).date())
                }
                /*
                    Chạy vòng lặp gán câu lệnh sql insert vào biến tạm
                */
                const typeLoop = element.regular_events_type
                let loop = null
                let loopMonth = null

                switch (typeLoop) {
                    case 2:
                        loop = 7
                        while (
                            startM.format('dddd') !== moment(element.regular_events_start_ts).format('dddd') &&
                            startM.diff(endM) <= 0
                        ) {
                            startM.add(1, 'days')
                        }
                        break
                    case 3:
                        if (startM.date() > moment(element.regular_events_start_ts).date()) {
                            startM.date(moment(element.regular_events_start_ts).date()).add(1, 'months')
                        } else {
                            startM.date(moment(element.regular_events_start_ts).date())
                        }
                        loopMonth = 1
                        break
                    default:
                        loop = 1
                        break
                }

                while (startM.diff(endM) <= 0) {
                    const ids = existDate.find((e) => {
                        return moment(e).format('YYYY-MM-DD') === startM.format('YYYY-MM-DD')
                    })
                    const joiner_list = JSON.stringify(element.regular_events_joiner_list)
                    if (!ids) {
                        const event_start_ts = moment(startM.format())
                            .hour(moment(element.regular_events_start_ts).hour())
                            .minute(moment(element.regular_events_start_ts).minute())
                            .format()
                        const event_end_ts = moment(startM.format())
                            .hour(moment(element.regular_events_end_ts).hour())
                            .minute(moment(element.regular_events_end_ts).minute())
                            .format()
                        const errCategory = []
                        const childCategory = element.regular_events_child_category_id
                        /*
                            Nếu equipment cần category thì kiểm tra các category rảnh
                        */
                        let success = []
                        if (childCategory.length > 0) {
                            success = await getFreeCategory(
                                childCategory,
                                event_start_ts,
                                event_end_ts,
                                null,
                                null,
                                organization_id,
                                user.same_event,
                                user
                            )
                            success.forEach((element1) => {
                                childCategory.forEach((e) => {
                                    const id = element1.find((e1) => e1.category_id === e)
                                    if (!id) {
                                        const ids1 = errCategory.find((e1) => e1 === e)
                                        if (!ids1) {
                                            errCategory.push(e)
                                        }
                                    }
                                })
                            })
                        }
                        if (errCategory.length === 0) {
                            allDate.push(
                                `('${element.regular_events_event_title}', ${element.regular_events_user_id}, '${event_start_ts}', '${event_end_ts}', ${element.regular_events_facility_id}, '${joiner_list}', '${element.regular_events_note}', ${element.regular_events_event_id})`
                            )
                            if (childCategory.length > 0) {
                                success.forEach((element1) => {
                                    element1.forEach((e) => {
                                        allChildCategory.push(
                                            `('${element.regular_events_event_title}', ${element.regular_events_user_id}, '${event_start_ts}', '${event_end_ts}', '${e.facility_id}','number', ${element.regular_events_event_id})`
                                        )
                                        const child = []
                                        child.start_ts = event_start_ts
                                        child.regular_events_event_id = element.regular_events_event_id
                                        childForSearch.push(child)
                                    })
                                })
                            }
                        }
                    }
                    if (loopMonth) {
                        startM.add(loopMonth, 'months')
                    } else {
                        startM.add(loop, 'days')
                    }
                }
            })

            /*
                Chạy câu lệnh INSERT
            */
            if (allDate.length > 0) {
                sql2 = `
                    INSERT INTO public.tbl_event(
                        event_title, user_id, start_ts, end_ts, facility_id, joiner_list, event_note, regular_events_id)
                    VALUES ${allDate.join(', ')}
                    RETURNING * ;
                `
            }
            return pg
                .run(sql2)
                .then((result1) => {
                    if (!result1.rows[0].bool && result1.rowCount > 0) {
                        if (allChildCategory.length <= 0) {
                            return res.status(200).json({
                                code: 0,
                                data: result1.rows,
                            })
                        }
                        childForSearch.forEach((element, index) => {
                            const ids = result1.rows.find(
                                (e) =>
                                    e.regular_events_id === element.regular_events_event_id &&
                                    moment(e.start_ts).diff(moment(element.start_ts)) === 0
                            )
                            if (ids) {
                                allChildCategory[index] = allChildCategory[index].replace(/number/g, ids.event_id)
                            }
                        })

                        const sql3 = `
                            INSERT INTO public.tbl_event(
                                event_title, user_id, start_ts, end_ts, facility_id, father_id, regular_events_id)
                            VALUES ${allChildCategory.join(', ')};
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
                                    error,
                                })
                            })
                    }
                    return res.status(200).json({
                        code: 0,
                        data: result1.rows,
                    })
                })
                .catch((error) => {
                    return res.status(500).json({
                        error,
                    })
                })
        })
        .catch((error) => {
            return res.status(500).json({
                error,
            })
        })
})

router.post('/get-event-in-coming', (req, res) => {
    const { user } = req.body

    const { remind_time } = user
    const theDateStart = moment().add(Number(remind_time) - 2, 'minutes')
    const theDateEnd = moment().add(Number(remind_time) + 2, 'minutes')
    /*
        Lấy các sự kiện của event sẽ xảy ra vào đúng giờ chỉ định
    */
    const sql = `
        SELECT *
        FROM tbl_event
        WHERE  ( timestamp with time zone  '${theDateStart.format()}', timestamp with time zone '${theDateEnd.format()}')
            OVERLAPS ("start_ts","start_ts" )
        AND is_deleted = false
        `

    pg.run(sql)
        .then((result) => {
            if (result.rowCount === 0) {
                return res.status(200).json({
                    code: 0,
                })
            }
            /*
                Thêm các schedule vào bảng notifications
            */
            const notiList = []
            result.rows.forEach((element) => {
                notiList.push(`('event_in_coming','${JSON.stringify(element)}')`)
            })
            const sql2 = `
                        INSERT INTO tbl_notifications(notifications_title, notifications_content)
                        VALUES ${notiList.join(', ')};
                    `
            return pg
                .run(sql2)
                .then((result1) => {
                    return res.status(200).json({
                        code: 0,
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
})

module.exports = router
