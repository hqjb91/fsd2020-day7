// Load libraries
const express = require('express');
const hbs = require('express-handlebars');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configure ports
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

// Create pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'playstore',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: 4,
    timezone: '+08:00'
});

// SQL
const SQL_GET_APP_CATEGORIES = 'select distinct(category) from apps';

// Create instance of express
const app = express();

// Configure handlebars
app.engine('hbs', hbs({defaultLayout:'default.hbs'}));
app.set('view engine', 'hbs');

// Configure the application
app.get('/', async (req, res) => {
    const conn = await pool.getConnection();

    try {
        const results = await conn.query(SQL_GET_APP_CATEGORIES);
        const cats = results[0];

        res.status(200);
        res.type('text/html');
        res.render('index', {category: cats});
    } catch(e) {
        res.status(500);
        res.type('text/html');
        res.send(JSON.stringify(e));
    } finally {
        conn.release();
    }
});

// Start the server
pool.getConnection()
    .then(conn => {
        console.log('Pinging database...');
        const p1 = Promise.resolve(conn);
        const p2 = conn.ping();
        return Promise.all([ p1, p2 ]);
    })
    .then(( results ) => { //results is an array of p1 and p2
        const conn = results[0];
        conn.release();
        app.listen(PORT, () => {
            console.log(`Server has started on port ${PORT} at ${new Date()}.`);
        });
    })
    .catch(e => console.log(e));


    // Cannot do :
    // pool.getConnection()
    //     .then((conn) => {
    //         return [conn, conn.ping()];
    //     })... Because conn.ping() returns a promise and conn doesnt. Therefore we need to wrap conn in a promise.
    // 
    // Promise.all([p1, p2, p3]) / Promise.race([p1, p2, p3]) is the only way in javascript to run the functions in parallel, async awaits uses this