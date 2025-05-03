const Proctor = require('../models/proctorModel');
const Student = require('../models/studentModel');

// Function to get proctor dashboard data
exports.getProctorDashboard = async (req, res) => {
    try {
        const proctorId = req.user.id; // Assuming user ID is stored in req.user
        const students = await Student.findAll({ where: { proctorId } });
        res.render('proctor/dashboard', { students });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching proctor dashboard data', error });
    }
};

// Function to view student performance
exports.viewStudentPerformance = async (req, res) => {
    try {
        const studentId = req.params.id;
        const studentPerformance = await Student.findByPk(studentId);
        if (!studentPerformance) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.render('proctor/performance', { studentPerformance });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student performance data', error });
    }
};

// Function to write remarks for a student
exports.writeRemarks = async (req, res) => {
    try {
        const { studentId, remarks } = req.body;
        await Student.update({ remarks }, { where: { id: studentId } });
        res.status(200).json({ message: 'Remarks updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating remarks', error });
    }
};