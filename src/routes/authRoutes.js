const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

// Render login page
router.get('/login', (req, res) => {
    const successMessage = req.session.successMessage;
    req.session.successMessage = null; // Clear the message after use
    
    res.render('auth/login', { 
        errors: [],
        successMessage
    });
});

// Render register page
router.get('/register', (req, res) => {
    res.render('auth/register', { errors: [] });
});

// Handle registration
router.post(
    '/register',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Invalid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['student', 'proctor']).withMessage('Invalid role selected'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('auth/register', { errors: errors.array() });
        }

        const { name, email, password, role } = req.body;

        try {
            // Check if user already exists
            const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (userExists.rows.length > 0) {
                return res.status(400).render('auth/register', { errors: [{ msg: 'Email already registered' }] });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into database with createdAt and updatedAt fields
            const now = new Date();
            await db.query(
                'INSERT INTO users (name, email, password, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
                [name, email, hashedPassword, role, now, now]
            );
            req.session.successMessage = `Registration successful! You can now log in as a ${role}.`;
            res.redirect('/auth/login');
        } catch (err) {
            console.error(err);
            res.status(500).send('Server error');
        }
    }
);

// Handle login
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Invalid email'),
        body('password').notEmpty().withMessage('Password is required'),
        body('role').isIn(['student', 'proctor']).withMessage('Please select a valid role'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('auth/login', { 
                errors: errors.array(),
                successMessage: null
            });
        }

        const { email, password, role } = req.body;

        try {
            // Check if user exists
            const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(400).render('auth/login', { 
                    errors: [{ msg: 'Invalid credentials or incorrect role selected' }],
                    successMessage: null
                });
            }

            // Compare passwords
            const isMatch = await bcrypt.compare(password, user.rows[0].password);
            if (!isMatch) {
                return res.status(400).render('auth/login', { 
                    errors: [{ msg: 'Invalid credentials' }],
                    successMessage: null
                });
            }

            // Successful login
            req.session.user = {
                id: user.rows[0].id,  
                name: user.rows[0].name,
                email: user.rows[0].email,
                role: user.rows[0].role
            };
            console.log('User logged in successfully:', req.session.user);

            if (user.rows[0].role === 'student') {
                res.redirect('/student/dashboard');
            } else if (user.rows[0].role === 'proctor') {
                res.redirect('/proctor/dashboard');
            } else {
                res.redirect('/');
            }
        } catch (err) {
            console.error('Login error:', err);
            res.status(500).render('auth/login', { 
                errors: [{ msg: 'Server error. Please try again.' }],
                successMessage: null
            });
        }
    }
);

module.exports = router;