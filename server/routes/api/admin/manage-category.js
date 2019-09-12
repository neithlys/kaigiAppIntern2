const express = require('express')
const fs = require('fs')

const multer = require('multer')

const router = express.Router()
const upload = multer()
const db = require('../../../services/postgre')

const categoryImageDir = 'public/icons'
const defaultCategoryImage = '0_0_image.jpg'

router.post('/list', (req, res) => {
    const { organization_id } = req.body.user
    const categoryId = (req.body.category_id && req.body.category_id.length > 0 && req.body.category_id) || []
    const activation = req.body.activation || null
    const isEquipment = req.body.isEquipment || null
    db.select(
        'tbl_category',
        '*',
        `${categoryId.length > 0 ? `category_id IN (${categoryId.join(', ')})` : 'TRUE'} AND ${
            activation !== null ? `activation = ${activation}` : ' TRUE '
        } AND ${
            isEquipment !== null ? `is_equipment = ${isEquipment}` : ' TRUE '
        } AND organization_id = ${organization_id} ORDER BY category_id`
    )
        .then((result) => {
            res.status(200).json({
                code: 0,
                data: result.rowCount > 0 ? result.rows : [],
            })
        })
        .catch(() => {
            res.status(500).json({
                code: 1,
                data: [],
            })
        })
})

router.post('/insert', upload.single('file'), (req, res) => {
    const data = (req.body.data && JSON.parse(req.body.data)) || {}
    const file = req.file || null

    if (file) {
        const splitFileName = file.originalname.split('.')
        const fileExtension = splitFileName[splitFileName.length - 1]
        try {
            if (
                data.facility_image_url &&
                data.facility_image_url !== defaultCategoryImage &&
                /^\d_\d_image\.\w{3}$/.test(data.facility_image_url)
            ) {
                fs.unlinkSync(`${categoryImageDir}/${data.organization_id}_${data.facility_image_url}`)
            }
            fs.writeFileSync(
                `${categoryImageDir}/${data.organization_id}_${data.category_id}.${fileExtension}`,
                file.buffer
            )
            data.category_image_url = `${data.organization_id}_${data.category_id}.${fileExtension}`
        } catch (error) {
            res.status(500).json({
                code: 1,
                error,
            })
            return
        }
    }

    const object = {
        ...data,
        organization_id: data.organization_id,
        created_by: data.user_id,
    }

    delete object.category_id
    delete object.user_id
    const fieldName = Object.keys(object)
    const fieldValue = fieldName.map((item) => db.value(object[item]))
    db.run(`INSERT INTO tbl_category(${fieldName.join(', ')}) VALUES (${fieldValue.join(', ')})`)
        .then((result) => {
            if (result.rowCount === 0) throw new Error('')
            else {
                res.status(200).json({
                    code: 0,
                })
            }
        })
        .catch(() =>
            res.status(500).json({
                code: 1,
            })
        )
})

router.post('/update', upload.single('file'), (req, res) => {
    const data = (req.body.data && JSON.parse(req.body.data)) || {}
    const file = req.file || null
    if (file) {
        const splitFileName = file.originalname.split('.')
        const fileExtension = splitFileName[splitFileName.length - 1]
        try {
            if (
                data.category_image_url &&
                data.category_image_url !== defaultCategoryImage &&
                /^\d_\d_image\.\w{3}$/.test(data.category_image_url)
            ) {
                fs.unlinkSync(`${categoryImageDir}/${data.organization_id}_${data.category_image_url}`)
            }
            fs.writeFileSync(
                `${categoryImageDir}/${data.organization_id}_${data.category_id}.${fileExtension}`,
                file.buffer
            )
            data.category_image_url = `${data.organization_id}_${data.category_id}.${fileExtension}`
        } catch (error) {
            res.status(500).json({
                code: 1,
                error,
            })
            return
        }
    }
    // else if(img_delete === true){

    // }

    delete data.user_id
    db.update('tbl_category', data, `category_id = ${data.category_id}`)
        .then(() => {
            /*
                Xử lý khi người dùng deactivate category nào đó
                Xóa category đó ra khỏi cột equipments của tất cả các category khác (nếu có)
            */
            if (data.activation === 0) {
                const sql1 = `
                    SELECT category_id, equipments
                    FROM tbl_category
                `
                return db.run(sql1).then((result1) => {
                    const data1 = result1.rows
                    let sql2 = 'SELECT;'

                    /*
                        Loại category bị deactive ra khỏi cội equipments của những category khác
                    */
                    data1.forEach((e) => {
                        if (e.equipments.includes(data.category_id)) {
                            const newEquipments = e.equipments.filter((e1) => e1 !== data.category_id)
                            sql2 += `
                                UPDATE tbl_category
                                SET equipments = ${JSON.stringify(newEquipments)};
                            `
                        }
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
        .catch((error) => {
            res.status(500).json({
                code: 1,
                error,
            })
        })
})
router.post('/delete-image', (req, res) => {
    const { facility_id, category_image_url } = req.body.params
    fs.unlinkSync(`${categoryImageDir}/${category_image_url}`)
    const sql = `
        UPDATE tbl_facility
        SET category_image_url = null
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
module.exports = router
