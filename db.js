const mysql = require("mysql2");
require('dotenv').config();


const db = mysql.createConnection({

    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME

});

db.connect((error) => {
    if(error) throw error;
    console.log("Conexion a la BD exitosa.")

});

module.exports = db;