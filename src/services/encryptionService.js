const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const saltRounds = 10;

// Function to encrypt a password
const encryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
};

// Function to validate a password
const validatePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Function to generate a JWT token
const generateToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Function to verify a JWT token
const verifyToken = async (token) => {
    const verify = promisify(jwt.verify);
    return await verify(token, process.env.JWT_SECRET);
};

module.exports = {
    encryptPassword,
    validatePassword,
    generateToken,
    verifyToken
};