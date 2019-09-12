const cron = require('node-cron')
const fetch = require('node-fetch')
const environments = require('./environments')

cron.schedule('*/5 * * * *', () => {
    fetch(`${environments.apiUrl}/event/auto-end`, {
        method: 'GET',
    }).then(() => {}, () => {})
})

// cron.schedule('*/5 * * * *', () => {
//     fetch(`${environments.apiUrl}/event/auto-end`, {
//         method: 'GET',
//     }).then(() => {}, () => {})
// })
