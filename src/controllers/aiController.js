const aiService = require('../services/aiService');
const studentService = require('../services/studentService');

// Enhanced error handling and logging for analyzeStudent
exports.analyzeStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required' 
      });
    }

    const studentData = await studentService.getStudentData(studentId);

    if (!studentData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Validate required fields
    // Ensure all required fields are present, assign default values if missing
    const { name = 'Unknown', batch, section, cgpa, attendance } = studentData;

    if (!batch || !section || !cgpa || !attendance) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete student data. Please ensure all fields (batch, section, CGPA, attendance) are filled.'
      });
    }

    const analysis = await aiService.analyzeStudentPerformance(studentData);

    if (!analysis) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to analyze student data' 
      });
    }

    return res.status(200).json({
      success: true,
      analysis: analysis.analysis,
      sections: analysis.sections
    });
  } catch (error) {
    console.error('Error in analyzeStudent:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during analysis',
      error: error.message
    });
  }
};

exports.getFullAnalysis = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // Get comprehensive student data with historical performance
    const studentData = await studentService.getStudentDataWithHistory(studentId);
    
    // If student data couldn't be found, return an error
    if (!studentData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    
    // Call the AI service to analyze the student data
    const analysis = await aiService.analyzeStudentPerformance(studentData);
    
    // Return the full analysis
    return res.status(200).json({
      success: true,
      studentName: studentData.name,
      analysis: analysis.analysis,
      sections: analysis.sections,
      performanceData: {
        cgpa: studentData.cgpa,
        attendance: studentData.attendance,
        semesterProgress: studentData.semesterProgress
      }
    });
  } catch (error) {
    console.error('Error in full AI analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during analysis',
      error: error.message
    });
  }
};

// AI-powered performance insights
exports.performanceInsights = async (req, res) => {
  try {
    const { studentId } = req.body;
    const studentData = await studentService.getStudentData(studentId);
    if (!studentData) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const insights = await aiService.analyzeStudentPerformance(studentData);
    return res.status(200).json({ success: true, insights });
  } catch (error) {
    console.error('Error in performanceInsights:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate performance insights', error: error.message });
  }
};

// AI-powered pattern detection
exports.patternDetection = async (req, res) => {
  try {
    const { studentId } = req.body;
    const studentData = await studentService.getStudentData(studentId);
    if (!studentData) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    // Use a custom prompt for pattern detection
    const patternPrompt = aiService.formatAnalysisPrompt(studentData) + '\n\nFocus on identifying academic or behavioral patterns, trends, or anomalies.';
    const patternResult = await aiService.analyzeStudentPerformance({ ...studentData, customPrompt: patternPrompt });
    return res.status(200).json({ success: true, patterns: patternResult });
  } catch (error) {
    console.error('Error in patternDetection:', error);
    return res.status(500).json({ success: false, message: 'Failed to detect patterns', error: error.message });
  }
};

// AI-powered custom recommendations
exports.customRecommendations = async (req, res) => {
  try {
    const { studentId, context } = req.body;
    const studentData = await studentService.getStudentData(studentId);
    if (!studentData) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    // Use a custom prompt for recommendations
    let prompt = aiService.formatAnalysisPrompt(studentData) + '\n\nProvide actionable, personalized recommendations for the following context: ' + (context || 'general academic improvement') + '.';
    const recResult = await aiService.analyzeStudentPerformance({ ...studentData, customPrompt: prompt });
    return res.status(200).json({ success: true, recommendations: recResult });
  } catch (error) {
    console.error('Error in customRecommendations:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate recommendations', error: error.message });
  }
};