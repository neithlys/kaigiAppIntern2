// route
const express = require('express')
const fs = require('fs')
const multer = require('multer')
const db = require('../../../services/postgre')

const router = express.Router()
const upload = multer()
const backgroundDir = 'public/backgrounds'
const defaultBackground = '0_background.jpg'
const hardGeneralSetting = require('../../../common/generalSetting.json')
const hardDefaultSetting = require('../../../common/defaultSetting')

router.post('/', (req, res) => {
    const organization_id = req.body.user.organization_id || null
    db.select('tbl_organization', 'setting', `organization_id = ${organization_id}`)
        .then((finalResult) => {
            if (finalResult.rowCount === 0) {
                return res.status(500).json({
                    code: 1,
                })
            }
            const defaultSetting = finalResult.rows[0].setting
                ? finalResult.rows[0].setting.defaultSetting
                : hardDefaultSetting
            const generalSetting = finalResult.rows[0].setting
                ? finalResult.rows[0].setting.generalSetting
                : hardGeneralSetting
            return res.status(200).json({
                code: 0,
                defaultSetting,
                generalSetting,
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
    const data = (req.body.data && JSON.parse(req.body.data)) || {}
    const { defaultSetting } = data
    const { organization_id } = req.body
    const file = req.file || null
    if (file) {
        const splitFileName = file.originalname.split('.')
        const fileExtension = splitFileName[splitFileName.length - 1]

        try {
            if (
                defaultSetting.background &&
                defaultSetting.background !== defaultBackground &&
                /^\d_background\.\w{3}$/.test(defaultSetting.background)
            ) {
                fs.unlinkSync(`${backgroundDir}/${defaultSetting.background}`)
            }
            fs.writeFileSync(`${backgroundDir}/default_${organization_id}_background.${fileExtension}`, file.buffer)
            defaultSetting.background = `default_${organization_id}_background.${fileExtension}`
        } catch (error) {
            res.status(500).json({
                code: 1,
                error,
            })
            return
        }
    }
    const { need_check_in, home_page } = data.generalSetting
    delete data.generalSetting.need_check_in
    const query = `
        UPDATE tbl_organization SET setting = '${JSON.stringify(
            data
        )}'::jsonb, need_check_in = '${need_check_in}', home_page = '${home_page}'
        WHERE organization_id = ${organization_id};
    `
    db.run(query)
        .then(() =>
            res.status(200).json({
                code: 0,
                generalSetting: data.generalSetting,
            })
        )
        .catch((error) => {
            res.status(500).json({
                code: 1,
                error,
            })
        })
})

module.exports = router
