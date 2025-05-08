const Proctor = require('../models/proctorModel');
const db = require('../config/db');

// Get proctor dashboard
exports.getProctorDashboard = async (req, res) => {
    try {
        const proctorId = req.session.user.id;
        console.log('Proctor session:', req.session.user);

        // Get students assigned to this proctor
        const assignedStudents = await db.query(
            'SELECT id, name, email, batch, section, roll_number FROM users WHERE role = $1 AND proctor_id = $2',
            ['student', proctorId]
        );

        // Get unassigned students
        const unassignedStudents = await db.query(
            'SELECT id, name, email FROM users WHERE role = $1 AND (proctor_id IS NULL OR proctor_id = 0)',
            ['student']
        );

        res.render('proctor/dashboard', {
            title: 'Proctor Dashboard',
            user: req.session.user,
            students: assignedStudents.rows || [],
            unassignedStudents: unassignedStudents.rows || []
        });
    } catch (error) {
        console.error('Error loading proctor dashboard:', error);
        res.status(500).send('An error occurred while loading the dashboard');
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

            // Get raw performance data without assuming cgpa exists
            const semesterData = await db.query(
                'SELECT semester, exam_type, subject, marks, max_marks ' +
                'FROM academic_performance ' +
                'WHERE student_id = $1 ' +
                'ORDER BY semester, exam_type, subject',
                [studentId]
            );

            console.log(`Found ${semesterData.rows.length} performance records for student ${studentId}`);

            // Transform the flat data into a nested structure for the frontend
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

// Add announcement
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content } = req.body;
        const proctorId = req.session.user.id;

        console.log(`Creating announcement: ${title}`);

        // Validate input
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Store in database
        const result = await db.query(
            'INSERT INTO announcements (proctor_id, title, content) VALUES ($1, $2, $3) RETURNING id',
            [proctorId, title, content]
        );

        res.json({
            success: true,
            message: 'Announcement created successfully',
            announcementId: result.rows[0].id
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the announcement'
        });
    }
};

// Get proctor's announcements
exports.getProctorAnnouncements = async (req, res) => {
    try {
        const proctorId = req.session.user.id;

        const announcements = await db.query(
            'SELECT id, title, content, created_at FROM announcements ' +
            'WHERE proctor_id = $1 ORDER BY created_at DESC',
            [proctorId]
        );

        res.json({
            success: true,
            announcements: announcements.rows
        });
    } catch (error) {
        console.error('Error getting announcements:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while getting announcements'
        });
    }
};

// Get student profile details
exports.getStudentProfile = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const proctorId = req.session.user.id;

        // Check if student is assigned to this proctor
        const student = await db.query(
            'SELECT u.*, COUNT(ap.id) > 0 as has_performance ' +
            'FROM users u ' +
            'LEFT JOIN academic_performance ap ON u.id = ap.student_id ' +
            'WHERE u.id = $1 AND u.role = $2 AND u.proctor_id = $3 ' +
            'GROUP BY u.id',
            [studentId, 'student', proctorId]
        );

        if (student.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found or not assigned to you'
            });
        }

        const studentData = student.rows[0];

        // Get student's CGPA and attendance (if available)
        try {
            // For CGPA, check if academic_performance table exists
            const tableExists = await db.query(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'academic_performance')"
            );

            if (tableExists.rows[0].exists && studentData.has_performance) {
                // Fetch semester performance data without assuming cgpa column exists
                const semesterData = await db.query(
                    'SELECT semester, exam_type, subject, marks, max_marks ' +
                    'FROM academic_performance ' +
                    'WHERE student_id = $1 ' +
                    'ORDER BY semester, exam_type, subject',
                    [studentId]
                );

                // Calculate CGPA for each semester
                const semesterGroups = {};
                semesterData.rows.forEach(row => {
                    if (!semesterGroups[row.semester]) {
                        semesterGroups[row.semester] = {
                            semester: row.semester,
                            subjects: [],
                            cgpa: 0
                        };
                    }

                    // Track marks for CGPA calculation
                    semesterGroups[row.semester].subjects.push({
                        name: row.subject,
                        marks: parseFloat(row.marks),
                        maxMarks: parseFloat(row.max_marks || 100),
                        examType: row.exam_type
                    });
                });

                // Calculate CGPA for each semester
                Object.keys(semesterGroups).forEach(semester => {
                    const subjects = semesterGroups[semester].subjects;
                    if (subjects.length > 0) {
                        const totalMarks = subjects.reduce((sum, subj) => sum + subj.marks, 0);
                        const totalMaxMarks = subjects.reduce((sum, subj) => sum + subj.maxMarks, 0);
                        const percentage = (totalMarks / totalMaxMarks) * 100;
                        semesterGroups[semester].cgpa = (percentage / 10).toFixed(2);
                    }
                });

                // Convert to the format expected by the frontend
                const semestersArray = Object.values(semesterGroups);

                // Calculate overall CGPA
                if (semestersArray.length > 0) {
                    const totalCGPA = semestersArray.reduce((sum, sem) => sum + parseFloat(sem.cgpa), 0);
                    studentData.cgpa = (totalCGPA / semestersArray.length).toFixed(2);
                    studentData.semesters = semestersArray;
                }
            }

            // For attendance, check if separate attendance table exists
            const attendanceTableExists = await db.query(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendance')"
            );

            if (attendanceTableExists.rows[0].exists) {
                const attendanceData = await db.query(
                    'SELECT AVG(percentage) as avg_attendance FROM attendance WHERE student_id = $1',
                    [studentId]
                );

                if (attendanceData.rows.length > 0 && attendanceData.rows[0].avg_attendance) {
                    studentData.attendance = attendanceData.rows[0].avg_attendance.toFixed(1);
                }
            }
        } catch (dataError) {
            console.error('Error fetching academic data:', dataError);
            // Don't fail if there's an error with academic data
        }

        // Remove sensitive information
        delete studentData.password;

        res.json({
            success: true,
            student: studentData
        });
    } catch (error) {
        console.error('Error getting student profile:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while getting student profile'
        });
    }
};

// Get student notes
exports.getStudentNotes = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const proctorId = req.session.user.id;

        // Check if student is assigned to this proctor
        const student = await db.query(
            'SELECT * FROM users WHERE id = $1 AND role = $2 AND proctor_id = $3',
            [studentId, 'student', proctorId]
        );

        if (student.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found or not assigned to you'
            });
        }

        // Check if notes table exists
        const tableExists = await db.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'proctor_notes')"
        );

        if (!tableExists.rows[0].exists) {
            // Create the table if it doesn't exist
            await db.query(
                'CREATE TABLE proctor_notes (' +
                'id SERIAL PRIMARY KEY, ' +
                'student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, ' +
                'proctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, ' +
                'content TEXT NOT NULL, ' +
                'created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' +
                ')'
            );

            return res.json({
                success: true,
                notes: []
            });
        }

        // Get notes for this student
        const notes = await db.query(
            'SELECT * FROM proctor_notes WHERE student_id = $1 AND proctor_id = $2 ORDER BY created_at DESC',
            [studentId, proctorId]
        );

        res.json({
            success: true,
            notes: notes.rows
        });
    } catch (error) {
        console.error('Error getting student notes:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while getting student notes'
        });
    }
};

// Save student note
exports.saveStudentNote = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const proctorId = req.session.user.id;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Note content is required'
            });
        }

        // Check if student is assigned to this proctor
        const student = await db.query(
            'SELECT * FROM users WHERE id = $1 AND role = $2 AND proctor_id = $3',
            [studentId, 'student', proctorId]
        );

        if (student.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found or not assigned to you'
            });
        }

        // Check if notes table exists
        const tableExists = await db.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'proctor_notes')"
        );

        if (!tableExists.rows[0].exists) {
            // Create the table if it doesn't exist
            await db.query(
                'CREATE TABLE proctor_notes (' +
                'id SERIAL PRIMARY KEY, ' +
                'student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, ' +
                'proctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, ' +
                'content TEXT NOT NULL, ' +
                'created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' +
                ')'
            );
        }

        // Save the note
        await db.query(
            'INSERT INTO proctor_notes (student_id, proctor_id, content) VALUES ($1, $2, $3)',
            [studentId, proctorId, content]
        );

        res.json({
            success: true,
            message: 'Note saved successfully'
        });
    } catch (error) {
        console.error('Error saving student note:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while saving the note'
        });
    }
};

// Get student's performance data for the profile modal
exports.getStudentPerformanceData = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const proctorId = req.session.user.id;

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
                    performance: {}
                });
            }

            // Get performance data without assuming cgpa column exists
            const semesterData = await db.query(
                'SELECT semester, exam_type, subject, marks, max_marks ' +
                'FROM academic_performance ' +
                'WHERE student_id = $1 ' +
                'ORDER BY semester, exam_type, subject',
                [studentId]
            );

            // Format data for the student profile modal
            const semesterGroups = {};
            semesterData.rows.forEach(row => {
                if (!semesterGroups[row.semester]) {
                    semesterGroups[row.semester] = {
                        cgpa: 0,
                        ia1: { subjects: [] },
                        ia2: { subjects: [] },
                        ia3: { subjects: [] },
                        sem: { subjects: [] }
                    };
                }

                // Make sure the exam_type exists in our structure
                if (!semesterGroups[row.semester][row.exam_type]) {
                    semesterGroups[row.semester][row.exam_type] = { subjects: [] };
                }

                // Add subject to the appropriate exam type
                semesterGroups[row.semester][row.exam_type].subjects.push({
                    name: row.subject,
                    marks: row.marks,
                    maxMarks: row.max_marks || 100
                });

                // Also track all subjects for CGPA calculation
                if (!semesterGroups[row.semester].allSubjects) {
                    semesterGroups[row.semester].allSubjects = [];
                }

                semesterGroups[row.semester].allSubjects.push({
                    name: row.subject,
                    marks: parseFloat(row.marks),
                    maxMarks: parseFloat(row.max_marks || 100),
                    examType: row.exam_type
                });
            });

            // Calculate CGPA for each semester
            Object.keys(semesterGroups).forEach(semester => {
                const subjects = semesterGroups[semester].allSubjects || [];
                if (subjects.length > 0) {
                    const totalMarks = subjects.reduce((sum, subj) => sum + subj.marks, 0);
                    const totalMaxMarks = subjects.reduce((sum, subj) => sum + subj.maxMarks, 0);
                    const percentage = (totalMarks / totalMaxMarks) * 100;
                    semesterGroups[semester].cgpa = (percentage / 10).toFixed(1);
                }

                // Delete the temporary allSubjects array
                delete semesterGroups[semester].allSubjects;
            });

            return res.json({
                success: true,
                performance: semesterGroups
            });

        } catch (dbError) {
            console.error('Database error:', dbError);
            return res.json({
                success: true,
                performance: {}
            });
        }

    } catch (error) {
        console.error('Error getting student performance data:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while getting student performance data'
        });
    }
};