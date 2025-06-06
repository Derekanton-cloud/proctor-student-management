const express = require('express');
const router = express.Router();
const proctorController = require('../controllers/proctorController');
const { isAuthenticated, isProctor } = require('../middlewares/authMiddleware');
const db = require('../config/db');

// Define default controller methods if they don't exist
if (!proctorController.getProctorDashboard) {
    proctorController.getProctorDashboard = (req, res) => {
        res.render('proctor/dashboard', {
            user: req.session.user,
            title: 'Proctor Dashboard'
        });
    };
}

if (!proctorController.viewStudentPerformance) {
    proctorController.viewStudentPerformance = (req, res) => {
        res.render('proctor/student-performance', {
            user: req.session.user,
            title: 'Student Performance',
            studentId: req.params.studentId,
            performance: []
        });
    };
}

if (!proctorController.writeRemarks) {
    proctorController.writeRemarks = (req, res) => {
        // This would typically process form data and save to database
        res.redirect(`/proctor/performance/${req.params.studentId}`);
    };
}

// Apply middleware to all routes
router.use(isAuthenticated);
router.use(isProctor);

//-----------------------------------------------------
// Page Routes (HTML/Views)
//-----------------------------------------------------

// Route to get proctor dashboard
router.get('/dashboard', proctorController.getProctorDashboard);

// Route to view student performance
router.get('/performance/:studentId', proctorController.viewStudentPerformance);

// Route to write remarks for a student
router.post('/performance/:studentId/remarks', proctorController.writeRemarks);

// AI Analysis redirect
router.get('/ai-analysis', proctorController.aiAnalysis);

//-----------------------------------------------------
// API Routes (JSON)
//-----------------------------------------------------

// Get all students (for dropdowns and selection)
router.get('/api/proctor/students', proctorController.getStudentsAPI);

// Student assignment management
router.get('/api/assigned-students', proctorController.getAssignedStudents);
router.get('/api/unassigned-students', proctorController.getUnassignedStudents);
router.post('/assign-student', proctorController.assignStudent);
router.post('/remove-student', proctorController.removeStudent);

// Student performance data
router.get('/student-performance/:studentId', proctorController.getStudentPerformance);

// Announcements
router.post('/api/announcements', isAuthenticated, isProctor, proctorController.createAnnouncement);
router.get('/api/announcements', isAuthenticated, isProctor, proctorController.getProctorAnnouncements);

// Student profile API routes
router.get('/api/student/:studentId', isAuthenticated, isProctor, proctorController.getStudentProfile);
router.get('/api/student/:studentId/notes', isAuthenticated, isProctor, proctorController.getStudentNotes);
router.post('/api/student/:studentId/notes', isAuthenticated, isProctor, proctorController.saveStudentNote);
// Get student performance data
router.get('/api/student/:studentId/performance', isAuthenticated, isProctor, proctorController.getStudentPerformanceData);

router.get('/analysis', isAuthenticated, isProctor, proctorController.getStudentAnalysisPage);

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
});

module.exports = router;