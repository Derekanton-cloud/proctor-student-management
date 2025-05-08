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

// Assign student to proctor
exports.assignStudent = async (req, res) => {
    try {
        const { studentId } = req.body;
        const proctorId = req.session.user.id;
        
        console.log(`Attempting to assign student ${studentId} to proctor ${proctorId}`);
        
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
        
        console.log(`Student ${studentId} successfully assigned to proctor ${proctorId}`);
        
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

// Get assigned students for a proctor
exports.getAssignedStudents = async (req, res) => {
    try {
        const proctorId = req.session.user.id;
        
        console.log(`Fetching assigned students for proctor ${proctorId}`);
        
        const assignedStudents = await db.query(
            'SELECT id, name, email, batch, current_semester, section, roll_number ' +
            'FROM users WHERE role = $1 AND proctor_id = $2',
            ['student', proctorId]
        );
        
        console.log(`Found ${assignedStudents.rows.length} assigned students`);
        
        res.json({
            success: true,
            students: assignedStudents.rows
        });
    } catch (error) {
        console.error('Error getting assigned students:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while getting assigned students'
        });
    }
};

// Remove a student from a proctor
exports.removeStudent = async (req, res) => {
    try {
        const { studentId } = req.body;
        const proctorId = req.session.user.id;
        
        console.log(`Attempting to remove student ${studentId} from proctor ${proctorId}`);
        
        // Check if student exists and is assigned to this proctor
        const studentCheck = await db.query(
            'SELECT * FROM users WHERE id = $1 AND role = $2 AND proctor_id = $3',
            [studentId, 'student', proctorId]
        );
        
        if (studentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found or not assigned to you'
            });
        }
        
        // Update the student's proctor_id to NULL
        await db.query(
            'UPDATE users SET proctor_id = NULL WHERE id = $1',
            [studentId]
        );
        
        console.log(`Student ${studentId} successfully removed from proctor ${proctorId}`);
        
        res.json({
            success: true,
            message: 'Student successfully removed from your assignments'
        });
    } catch (error) {
        console.error('Error removing student:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while removing the student'
        });
    }
};

// Get student performance data
exports.getStudentPerformance = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const proctorId = req.session.user.id;
        
        console.log(`Fetching performance data for student ${studentId}`);
        
        // Check if student exists and is assigned to this proctor
        const studentCheck = await db.query(
            'SELECT * FROM users WHERE id = $1 AND role = $2 AND proctor_id = $3',
            [studentId, 'student', proctorId]
        );
        
        if (studentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found or not assigned to you'
            });
        }

        // Get student's name for the modal header
        const studentName = studentCheck.rows[0].name;
        
        try {
            // Check if table exists first
            const tableExists = await db.query(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'academic_performance')"
            );
            
            if (!tableExists.rows[0].exists) {
                return res.json({
                    success: true,
                    performance: {
                        studentName: studentName,
                        semesters: []
                    },
                    message: "The academic_performance table doesn't exist yet. Please create it first."
                });
            }
            
            // Get performance data
            const semesterData = await db.query(
                'SELECT semester, exam_type, subject, marks, max_marks ' +
                'FROM academic_performance ' +
                'WHERE student_id = $1 ' +
                'ORDER BY semester, exam_type, subject',
                [studentId]
            );
            
            console.log(`Found ${semesterData.rows.length} performance records for student ${studentId}`);
            
            // Transform the flat data into a nested structure for the frontend
            // This assumes academic_performance has semester, exam_type, subject, marks fields
            const formattedData = {
                studentName: studentName,
                semesters: []
            };
            
            // Group by semester
            const semesterGroups = {};
            semesterData.rows.forEach(row => {
                if (!semesterGroups[row.semester]) {
                    semesterGroups[row.semester] = {
                        name: `Semester ${row.semester}`,
                        cgpa: 0, // We'll calculate this after
                        subjects: [],
                        examTypes: {}
                    };
                }
                
                // Store subject data
                if (!semesterGroups[row.semester].examTypes[row.exam_type]) {
                    semesterGroups[row.semester].examTypes[row.exam_type] = [];
                }
                
                semesterGroups[row.semester].examTypes[row.exam_type].push({
                    name: row.subject,
                    marks: parseFloat(row.marks),
                    maxMarks: parseFloat(row.max_marks || 100)
                });
                
                // Also add to general subjects list
                semesterGroups[row.semester].subjects.push({
                    name: row.subject,
                    marks: parseFloat(row.marks),
                    maxMarks: parseFloat(row.max_marks || 100),
                    examType: row.exam_type
                });
            });
            
            // Calculate CGPA for each semester (simplified calculation)
            Object.keys(semesterGroups).forEach(semester => {
                const subjects = semesterGroups[semester].subjects;
                if (subjects.length > 0) {
                    const totalMarks = subjects.reduce((sum, subj) => sum + subj.marks, 0);
                    const totalMaxMarks = subjects.reduce((sum, subj) => sum + subj.maxMarks, 0);
                    const percentage = (totalMarks / totalMaxMarks) * 100;
                    // Simple CGPA calculation (adjust as needed)
                    semesterGroups[semester].cgpa = (percentage / 10).toFixed(1);
                }
            });
            
            // Convert to array
            formattedData.semesters = Object.values(semesterGroups);
            
            // If no data found
            if (formattedData.semesters.length === 0) {
                console.log(`No performance data found for student ${studentId}`);
                
                // Check table structure to help debug
                const tableStructure = await db.query(
                    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'academic_performance'"
                );
                console.log('Table structure:', tableStructure.rows);
            }
            
            return res.json({
                success: true,
                performance: formattedData
            });
            
        } catch (dbError) {
            console.error('Database error:', dbError);
            return res.json({
                success: true,
                performance: {
                    studentName: studentName,
                    semesters: []
                },
                message: "Database error: " + dbError.message
            });
        }
        
    } catch (error) {
        console.error('Error getting student performance:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while getting student performance',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};      

// Get unassigned students
exports.getUnassignedStudents = async (req, res) => {
    try {
        console.log('Fetching unassigned students');
        
        const unassignedStudents = await db.query(
            'SELECT id, name, email, batch, current_semester, section, roll_number ' +
            'FROM users WHERE role = $1 AND proctor_id IS NULL',
            ['student']
        );
        
        console.log(`Found ${unassignedStudents.rows.length} unassigned students`);
        
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

// Get all students for API
exports.getStudentsAPI = async (req, res) => {
    try {
        console.log('Fetching all students for API');
        
        // Query to get students (both assigned and unassigned)
        const students = await db.query(
            'SELECT id, name FROM users WHERE role = $1',
            ['student']
        );
        
        console.log(`Found ${students.rows.length} students total`);
        
        res.json({ 
            success: true,
            students: students.rows 
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch students',
            message: error.message
        });
    }
};