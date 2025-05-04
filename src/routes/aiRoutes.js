const express = require('express');
const router = express.Router();
const { HfInference } = require('@huggingface/inference');
const asyncHandler = require('express-async-handler');
const { isAuthenticated, isStudent, isProctor } = require('../middlewares/authMiddleware');

// Initialize Hugging Face client
const hf = new HfInference(process.env.HF_API_TOKEN);

// Student AI Assistant route
router.get('/student/assistant', isAuthenticated, isStudent, (req, res) => {
    res.render('ai/student-assistant', {
        user: req.session.user,
        title: 'AI Study Assistant'
    });
});

// Student AI Assistant API endpoint
router.post('/student/assistant/ask', isAuthenticated, isStudent, asyncHandler(async (req, res) => {
    const { question, subject = 'general' } = req.body;
    
    // Create a contextual prompt based on the subject
    const prompt = `As an AI tutor specializing in ${subject}, please help the student with this question: ${question}`;
    
    try {
        // Using a free and capable model from Hugging Face
        const response = await hf.textGeneration({
            model: 'facebook/bart-large-cnn', // A good free model for short answers
            inputs: prompt,
            parameters: {
                max_new_tokens: 150,
                temperature: 0.7,
                return_full_text: false
            }
        });
        
        res.json({ answer: response.generated_text });
    } catch (error) {
        console.error('Error with AI assistant:', error);
        res.status(500).json({ 
            error: 'AI service unavailable',
            details: error.message
        });
    }
}));

// Proctor AI Analysis route
router.get('/proctor/analysis', isAuthenticated, isProctor, asyncHandler(async (req, res) => {
    try {
        // Get list of students (simplified implementation)
        const students = await db.query(
            'SELECT id, name, email FROM users WHERE role = $1',
            ['student']
        );
        
        res.render('ai/proctor-analysis', {
            user: req.session.user,
            title: 'Student Performance Analysis',
            students: students.rows || []
        });
    } catch (error) {
        console.error('Error loading AI analysis:', error);
        res.status(500).send('Error loading data: ' + error.message);
    }
}));

// Proctor AI Analysis API endpoint
router.post('/proctor/analyze-student', isAuthenticated, isProctor, asyncHandler(async (req, res) => {
    const { studentId, performanceData } = req.body;
    
    // Create a structured prompt for the AI
    const analysisPrompt = `
    Analyze this student data and provide insights:
    Student ID: ${studentId}
    Performance Data: ${JSON.stringify(performanceData)}
    
    Please provide:
    1. Key strengths
    2. Areas for improvement
    3. Recommended study strategies
    `;
    
    try {
        const response = await hf.textGeneration({
            model: 'facebook/bart-large-cnn',
            inputs: analysisPrompt,
            parameters: {
                max_new_tokens: 250,
                temperature: 0.5,
                return_full_text: false
            }
        });
        
        res.json({ analysis: response.generated_text });
    } catch (error) {
        console.error('Error analyzing student data:', error);
        res.status(500).json({ 
            error: 'Analysis service unavailable',
            details: error.message
        });
    }
}));

module.exports = router;