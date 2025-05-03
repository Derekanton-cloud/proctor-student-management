const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const query = (text, params) => pool.query(text, params);

const connectDB = async () => {
    try {
        await pool.connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

module.exports = {
    query,
    connectDB,
};