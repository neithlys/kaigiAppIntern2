const express = require('express')

const router = express.Router()
const db = require('../../services/postgre')

router.post('/list', (req, res) => {
    db.select(
        'tbl_location',
        'location_id,location_name',
        `organization_id=${req.body.user.organization_id} and activation = 1`
    )
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
