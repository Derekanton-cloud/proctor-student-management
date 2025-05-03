const Student = require('../models/studentModel');

// Function to get the student dashboard
exports.getDashboard = async (req, res) => {
    try {
        const studentId = req.user.id; // Assuming user ID is stored in req.user
        const studentData = await Student.findOne({ where: { userId: studentId } }); // Use Sequelize's `findOne`
        if (!studentData) {
            return res.status(404).send('Student not found');
        }
        res.render('student/dashboard', { student: studentData });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
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