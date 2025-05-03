const { body, validationResult } = require('express-validator');

const validationMiddleware = {
    registerValidation: [
        body('username').notEmpty().withMessage('Username is required'),
        body('email').isEmail().withMessage('Invalid email format'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
    ],

    assignmentSubmissionValidation: [
        body('assignmentTitle').notEmpty().withMessage('Assignment title is required'),
        body('assignmentContent').notEmpty().withMessage('Assignment content cannot be empty')
    ],

    validate: (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
};

module.exports = validationMiddleware;