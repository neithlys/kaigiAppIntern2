const jwt = require('jsonwebtoken')
const env = require('../environments')
const pg = require('../services/postgre')

// const admin_permission = ["'100'", "'99'"]
const verifyAdmin = (req, res, next) => {
    req.user = undefined
    if (!req.headers || !req.headers.authorization) {
        return res.status(401).json({
            err: 'Unauthorized User!',
        })
    }
    const token = req.headers.authorization
    return jwt.verify(token, env.privateKey, (err, decode) => {
        if (err) {
            return res.status(401).json({
                err: 'Unauthorized User!',
            })
        }
        // const sql = `
        //     SELECT u.*, o.setting
        //     FROM tbl_user u, tbl_organization o
        //     WHERE user_id = ${decode.user_id}
        //     AND permission_code IN (${admin_permission.join(', ')})
        //     AND u.organization_id = o.organization_id
        // `

        const sql = `
            SELECT u.*,o.*, array_to_json(array_agg(c),false) as total_category_type, u.setting as my_setting, o.setting as general_setting
            FROM tbl_user u, tbl_organization o
            LEFT JOIN (
                SELECT
                   SUM(CASE when need_driver  = 1 then 1 else 0 end) as is_need_driver,
                   SUM(CASE when  need_equipment  = 1 then 1 else 0 end) as is_need_equipment,
                   SUM(CASE when  need_driver  = 0 AND need_equipment  = 0 then 1 else 0 end) as is_others,
                organization_id
                FROM tbl_category
                WHERE activation = 1
                GROUP BY organization_id
            ) c ON o.organization_id = c.organization_id
            WHERE u.user_id = ${decode.user_id}
            AND u.permission_code === '99' || u.permission_code === '100'
            AND u.activation = 1
            AND u.organization_id = o.organization_id
            AND u.updated_at < to_timestamp(${decode.iat + 60})
            GROUP BY u.user_id , o.organization_id
        `

        return pg
            .run(sql)
            .then((result) => {
                if (result.rowCount === 0) {
                    return res.status(401).json({
                        err: 'Unauthorized User!',
                    })
                }
                const waiting =
                    result.rows[0] && result.rows[0].setting && result.rows[0].setting.defaultSetting.waiting
                        ? result.rows[0].setting.defaultSetting.waiting.timeBeforeEvent
                        : 0
                const entering =
                    result.rows[0] && result.rows[0].setting && result.rows[0].setting.defaultSetting.entering
                        ? result.rows[0].setting.defaultSetting.entering.timeAfterEvent
                        : 0
                const organization_timezone =
                    result.rows[0] &&
                    result.rows[0].setting &&
                    result.rows[0].setting.generalSetting.organization_timezone
                        ? result.rows[0].setting.generalSetting.organization_timezone
                        : '+07:00'
                const same_event =
                    result.rows[0] && result.rows[0].setting && result.rows[0].setting.generalSetting.same_event
                        ? result.rows[0].setting.generalSetting.same_event
                        : false
                const organization_timezone_name =
                    result.rows[0] &&
                    result.rows[0].setting &&
                    result.rows[0].setting.generalSetting.organization_timezone_name
                        ? result.rows[0].setting.generalSetting.organization_timezone_name
                        : 'Asia/Ho_Chi_Minh'
                const remind_time =
                    result.rows[0] && result.rows[0].setting && result.rows[0].setting.remind_time
                        ? result.rows[0].setting.remind_time
                        : 15
                const userSetting = result.rows[0].my_setting || result.rows[0].general_setting
                const {
                    password,
                    created_at,
                    activation,
                    setting,
                    is_fake_driver,
                    organization_code,
                    organization_name,
                    expired_in,
                    updated_at,
                    my_setting,
                    general_setting,
                    ...user
                } = result.rows[0]
                user.userSetting = userSetting
                user.waiting = waiting
                user.entering = entering
                user.organization_timezone = organization_timezone
                user.same_event = same_event
                user.organization_timezone_name = organization_timezone_name
                user.remind_time = remind_time
                // user.total_category_type = {
                //     total_is_need_driver: 0,
                //     total_is_need_equipment: 0,
                //     total_is_others: 0,
                // }
                req.body.user = user
                return next()
            })
            .catch((error) => {
                return res.status(500).json({
                    code: 0,
                    error,
                })
            })
    })
}

module.exports = {
    verifyAdmin,
}
