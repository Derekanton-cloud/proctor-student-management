const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authMiddleware = (role) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: 'Unauthorized access' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized access' });
            }

            if (role && req.user.role !== role) {
                return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Unauthorized access' });
        }
    };
};

module.exports = authMiddleware;