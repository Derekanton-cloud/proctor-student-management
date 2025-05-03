const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

// Render login page
router.get('/login', (req, res) => {
    res.render('auth/login');
});

// Render register page
router.get('/register', (req, res) => {
    res.render('auth/register');
});

// Handle registration
router.post(
    '/register',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Invalid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('auth/register', { errors: errors.array() });
        }

        const { name, email, password } = req.body;

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
                [name, email, hashedPassword, 'student', now, now]
            );

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
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('auth/login', { errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Check if user exists
            const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(400).render('auth/login', { errors: [{ msg: 'Invalid credentials' }] });
            }

            // Compare passwords
            const isMatch = await bcrypt.compare(password, user.rows[0].password);
            if (!isMatch) {
                return res.status(400).render('auth/login', { errors: [{ msg: 'Invalid credentials' }] });
            }

            // Successful login
            req.session.user = {
                id: user.rows[0].id,  // Make sure this exists!
                name: user.rows[0].name,
                email: user.rows[0].email,
                role: user.rows[0].role
            };
            res.redirect('/student/dashboard'); // Redirect to student dashboard (or proctor dashboard based on role)
        } catch (err) {
            console.error(err);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;