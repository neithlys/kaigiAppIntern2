// route
const express = require('express')
const fs = require('fs')
const multer = require('multer')
const db = require('../../../services/postgre')

const router = express.Router()
const upload = multer()
const backgroundDir = 'public/backgrounds'
const defaultBackground = '0_background.jpg'
const hash = require('../../../services/hash')

router.post('/', (req, res) => {
    const { user_id } = req.body.user
    db.select(
        'tbl_user',
        'user_id, email, firstname, lastname, permission_code, activation, setting',
        `user_id = ${user_id}`
    )
        .then((result1) => {
            if (result1.rowCount === 0) throw new Error()
            const data = result1.rows[0]
            const personal = {
                user_id: data.user_id,
                email: data.email,
                firstname: data.firstname,
                lastname: data.lastname,
                permission_code: data.permission_code,
                activation: data.activation,
            }
            res.status(200).json({
                code: 0,
                personal,
                setting: data.setting,
            })
        })
        .catch((error) =>
            res.status(500).json({
                code: 1,
                error,
            })
        )
})

router.post('/update', upload.single('file'), (req, res) => {
    const setting = (req.body.setting && JSON.parse(req.body.setting)) || {}
    const { organization_id } = req.body
    const personal = (req.body.personal && JSON.parse(req.body.personal)) || {}
    const file = req.file || null
    if (file) {
        const splitFileName = file.originalname.split('.')
        const fileExtension = splitFileName[splitFileName.length - 1]

        try {
            if (
                setting.background &&
                setting.background !== defaultBackground &&
                /^\d_background\.\w{3}$/.test(setting.background)
            ) {
                fs.unlinkSync(`${backgroundDir}/${setting.background}`)
            }
            fs.writeFileSync(
                `${backgroundDir}/${organization_id}_${personal.user_id}_background.${fileExtension}`,
                file.buffer
            )
            setting.background = `${organization_id}_${personal.user_id}_background.${fileExtension}`
        } catch (error) {
            res.status(500).json({
                code: 1,
            })
            return
        }
    }
    const query =
        personal.password === ''
            ? `
            UPDATE tbl_user
            SET firstname = '${personal.firstname}', lastname = '${personal.lastname}', setting = '${JSON.stringify(
                  setting
              )}'::jsonb
            WHERE user_id = ${personal.user_id};
        `
            : `
            UPDATE tbl_user
            SET password = '${hash(personal.password)}', firstname = '${personal.firstname}', lastname = '${
                  personal.lastname
              }', setting = '${JSON.stringify(setting)}'::jsonb
            WHERE user_id = ${personal.user_id};
        `
    db.run(query)
        .then(() =>
            res.status(200).json({
                code: 0,
            })
        )
        .catch((error) => {
            res.status(500).json({
                code: 1,
                personal,
                error,
            })
        })
})

module.exports = router
