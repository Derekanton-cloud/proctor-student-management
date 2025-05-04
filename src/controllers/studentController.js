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

        // Fetch student details with proctor information
        const userId = req.session.user.id;
        const result = await db.query(`
            SELECT u.*, 
                   p.name as proctor_name
            FROM users u
            LEFT JOIN users p ON u.proctor_id = p.id
            WHERE u.id = $1 AND u.role = $2
        `, [userId, 'student']);

        if (result.rows.length === 0) {
            console.log('Student not found in database:', userId);
            return res.redirect('/auth/login');
        }

        const user = result.rows[0];
        
        // Render dashboard with user data
        res.render('student/dashboard', {
            title: 'Student Dashboard',
            user: user,
            // Keep studentDetails for backward compatibility
            studentDetails: user
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

// Add this function to your existing studentController.js
exports.savePerformanceData = async (req, res) => {
    try {
        const { semester, examType, subjects, cgpa } = req.body;
        const studentId = req.session.user.id;
        
        // Validate the input data
        if (!semester || !examType || !Array.isArray(subjects)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid data format' 
            });
        }
        
        // Check if record already exists for this student, semester and exam type
        const existingRecord = await db.query(
            'SELECT id FROM student_performance WHERE student_id = $1 AND semester = $2 AND exam_type = $3',
            [studentId, semester, examType]
        );
        
        let performanceId;
        
        if (existingRecord.rows.length > 0) {
            // Update existing record
            performanceId = existingRecord.rows[0].id;
            await db.query(
                'UPDATE student_performance SET cgpa = $1, updated_at = NOW() WHERE id = $2',
                [cgpa || null, performanceId]
            );
        } else {
            // Create new record
            const result = await db.query(
                'INSERT INTO student_performance (student_id, semester, exam_type, cgpa, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
                [studentId, semester, examType, cgpa || null]
            );
            performanceId = result.rows[0].id;
        }
        
        // First delete existing subjects for this performance record
        if (existingRecord.rows.length > 0) {
            await db.query(
                'DELETE FROM performance_subjects WHERE performance_id = $1',
                [performanceId]
            );
        }
        
        // Insert subjects
        for (const subject of subjects) {
            await db.query(
                'INSERT INTO performance_subjects (performance_id, subject_name, marks) VALUES ($1, $2, $3)',
                [performanceId, subject.name, subject.marks || null]
            );
        }
        
        res.json({
            success: true,
            message: 'Performance data saved successfully'
        });
    } catch (error) {
        console.error('Error saving performance data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while saving performance data'
        });
    }
};

// Function to get performance data for a student
exports.getPerformanceData = async (req, res) => {
    try {
        const studentId = req.session.user.id;
        
        // Get all performance records for this student
        const performance = await db.query(
            'SELECT id, semester, exam_type, cgpa FROM student_performance WHERE student_id = $1 ORDER BY semester, exam_type',
            [studentId]
        );

        console.log('Found performance records:', performance.rows.length); // Add logging
        
        // For each performance record, get the subjects
        const result = {};
        
        for (const record of performance.rows) {
            const subjects = await db.query(
                'SELECT subject_name, marks FROM performance_subjects WHERE performance_id = $1',
                [record.id]
            );

            console.log(`Found ${subjects.rows.length} subjects for record ID ${record.id}`); // Add logging
            
            // Initialize the semester if not already present
            if (!result[record.semester]) {
                result[record.semester] = {
                    ia1: { subjects: [], cgpa: '' },
                    ia2: { subjects: [], cgpa: '' },
                    ia3: { subjects: [], cgpa: '' },
                    sem: { subjects: [], cgpa: '' }
                };
            }
            
            // Map database format to client format
            result[record.semester][record.exam_type] = {
                cgpa: record.cgpa || '',
                subjects: subjects.rows.map(s => ({
                    name: s.subject_name,
                    marks: s.marks || ''
                }))
            };
        }
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching performance data:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching performance data'
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // Get user with proctor information
        const result = await db.query(`
            SELECT u.*, 
                   p.name as proctor_name
            FROM users u
            LEFT JOIN users p ON u.proctor_id = p.id
            WHERE u.id = $1
        `, [req.session.user.id]);
        
        const user = result.rows[0];
        
        res.render('student/profile', {
            title: 'Edit Profile',
            user: user
        });
    } catch (error) {
        console.error('Error loading profile:', error);
        res.status(500).send('An error occurred loading your profile');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, batch, current_semester, section, roll_number } = req.body;
        const userId = req.session.user.id;
        
        // Validate input
        if (!batch || !current_semester || !section || !roll_number) {
            return res.render('student/profile', {
                title: 'Edit Profile',
                user: { ...req.session.user, ...req.body },
                error: 'All fields are required'
            });
        }
        
        // Update user profile
        await db.query(`
            UPDATE users
            SET name = $1,
                batch = $2, 
                current_semester = $3,
                section = $4,
                roll_number = $5,
                updated_at = NOW()
            WHERE id = $6
        `, [name, batch, current_semester, section, roll_number, userId]);
        
        // Update session data
        req.session.user = {
            ...req.session.user,
            name,
            batch,
            current_semester,
            section,
            roll_number
        };
        
        // Redirect with success message
        res.redirect('/student/dashboard');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('An error occurred updating your profile');
    }
};
