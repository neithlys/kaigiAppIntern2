// route
const express = require('express')

const router = express.Router()
const db = require('../../../services/postgre')
const hash = require('../../../services/hash')

// config router here
router.post('/list', (req, res) => {
    const userId = req.body.user_id || []
    const { organization_id } = req.body.user
    const sql = `
    SELECT user_id, email, firstname, lastname, u.permission_code, activation, phone_number, permission_name_code
    FROM tbl_user u
    INNER JOIN tbl_permission_detail pd ON pd.permission_code = u.permission_code
    WHERE ${
        userId.length > 0 ? `user_id IN (${userId.join(', ')})` : 'TRUE'
    } AND u.permission_code <> '100' AND organization_id = ${organization_id} AND is_fake_driver = 0 ORDER BY user_id
  `

    return db
        .run(sql)
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

router.post('/permission-list', (req, res) => {
    const sql = `
    SELECT *
    FROM tbl_permission_detail
  `
    return db
        .run(sql)
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
    const { organization_id } = req.body.user
    if (!organization_id) {
        return res.status(200).json({
            code: 2,
        })
    }
    const userData = {
        ...req.body.data,
        organization_id,
    }
    // Any key having value of undefined will not be inserted into db when querying
    userData.password =
        (userData.password && userData.password === userData.confirmPassword && hash(userData.password)) || undefined
    userData.confirmPassword = undefined

    const fieldName = Object.keys(userData).filter((item) => userData[item] !== undefined)
    const fieldValue = fieldName.map((item) => db.value(userData[item]))
    const sql = `
    INSERT INTO tbl_user (${fieldName.join(', ')})
    SELECT ${fieldValue.join(', ')}
    WHERE NOT EXISTS (
        SELECT * FROM tbl_user WHERE email = '${userData.email}'
    ) LIMIT 1 RETURNING *;
  `
    return db
        .run(sql)
        .then((result) => {
            if (result.rowCount === 0)
                return res.status(500).json({
                    code: 2,
                })
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
    const userData = req.body.data
    userData.password =
        (userData.password && userData.password === userData.confirmPassword && hash(userData.password)) || undefined
    userData.confirmPassword = undefined
    if (typeof userData.user_id !== 'number' || userData.user_id < 0) {
        return res.status(500).json({
            code: 1,
        })
    }
    Object.keys(userData).forEach((e) => {
        userData[e] = (userData[e] && typeof userData[e] === 'string' && userData[e].trim()) || userData[e]
    })

    return db
        .update('tbl_user', userData, `user_id = ${userData.user_id}`)
        .then((result) => {
            if (result.rowCount === 0) {
                throw new Error('No data was updated')
            }

            if (userData.activation === 0) {
                const sql1 = `
          SELECT *
          FROM tbl_event u, jsonb_array_elements(u.joiner_list) as obj
          WHERE obj->>'user_id' = ${userData.user_id}::text AND (start_ts > CURRENT_TIMESTAMP OR CURRENT_TIMESTAMP BETWEEN start_ts AND end_ts)
          AND u.is_deleted = false
        `
                return db.run(sql1).then((result1) => {
                    let sql2 = 'SELECT;'
                    const joinerLists = result1.rows.map((e) => {
                        return {
                            event_id: e.event_id,
                            joiner_list: e.joiner_list
                                .filter((e1) => {
                                    return e1.user_id !== userData.user_id
                                })
                                .map((e2) => JSON.stringify(e2)),
                        }
                    })
                    joinerLists.forEach((e) => {
                        sql2 += `
              UPDATE tbl_event
              SET joiner_list = ${(e.joiner_list.length !== 0 && `'[${e.joiner_list}]'`) || `'[]'`}
              WHERE event_id = ${e.event_id} ;
            `
                    })
                    db.run(sql2).then(() => {
                        return res.status(200).json({
                            code: 0,
                        })
                    })
                })
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

module.exports = router
