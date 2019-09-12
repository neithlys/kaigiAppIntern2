const pg = require('pg')
const env = require('../environments')

const value = (v) => {
    const original = ['TRUE', 'FALSE', 'now()']
    if (v === null || v === undefined || v === '') return 'null'
    if (typeof v === 'boolean') return (v && 'TRUE') || 'FALSE'
    if (typeof v === 'object') return `'${JSON.stringify(v)}'`
    if (typeof v === 'string' && !original.includes(v)) return `'${v.trim()}'`
    return v
}

const postgre = {
    value,
    run(query) {
        const pool = new pg.Pool(env.postgre)
        let poolClient = null
        let result = null
        let error = null
        return pool
            .connect()
            .then((pc) => {
                poolClient = pc
            })
            .then(() => poolClient.query(query))
            .then((rs) => {
                result = rs
            })
            .catch((e) => {
                error = e
            })
            .then(() => {
                if (poolClient !== null)
                    poolClient.release((err) => {
                        if (err) {
                            // cant not release PoolClient
                            throw err
                        }
                    })
                if (error !== null) {
                    // query fail
                    throw error
                }
                return result
            })
    },
    select(table_name, fields = '*', condition = 'TRUE', order = null, limit = null) {
        const fieldList = (Array.isArray(fields) && fields.map((field) => `'${field}'`)) || fields
        const query = `SELECT ${fieldList} FROM ${table_name} WHERE ${condition} ${(order && `order by ${order}`) ||
            ''} ${(limit && `limit ${limit}`) || ''};`
        return this.run(query)
    },
    insert(table_name, rows, fields = []) {
        const fieldList = (Array.isArray(fields) && [...fields]) || []
        if (fieldList.length === 0) {
            Object.keys(rows[0]).forEach((e) => fieldList.push(e))
        }
        // const x = fieldList.map((field) => value(rows[0][field]))
        const query = `INSERT INTO ${table_name} (${fieldList}) VALUES ${rows.map(
            (item) => `(${fieldList.map((field) => value(item[field]))})`
        )};`
        return this.run(query)
    },
    // patch: function(table_name, rows, fields = [], unique_keys = []) { },
    update(table_name, object, condition = 'FALSE') {
        const newSet = []
        Object.keys(object).forEach((prop) => {
            if (object[prop] !== undefined) newSet.push(`${prop}=${value(object[prop])}`)
        })

        const query = `UPDATE ${table_name} SET ${newSet} WHERE ${condition};`
        return this.run(query)
    },
    delete(table_name, condition = 'FALSE') {
        const query = `DELETE FROM ${table_name} WHERE ${condition};`
        return this.run(query)
    },
}

module.exports = postgre
