const Proctor = require('../models/proctorModel');
const db = require('../config/db');

// Get proctor dashboard
exports.getProctorDashboard = async (req, res) => {
    try {
        // Make sure user exists in session
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }
        
        // Log for debugging
        console.log('Proctor session:', req.session.user);
        
        // Render dashboard with user data
        res.render('proctor/dashboard', {
            user: req.session.user,
            title: 'Proctor Dashboard'
        });
    } catch (error) {
        console.error('Error in proctor dashboard:', error);
        res.status(500).send('An error occurred loading the dashboard: ' + error.message);
    }
};

// View student performance
exports.viewStudentPerformance = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        
        // Simple implementation - will need to be expanded
        res.render('proctor/student-performance', {
            user: req.session.user,
            title: 'Student Performance',
            studentId,
            performance: []
        });
    } catch (error) {
        console.error('Error viewing student performance:', error);
        res.status(500).send('An error occurred');
    }
};

// Write remarks for a student
exports.writeRemarks = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const { remarks } = req.body;
        
        // Simple implementation - will need to store in database
        console.log(`Writing remarks for student ${studentId}: ${remarks}`);
        
        res.redirect(`/proctor/performance/${studentId}`);
    } catch (error) {
        console.error('Error writing remarks:', error);
        res.status(500).send('An error occurred');
    }
};