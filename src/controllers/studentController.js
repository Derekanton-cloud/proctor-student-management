const Student = require('../models/studentModel');
const db = require('../config/db');

// Function to get the student dashboard
exports.getDashboard = async (req, res) => {
    try {
        // Safety check for user session
        if (!req.session || !req.session.user || !req.session.user.id) {
            console.log('Missing user in session:', req.session);
            return res.redirect('/auth/login');
        }

        // Fetch student details from database
        const userId = req.session.user.id;
        const studentDetails = await db.query(
            'SELECT * FROM users WHERE id = $1 AND role = $2',
            [userId, 'student']
        );

        // Render dashboard with user data
        res.render('student/dashboard', {
            title: 'Student Dashboard',
            user: req.session.user,
            // Additional data you might want to pass to the view
            studentDetails: studentDetails.rows[0] || {}
        });
    } catch (error) {
        console.error('Error in student dashboard:', error);
        res.status(500).render('error', {
            message: 'Error loading dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

exports.aiAssistant = (req, res) => {
    res.redirect('/ai/student/assistant');
};

// Function to view assignments
exports.viewAssignments = async (req, res) => {
    try {
        const studentId = req.user.id;
        const studentData = await Student.findOne({ where: { userId: studentId } });
        if (!studentData) {
            return res.status(404).send('Student not found');
        }
        const assignments = studentData.assignments || []; // Assuming assignments are stored as JSONB
        res.render('student/assignments', { assignments });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Function to submit an assignment
exports.submitAssignment = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { assignmentId, submissionData } = req.body;

        const studentData = await Student.findOne({ where: { userId: studentId } });
        if (!studentData) {
            return res.status(404).send('Student not found');
        }

        // Update the assignments field (assuming it's JSONB)
        const updatedAssignments = studentData.assignments.map((assignment) => {
            if (assignment.id === assignmentId) {
                return { ...assignment, submissionData, status: 'submitted' };
            }
            return assignment;
        });

        studentData.assignments = updatedAssignments;
        await studentData.save();

        res.redirect('/student/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Function to view performance metrics
exports.viewPerformance = async (req, res) => {
    try {
        const studentId = req.user.id;
        const studentData = await Student.findOne({ where: { userId: studentId } });
        if (!studentData) {
            return res.status(404).send('Student not found');
        }
        const performance = studentData.marks || []; // Assuming marks are stored as JSONB
        res.render('student/performance', { performance });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};