const crypto = require('crypto')

const salt = 'app@calendar'

const getHash = (str) => {
    const hash = crypto.createHash('SHA256')
    hash.update(str + salt)
    return hash.digest('hex')
}

module.exports = getHash
