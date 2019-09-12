// route
const express = require('express')
const fs = require('fs')
const multer = require('multer')

const router = express.Router()

const upload = multer()
const moment = require('moment-timezone')

const db = require('../../../services/postgre')

const facilityImageDir = 'public/images/facilities'
const defaultFacilityImage = '0_0_image.jpg'

/*
  Danh sách facility (bao gồm cả thông tin thay thế)
*/
router.post('/list', (req, res) => {
    const { organization_id, organization_timezone_name } = req.body.user
    const facilityId = (req.body.facility_id && req.body.facility_id.length > 0 && req.body.facility_id) || []
    const now = (req.body.now ? moment(req.body.now) : moment()).tz(organization_timezone_name).format('YYYY-MM-DD')
    const sql = `
        SELECT
            f.*,
            ca.*,
            f.facility_activation as facility_activation,
            l.*,
            fa.*,
            fa.tbl_temporary_facility_id as temporary_facility,
            (
                CASE
                WHEN fa.tbl_temporary_facility_facility_id_internal IS NULL THEN fa.tbl_temporary_facility_facility_code
                ELSE f_i.facility_code
                END
            ) as tbl_temporary_facility_facility_code,
            (
                CASE
                WHEN fa.tbl_temporary_facility_facility_id_internal is null THEN fa.tbl_temporary_facility_facility_name
                ELSE f_i.facility_name
                END
            ) as tbl_temporary_facility_facility_name,
            (u.lastname || ' '::text) || u.firstname AS facility_default_driver_name,
            (u.phone_number) AS facility_default_driver_phone,
            (
                CASE
                WHEN fa.tbl_temporary_facility_id is null THEN 0
                ELSE 1
                END
            ) as rank,
            sc.facility_default_driver_id as facility_default_driver_id
        FROM tbl_facility f
        INNER JOIN tbl_location l ON l.location_id = f.location_id
        INNER JOIN tbl_category ca ON ca.category_id = f.category_id
        LEFT JOIN(
            SELECT *
            FROM tbl_temporary_facility
            WHERE (now()::TIMESTAMP with time zone, now() ::TIMESTAMP with time zone)
                OVERLAPS (tbl_temporary_facility_from_ts::TIMESTAMP with time zone, tbl_temporary_facility_to_ts::TIMESTAMP with time zone)
                AND (now() BETWEEN tbl_temporary_facility_from_ts AND tbl_temporary_facility_to_ts)
            )  fa ON fa.tbl_temporary_facility_facility_id = f.facility_id
        LEFT JOIN tbl_facility f_i ON f_i.facility_id = fa.tbl_temporary_facility_facility_id_internal
        LEFT JOIN (
            SELECT sc_gp.facility_id as facility_id, user_id as facility_default_driver_id
            FROM (
                SELECT facility_id, max(from_date) as from_date
                FROM tbl_schedule_contract
                WHERE from_date::date <= '${now}'::date
                GROUP BY facility_id
                ORDER BY from_date
            ) sc_gp
            INNER JOIN tbl_schedule_contract sc
            ON sc.facility_id = sc_gp.facility_id AND sc.from_date = sc_gp.from_date
        ) sc ON sc.facility_id = f.facility_id
        LEFT JOIN tbl_user u ON u.user_id = sc.facility_default_driver_id
        WHERE f.organization_id = ${organization_id}
            AND (${
                facilityId.length > 0 ? `f.facility_id IN (${facilityId.join(', ')}))` : 'TRUE)'
            } ORDER BY f.facility_id
    `
    db.run(sql)
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

router.post('/insert', upload.single('file'), (req, res) => {
    const data = (req.body.data && JSON.parse(req.body.data)) || {}
    data.facility_created_by = data.user_id
    const from_date = data.start_date
    delete data.start_date
    delete data.previous_facility_default_driver_id
    delete data.user_id

    const fieldName = Object.keys(data)
    const fieldValue = fieldName.map((item) => db.value(data[item]))

    const sql1 = `
        INSERT INTO tbl_facility (${fieldName.join(', ')})
        SELECT ${fieldValue.join(', ')}
        WHERE NOT EXISTS (
        SELECT * FROM tbl_facility WHERE facility_code = '${data.facility_code}'
        ) LIMIT 1 RETURNING *;
    `

    db.run(sql1)
        .then((result1) => {
            const { facility_id } = result1.rows[0]
            const file = req.file || null
            if (file) {
                const splitFileName = file.originalname.split('.')
                const fileExtension = splitFileName[splitFileName.length - 1]

                try {
                    if (
                        data.facility_image_url &&
                        data.facility_image_url !== defaultFacilityImage &&
                        /^\d_\d_image\.\w{3}$/.test(data.facility_image_url)
                    ) {
                        fs.unlinkSync(`${facilityImageDir}/${data.facility_image_url}`)
                    }
                    fs.writeFileSync(
                        `${facilityImageDir}/${data.organization_id}_${facility_id}_image.${fileExtension}`,
                        file.buffer
                    )

                    const sql2 = `
                        UPDATE tbl_facility
                        SET facility_image_url = '${data.organization_id}_${facility_id}_image.${fileExtension}'
                        WHERE facility_id = ${facility_id};

                        INSERT INTO tbl_schedule_contract (facility_id, user_id, from_date) VALUES (${facility_id}, ${data.facility_default_driver_id}, '${from_date}');
                    `

                    db.run(sql2).then(() => {
                        res.status(200).json({
                            code: 0,
                            data: result1.rows[0],
                        })
                    })

                    return
                } catch (error) {
                    res.status(500).json({
                        code: 1,
                        error,
                    })

                    return
                }
            }

            res.status(200).json({
                code: 0,
                data: result1.rows[0],
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
            })
        })
})

router.post('/delete', (req, res) => {
    const { facility_id } = req.body
    db.run(`DELETE FROM tbl_facility WHERE facility_id = ${facility_id}`)
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
})

router.post('/delete-image', (req, res) => {
    const { facility_id, facility_image_url } = req.body.params
    fs.unlinkSync(`${facilityImageDir}/${facility_image_url}`)
    const sql = `
        UPDATE tbl_facility
        SET facility_image_url = null
        WHERE facility_id = ${facility_id}
    `
    return db
        .run(sql)
        .then(() => {
            return res.status(200).json({
                code: 0,
            })
        })
        .catch(() => {
            return res.status(500).json({
                code: 0,
            })
        })
})

router.post('/update', upload.single('file'), (req, res) => {
    const data = (req.body.data && JSON.parse(req.body.data)) || {}
    let sql = `
        SELECT 1;
    `
    if (
        data.previous_facility_default_driver_id &&
        (!data.facility_default_driver_id ||
            (data.facility_default_driver_id &&
                data.facility_default_driver_id !== data.previous_facility_default_driver_id))
    ) {
        sql = `
            DELETE FROM tbl_schedule
            WHERE facility_id = ${data.facility_id}
            AND tbl_schedule_booked_date_from_ts::date >= '${data.start_date}'::date;
        `
    }
    if (data.facility_default_driver_id) {
        sql += `
            INSERT INTO tbl_schedule_contract (facility_id, user_id, from_date) VALUES (${data.facility_id}, ${data.facility_default_driver_id}, '${data.start_date}');
        `
    }
    const sql2 = `
        UPDATE tbl_schedule_contract set user_id = ${data.facility_default_driver_id}
        WHERE facility_id = ${data.facility_id} AND from_date = '${data.start_date}'
    `
    delete data.previous_facility_default_driver_id
    delete data.start_date
    delete data.user_id
    const file = req.file || null
    if (file) {
        const splitFileName = file.originalname.split('.')
        const fileExtension = splitFileName[splitFileName.length - 1]

        try {
            if (
                data.facility_image_url &&
                data.facility_image_url !== defaultFacilityImage &&
                /^\d_\d_image\.\w{3}$/.test(data.facility_image_url)
            ) {
                fs.unlinkSync(`${facilityImageDir}/${data.facility_image_url}`)
            }
            fs.writeFileSync(
                `${facilityImageDir}/${data.organization_id}_${data.facility_id}_image.${fileExtension}`,
                file.buffer
            )
            data.facility_image_url = `${data.organization_id}_${data.facility_id}_image.${fileExtension}`
        } catch (error) {
            res.status(500).json({
                code: 1,
                error,
            })
        }
    }

    db.update('tbl_facility', data, `facility_id = ${data.facility_id}`)
        .then(() => {
            db.run(sql).then(
                () => {
                    return res.status(200).json({
                        code: 0,
                    })
                },
                (error) => {
                    if (error.code === '23505') {
                        return db
                            .run(sql2)
                            .then(() => {
                                return res.status(200).json({
                                    code: 0,
                                })
                            })
                            .catch((error1) => {
                                return res.status(500).json({
                                    code: 1,
                                    error1,
                                })
                            })
                    }
                    return res.status(500).json({
                        code: 1,
                    })
                }
            )
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
            })
        })
})

router.post('/temporary-facility-list', (req, res) => {
    const facility_id = req.body.data && req.body.data.facility_id ? req.body.data.facility_id : null

    // const query = `
    //     SELECT
    //     tf2.*,
    //     tf1.json,
    //     tf2.tbl_temporary_facility_from_ts::date as tbl_temporary_facility_from_date
    //     FROM tbl_temporary_facility tf2
    //     LEFT JOIN tbl_facility f ON f.facility_id = tf2.tbl_temporary_facility_facility_id_internal
    //     INNER JOIN (
    //         SELECT
    //             MIN(tbl_temporary_facility_from_ts) as tbl_temporary_facility_from_ts,
    //             array_to_json(
    //             (
    //                 SELECT array_agg(
    //                 (
    //                     SELECT
    //                     tf4
    //                 )
    //                 )
    //             )
    //             ,
    //             true
    //             ) as json
    //     FROM (
    //         SELECT
    //         tf3.*,
    //         (CASE WHEN tf3.tbl_temporary_facility_facility_id_internal is null THEN tf3.tbl_temporary_facility_facility_name ELSE f.facility_name END) as tbl_temporary_facility_facility_name,
    //         (CASE WHEN tf3.tbl_temporary_facility_facility_id_internal is null THEN tf3.tbl_temporary_facility_facility_code ELSE f.facility_code END) as tbl_temporary_facility_facility_code
    //         FROM tbl_temporary_facility tf3
    //         LEFT JOIN tbl_facility f ON f.facility_id = tf3.tbl_temporary_facility_facility_id_internal
    //         WHERE tf3.tbl_temporary_facility_facility_id = ${
    //             facility_id ? `${facility_id}` : 'tf3.tbl_temporary_facility_facility_id'
    //         }
    //         ORDER BY tf3.tbl_temporary_facility_from_ts
    //     ) tf4
    //     GROUP BY tf4.tbl_temporary_facility_from_ts::date
    //     ) tf1 ON tf1.tbl_temporary_facility_from_ts = tf2.tbl_temporary_facility_from_ts
    //     WHERE tf2.tbl_temporary_facility_facility_id = ${
    //         facility_id ? `${facility_id}` : 'tf2.tbl_temporary_facility_facility_id'
    //     }
    //     ORDER BY tf2.tbl_temporary_facility_from_ts
    // `

    const query = `
        SELECT
        tf2.*,
        (CASE WHEN tf2.tbl_temporary_facility_facility_id_internal is null THEN tf2.tbl_temporary_facility_facility_name ELSE f.facility_name END) as tbl_temporary_facility_facility_name,
        (CASE WHEN tf2.tbl_temporary_facility_facility_id_internal is null THEN tf2.tbl_temporary_facility_facility_code ELSE f.facility_code END) as tbl_temporary_facility_facility_code
        FROM tbl_temporary_facility tf2
        LEFT JOIN tbl_facility f ON f.facility_id = tf2.tbl_temporary_facility_facility_id_internal
        WHERE tf2.tbl_temporary_facility_facility_id = ${
            facility_id ? `${facility_id}` : 'tf2.tbl_temporary_facility_facility_id'
        }
        ORDER BY tf2.tbl_temporary_facility_from_ts
    `

    db.run(query)
        .then(({ rows }) => {
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

router.post('/insert-temporary-facility', (req, res) => {
    const { organization_timezone_name } = req.body.user
    const { data } = req.body
    const { startTS, endTS, facility_code, facility_name, facility_id, facility_id_internal } = data
    const start_ts_moment = moment(startTS).tz(organization_timezone_name)
    const end_ts_moment = moment(endTS).tz(organization_timezone_name)

    const sql1 = `
        SELECT *
        FROM(
            SELECT *
            FROM tbl_temporary_facility
            WHERE
                (
                    tbl_temporary_facility_facility_id = ${facility_id_internal ? `${facility_id_internal}` : 'NULL'}
                    OR tbl_temporary_facility_facility_id_internal =  ${
                        facility_id_internal ? `${facility_id_internal}` : 'NULL'
                    }
                )
                AND (tbl_temporary_facility_from_ts::TIMESTAMP WITH TIME ZONE, tbl_temporary_facility_to_ts ::TIMESTAMP WITH TIME ZONE)
                OVERLAPS
                ('${start_ts_moment.format()}'::TIMESTAMP WITH TIME ZONE, '${end_ts_moment.format()}'::TIMESTAMP WITH TIME ZONE)
        ) tf
        FULL OUTER JOIN (
            SELECT *
            FROM tbl_event ev
            WHERE ev.facility_id = ${facility_id_internal ? `${facility_id_internal}` : 'NULL'}
                AND ev.is_deleted = false
                AND (start_ts::TIMESTAMP WITH TIME ZONE, end_ts ::TIMESTAMP WITH TIME ZONE)
                    OVERLAPS
                (
                    '${start_ts_moment.format()}'::TIMESTAMP WITH TIME ZONE, '${end_ts_moment.format()}'::TIMESTAMP WITH TIME ZONE
                )
        ) e ON tf.tbl_temporary_facility_facility_id = e.facility_id
    `

    const sql2 = `
        SELECT *
        FROM tbl_temporary_facility
        WHERE (tbl_temporary_facility_facility_id = ${facility_id} OR tbl_temporary_facility_facility_id_internal = ${facility_id})
        AND (tbl_temporary_facility_from_ts::TIMESTAMP WITH TIME ZONE, tbl_temporary_facility_to_ts ::TIMESTAMP WITH TIME ZONE)
            OVERLAPS
        ('${start_ts_moment.format()}'::TIMESTAMP WITH TIME ZONE, '${end_ts_moment.format()}'::TIMESTAMP WITH TIME ZONE)
    `

    const query = `
        INSERT INTO public.tbl_temporary_facility(
        tbl_temporary_facility_from_ts, tbl_temporary_facility_to_ts, tbl_temporary_facility_facility_name, tbl_temporary_facility_facility_code, tbl_temporary_facility_facility_id, tbl_temporary_facility_facility_id_internal)
        VALUES ( '${start_ts_moment.format()}', '${end_ts_moment.format()}', '${facility_name}', '${facility_code}', ${facility_id}, ${facility_id_internal ||
        null});
    `
    db.run(sql1)
        .then((result1) => {
            if (result1.rowCount === 0) {
                return db.run(sql2).then((result2) => {
                    if (result2.rowCount === 0) {
                        return db.run(query).then(({ rows }) => {
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

router.post('/delete-temporary-facility', (req, res) => {
    const { temporary_id } = req.body
    const query = `
        DELETE FROM public.tbl_temporary_facility
        WHERE tbl_temporary_facility_id = '${temporary_id}'
        RETURNING tbl_temporary_facility_id
    `

    db.run(query)
        .then(({ rows }) => {
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

module.exports = router
