const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { isAuthenticated, isProctor } = require('../middlewares/authMiddleware');

console.log("aiRoutes loaded");
// Quick student analysis endpoint
router.post('/proctor/analyze-student', (req, res, next) => {
  console.log("POST /ai/proctor/analyze-student hit");
  aiController.analyzeStudent(req, res, next);
});
// Full student analysis endpoint 
router.get('/proctor/full-analysis/:studentId', isAuthenticated, isProctor, aiController.getFullAnalysis);

// Student can request their own analysis
router.get('/student/my-analysis', isAuthenticated, async (req, res) => {
  try {
    // Student can only request their own analysis
    const studentId = req.user.id;
    
    // Redirect to the controller with the student's own ID
    req.params.studentId = studentId;
    return aiController.getFullAnalysis(req, res);
  } catch (error) {
    console.error('Error getting student analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis',
      error: error.message
    });
  }
});

// AI endpoints for proctor
router.post('/proctor/api/ai/performance-insights', isAuthenticated, isProctor, aiController.performanceInsights);
router.post('/proctor/api/ai/pattern-detection', isAuthenticated, isProctor, aiController.patternDetection);
router.post('/proctor/api/ai/custom-recommendations', isAuthenticated, isProctor, aiController.customRecommendations);

module.exports = router;