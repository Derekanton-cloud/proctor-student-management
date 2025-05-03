const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Ensure all controller methods exist before using them
if (!studentController.getDashboard) {
    studentController.getDashboard = (req, res) => res.send('Student Dashboard');
}
if (!studentController.viewAssignments) {
    studentController.viewAssignments = (req, res) => res.send('View Assignments');
}
if (!studentController.submitAssignment) {
    studentController.submitAssignment = (req, res) => res.send('Submit Assignment');
}
if (!studentController.viewPerformance) {
    studentController.viewPerformance = (req, res) => res.send('View Performance');
}

// Route to get student dashboard
router.get('/dashboard', authMiddleware(), studentController.getDashboard);

// Route to view assignments
router.get('/assignments', authMiddleware(), studentController.viewAssignments);

// Route to submit an assignment
router.post('/assignments/submit', authMiddleware(), studentController.submitAssignment);

// Route to view performance metrics
router.get('/performance', authMiddleware(), studentController.viewPerformance);

module.exports = router;