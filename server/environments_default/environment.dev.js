const env = {
    production: false,
    publicKey: 'Y2FsZW5kYXJjc3YwMjAycHVibGlja2V5',
    privateKey: 'calendarcsv0202',
    postgre: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'Csv0202',
        database: 'kaigi',
        max: 10,
        idleTimeoutMillis: 5000,
    },
    apiUrl: 'http://localhost:3000/api',
}

module.exports = env
