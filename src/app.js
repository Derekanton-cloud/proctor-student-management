const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const proctorRoutes = require('./routes/proctorRoutes');
const { connectDB } = require('./config/db');

const app = express();

// Connect to the database
connectDB();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/auth', authRoutes);
app.use('/students', studentRoutes);
app.use('/proctors', proctorRoutes);

// Home route
app.get('/', (req, res) => {
    res.render('layouts/main', { title: 'DBMS Proctor-Student Management' });
});

// Error handling
app.use((req, res, next) => {
    res.status(404).send('404 Not Found');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});