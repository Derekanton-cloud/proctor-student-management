const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { isAuthenticated, isStudent } = require('../middlewares/authMiddleware');

// Default controller methods if they don't exist yet
if (!studentController.getDashboard) {
    studentController.getDashboard = (req, res) => {
        try {
            // Make sure user exists in session
            if (!req.session.user) {
                return res.redirect('/auth/login');
            }

            // Log for debugging
            console.log('User session:', req.session.user);

            res.render('student/dashboard', {
                user: req.session.user,
                title: 'Student Dashboard'
            });
        } catch (error) {
            console.error('Error in student dashboard:', error);
            res.status(500).send('An error occurred rendering the dashboard');
        }
    };
}

if (!studentController.viewAssignments) {
    studentController.viewAssignments = (req, res) => {
        res.render('student/assignments', {
            user: req.session.user,
            title: 'Assignments',
            assignments: []
        });
    };
}

if (!studentController.submitAssignment) {
    studentController.submitAssignment = (req, res) => {
        // This would typically process form data and save to database
        res.redirect('/student/assignments');
    };
}

if (!studentController.viewPerformance) {
    studentController.viewPerformance = (req, res) => {
        res.render('student/performance', {
            user: req.session.user,
            title: 'Performance Metrics',
            metrics: []
        });
    };
}

// Apply authentication middleware to all routes in this router
router.use(isAuthenticated);
router.use(isStudent);

// Route to get student dashboard
router.get('/dashboard', studentController.getDashboard);

// Route to view assignments
router.get('/assignments', studentController.viewAssignments);

// Route to submit an assignment
router.post('/assignments/submit', studentController.submitAssignment);

// Route to view performance metrics
router.get('/performance', studentController.viewPerformance);

router.post('/api/performance', isAuthenticated, isStudent, studentController.savePerformanceData);
router.get('/api/performance', isAuthenticated, isStudent, studentController.getPerformanceData);

router.get('/profile', isAuthenticated, isStudent, studentController.getProfile);
router.post('/profile/update', isAuthenticated, isStudent, studentController.updateProfile);

module.exports = router;