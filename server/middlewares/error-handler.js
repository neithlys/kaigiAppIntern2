const env = require('../environments')

const errorHandler = (err, req, res) => {
    return res.status(500).json(
        (env.production && {
            error: 'Internal Server Error',
        }) || {
            err,
        }
    )
}

module.exports = errorHandler
