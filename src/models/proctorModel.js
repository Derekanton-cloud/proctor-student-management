const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Proctor extends Model {}

Proctor.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'proctor'
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Proctor',
    tableName: 'proctors',
    timestamps: true
});

module.exports = Proctor;