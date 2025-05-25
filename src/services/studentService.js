const Student = require('../models/studentModel');

exports.getStudentData = async (studentId) => {
  try {
    console.log('Looking for student with userID:', studentId); // Debug log
    const student = await Student.findOne({ where: { userId: studentId } });
    console.log('Student found:', student); // Debug log
    
    if (!student) return null;
    
    // Transform database data into a format suitable for analysis
    return {
      id: student.userId,
      name: student.name,
      email: student.email,
      batch: student.batch,
      section: student.section,
      cgpa: student.cgpa,
      attendance: student.attendance,
      semesters: student.semesters || [],
      // Add other fields as needed
    };
  } catch (error) {
    console.error('Error fetching student data:', error);
    return null;
  }
};

exports.getStudentDataWithHistory = async (studentId) => {
  try {
    const studentData = await exports.getStudentData(studentId);
    
    if (!studentData) return null;
    
    // Calculate semester progress for trend analysis
    // This is just an example - adjust based on your data structure
    if (studentData.semesters && studentData.semesters.length > 1) {
      const currentSemester = studentData.semesters[studentData.semesters.length - 1];
      const previousSemester = studentData.semesters[studentData.semesters.length - 2];
      
      studentData.semesterProgress = 
        (parseFloat(currentSemester.cgpa) - parseFloat(previousSemester.cgpa)) || 0;
    } else {
      studentData.semesterProgress = 0;
    }
    
    return studentData;
  } catch (error) {
    console.error('Error fetching student history data:', error);
    return null;
  }
};