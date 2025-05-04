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

exports.aiAnalysis = (req, res) => {
    res.redirect('/ai/proctor/analysis');
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


exports.assignStudent = async (req, res) => {
    try {
        const { studentId } = req.body;
        const proctorId = req.session.user.id;
        
        // Check if student exists and is not already assigned
        const studentCheck = await db.query(
            'SELECT * FROM users WHERE id = $1 AND role = $2',
            [studentId, 'student']
        );
        
        if (studentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Update the student's proctor_id
        await db.query(
            'UPDATE users SET proctor_id = $1 WHERE id = $2',
            [proctorId, studentId]
        );
        
        res.json({
            success: true,
            message: 'Student successfully assigned to you'
        });
    } catch (error) {
        console.error('Error assigning student:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while assigning the student'
        });
    }
};

// Get unassigned students
exports.getUnassignedStudents = async (req, res) => {
    try {
        const unassignedStudents = await db.query(
            'SELECT id, name, email, batch, current_semester, section, roll_number FROM users WHERE role = $1 AND proctor_id IS NULL',
            ['student']
        );
        
        res.json({
            success: true,
            students: unassignedStudents.rows
        });
    } catch (error) {
        console.error('Error getting unassigned students:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while getting unassigned students'
        });
    }
};