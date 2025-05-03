const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Import the Sequelize instance

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'student', // Default role is 'student'
    },
}, {
    tableName: 'users', // Optional: Specify the table name
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
});

module.exports = User;