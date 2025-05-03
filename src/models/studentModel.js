const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Import the Sequelize instance

const Student = sequelize.define('Student', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    proctorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    assignments: {
        type: DataTypes.JSONB,
        defaultValue: [],
    },
    marks: {
        type: DataTypes.JSONB,
        defaultValue: [],
    },
    diary: {
        type: DataTypes.TEXT,
        defaultValue: '',
    },
}, {
    tableName: 'students', // Optional: Specify the table name
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
});

module.exports = Student;