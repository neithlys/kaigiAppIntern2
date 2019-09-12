const express = require('express')

const app = express()
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const cors = require('cors')

const fs = require('fs')
const environments = require('./environments')
const router = require('./routes')

// setup folder

if (!fs.existsSync(path.join(__dirname, './public'))) {
    fs.mkdirSync(path.join(__dirname, './public'))
}
if (!fs.existsSync(path.join(__dirname, './public/backgrounds'))) {
    fs.mkdirSync(path.join(__dirname, './public/backgrounds'))
}

app.set('port', environments.PORT)
app.use(cors())
app.use(logger('dev'))
// Set limit data transfer to 5mb
app.use(express.json({ limit: 5000000 }))
app.use(
    express.urlencoded({
        limit: 5000000,
        extended: false,
    })
)
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'web')))

// router problem
app.use('/', router)

// render

process.on('uncaughtException', (err) => {
    console.log(' UNCAUGHT EXCEPTION ')
    console.log(`[Inside 'uncaughtException' event] ${err.stack}` || err.message)
})

// Dev
app.listen(3003, '0.0.0.0', () => console.log('im listening'))

// Deploy without SSL
// const http = require('http')
// const httpServer = http.createServer(app)
// httpServer.listen(80)

// Deploy with SSL
// const https = require('https')
// const privateKey  = fs.readFileSync(path.join(__dirname, './ssl/server.key'), 'utf8')
// const certificate = fs.readFileSync(path.join(__dirname, './ssl/server.crt'), 'utf8')
// const credentials = {key: privateKey, cert: certificate}
// const httpsServer = https.createServer(credentials, app)
// httpsServer.listen(443)
