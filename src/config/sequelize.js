const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME, // Database name
    process.env.DB_USER, // Database user
    process.env.DB_PASSWORD, // Database password
    {
        host: process.env.DB_HOST, // Database host
        dialect: 'postgres', // Database dialect
        port: process.env.DB_PORT, // Database port
        logging: false, // Disable logging; set to true for debugging
    }
);

sequelize.authenticate()
    .then(() => console.log('Sequelize connected to the database successfully'))
    .catch(err => console.error('Sequelize connection error:', err));

module.exports = sequelize;