const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const dotenv = require('dotenv');
const db = require('./src/config/db');
const sequelize = require('./src/config/sequelize'); 
const Student = require('./src/models/studentModel'); 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
db.connectDB();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret', // Fallback for SESSION_SECRET
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'src/public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Routes
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const proctorRoutes = require('./src/routes/proctorRoutes');
const aiRoutes = require('./src/routes/aiRoutes');

// Redirect root URL to login page
app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/proctor', proctorRoutes);
app.use('/ai', aiRoutes);
app.use('/', authRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});