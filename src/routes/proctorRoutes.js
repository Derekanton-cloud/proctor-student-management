const express = require('express');
const router = express.Router();
const proctorController = require('../controllers/proctorController');
const { isAuthenticated, isProctor } = require('../middlewares/authMiddleware');

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

// Route to get proctor dashboard
router.get('/dashboard', proctorController.getProctorDashboard);

// Route to view student performance
router.get('/performance/:studentId', proctorController.viewStudentPerformance);

// Route to write remarks for a student
router.post('/performance/:studentId/remarks', proctorController.writeRemarks);

router.get('/api/proctor/students', isAuthenticated, isProctor, async (req, res) => {
    try {
        const proctorId = req.session.user.id;
        
        // Query to get students assigned to this proctor
        // This is a simplified version - adapt it to your database schema
        const students = await db.query(
            'SELECT id, name FROM users WHERE role = $1',
            ['student']
        );
        
        res.json({ students: students.rows });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ 
            error: 'Failed to fetch students',
            message: error.message
        });
    }
});

router.post('/assign-student', isAuthenticated, isProctor, proctorController.assignStudent);
router.get('/unassigned-students', isAuthenticated, isProctor, proctorController.getUnassignedStudents);

module.exports = router;