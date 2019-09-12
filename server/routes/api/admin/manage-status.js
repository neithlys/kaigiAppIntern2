const express = require('express')

const router = express.Router()
const db = require('../../../services/postgre')

router.post('/list', (req, res) => {
    const { organization_id } = req.body.user
    const sql = `
        SELECT sta.status_name
        FROM tbl_status sta
        INNER JOIN tbl_organization_status org_sta ON org_sta.status_id = sta.status_id
        WHERE org_sta.organization_id = ${organization_id}
            AND org_sta.is_being_used = TRUE
    `
    db.run(sql)
        .then((result) => {
            return res.status(200).json({
                code: 0,
                data: result.rows,
            })
        })
        .catch((error) => {
            return res.status(500).json({
                code: 1,
                error,
            })
        })
})

module.exports = router
