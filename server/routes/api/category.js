const express = require('express')

const router = express.Router()
const postgre = require('../../services/postgre')

router.post('/list', (req, res) => {
    const { organization_id } = req.body.user
    const is_equipments = req.body.is_equipments || null
    postgre
        .select(
            'tbl_category',
            'category_id, category_name',
            `organization_id=${organization_id} AND activation = 1 AND ${
                is_equipments !== null ? ` is_equipment = ${is_equipments} ` : ` TRUE`
            }`
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

// router.get('/get-organization-by-user', (req, res) => {
//     const { organization_id } = req.body.user
//     postgre
//         .select('tbl_organization', '*', `organization_id = ${organization_id} `)
//         .then(({ rows }) =>
//             res.json({
//                 code: 0,
//                 data: rows,
//             })
//         )
//         .catch((err) =>
//             res.json({
//                 code: 1,
//                 err,
//             })
//         )
// })
// router.post('/free-category', (req, res) => {
//     const { data } = req.body
//     const query = `
//         SELECT *
//         from tbl_facility f1
//         LEFT join (
//             SELECT fac.facility_id, fac.facility_code
//                 FROM tbl_facility fac
//                 INNER JOIN tbl_category ca ON fac.category_id = ca.category_id
//                 INNER JOIN v_event e  ON fac.facility_id = e.facility_id
//                 WHERE ca.category_id = 57
//                 AND  (timestamp with time zone '2019-07-09 12:00:00+07', timestamp with time zone '2019-07-09 17:00:00+07')
//                     OVERLAPS ("start"::timestamp with time zone, "end"::timestamp with time zone)
//         ) as r2 on  r1.facility_id = r2.facility_id
//         where r2.facility_id is null and r1.category_id = 57
//     `
//     postgre
//         .run(query)
//         .then((rows) => {
//             res.json({
//                 code: 0,
//                 data: rows,
//             })
//         })
//         .catch((err) => {
//             res.json({
//                 code: 1,
//                 err,
//             })
//         })
// })
module.exports = router
