// route
const express = require('express')

const router = express.Router()
const postgre = require('../../services/postgre')

// get list of all object
router.get('/', (req, res) => {
    postgre
        .select('v_object')
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

// get 1 object by id
router.get('/:object_id', (req, res) => {
    const { object_id } = req.params
    postgre
        .select('v_object', '*', `object_id = ${Number(object_id)}`)
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

// get list of all object with current status
router.post('/status', (req, res) => {
    const ev = `
        SELECT
        object_id,
        json_agg(row_to_json((SELECT r FROM (SELECT
            event_id,
            event_title,
            e.start,
            e.end,
            e.user_id,
            u.email
        ) r ORDER BY e.start::timestamp with time zone))) as event_list
        FROM v_event e
        LEFT JOIN tbl_user u ON u.user_id = e.user_id
        WHERE  is_deleted = false
        GROUP BY object_id
    `

    const query = `
        SELECT
        vo.object_id,
        vo.object_code,
        vo.object_type_id,
        vo.object_type_name,
        vo.object_name,
        ev.event_list,
        now() as status_at

        FROM v_object vo
        LEFT JOIN (${ev}) ev ON ev.object_id = vo.object_id
        ORDER BY vo.object_id
    `
    postgre
        .run(query)
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

module.exports = router
