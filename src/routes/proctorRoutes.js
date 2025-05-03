const express = require('express');
const router = express.Router();
const proctorController = require('../controllers/proctorController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route to get proctor dashboard
router.get('/dashboard', authMiddleware('proctor'), proctorController.getProctorDashboard);

// Route to view student performance
router.get('/performance/:studentId', authMiddleware('proctor'), proctorController.viewStudentPerformance);

// Route to write remarks for a student
router.post('/performance/:studentId/remarks', authMiddleware('proctor'), proctorController.writeRemarks);

module.exports = router;
