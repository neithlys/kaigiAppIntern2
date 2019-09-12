const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const auth = require('../../middlewares/auth')
const pg = require('../../services/postgre')
const hash = require('../../services/hash')
const env = require('../../environments')

router.post('/login', (req, res) => {
    const { email, password } = req.body
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
        WHERE email = '${email}'
        AND u.permission_code <> '00'
        AND u.activation = 1
        AND u.organization_id = o.organization_id
        GROUP BY u.user_id, o.organization_id
    `
    pg.run(sql)
        .then((result) => {
            if (result.rowCount === 0) {
                return res.status(401).json({
                    code: 401,
                    err: 'Unauthorized User!',
                })
            }
            const [user] = result.rows
            if (user.password !== hash(password)) {
                return res.status(401).json({
                    code: 401,
                    error: 'Unauthorized User!',
                })
            }
            const {
                user_id,
                permission_code,
                firstname,
                lastname,
                organization_id,
                color_code,
                phone_number,
                organization_status,
                need_check_in,
                home_page,
                total_category_type,
            } = user

            const waiting =
                result.rows[0] && result.rows[0].setting && result.rows[0].setting.defaultSetting.waiting
                    ? result.rows[0].setting.defaultSetting.waiting.timeBeforeEvent
                    : 0
            const entering =
                result.rows[0] && result.rows[0].setting && result.rows[0].setting.defaultSetting.entering
                    ? result.rows[0].setting.defaultSetting.entering.timeAfterEvent
                    : 0
            const organization_timezone =
                result.rows[0] && result.rows[0].setting && result.rows[0].setting.generalSetting.organization_timezone
                    ? result.rows[0].setting.generalSetting.organization_timezone
                    : '+07:00'
            const same_event =
                result.rows[0] && result.rows[0].setting && result.rows[0].setting.generalSetting.same_event
                    ? result.rows[0].setting.generalSetting.same_event
                    : false
            const remind_time =
                result.rows[0] && result.rows[0].setting && result.rows[0].setting.remind_time
                    ? result.rows[0].setting.remind_time
                    : 15
            const userSetting = result.rows[0].my_setting || result.rows[0].general_setting
            const organization_timezone_name =
                result.rows[0] &&
                result.rows[0].setting &&
                result.rows[0].setting.generalSetting.organization_timezone_name
                    ? result.rows[0].setting.generalSetting.organization_timezone_name
                    : 'Asia/Ho_Chi_Minh'

            const token = jwt.sign(
                {
                    user_id,
                },
                env.privateKey,
                {
                    expiresIn: '14 days',
                    algorithm: 'HS256',
                }
            )

            return res.status(200).json({
                token,
                code: 0,
                user: {
                    user_id,
                    email,
                    permission_code,
                    firstname,
                    lastname,
                    organization_id,
                    color_code,
                    phone_number,
                    organization_status,
                    need_check_in,
                    home_page,
                    organization_timezone,
                    total_category_type,
                    waiting,
                    entering,
                    same_event,
                    organization_timezone_name,
                    remind_time,
                    userSetting,
                },
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
            })
        })
})

router.post('/verify-token', auth.verifyToken, (req, res) => {
    return res.status(200).json({
        code: 0,
        user: req.body.user,
    })
})

module.exports = router
