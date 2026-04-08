const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createLecturer, updateLecturer, deleteLecturer, getLecturers,
  createCourse, getCourses, deleteCourse, assignLecturerToCourse,
  registerStudent, updateStudent, updateStudentCourses, deleteStudent, getAllStudents,
  getAllEnrollments
} = require('../controllers/adminController');

router.use(authenticate, authorize('admin'));

// Lecturers
router.post('/lecturers', createLecturer);
router.get('/lecturers', getLecturers);
router.put('/lecturers/:id', updateLecturer);
router.delete('/lecturers/:id', deleteLecturer);

// Courses
router.post('/courses', createCourse);
router.get('/courses', getCourses);
router.delete('/courses/:id', deleteCourse);
router.put('/courses/assign', assignLecturerToCourse);

// Students
router.post('/students/register', registerStudent);
router.get('/students', getAllStudents);
router.put('/students/:id', updateStudent);
router.put('/students/:id/courses', updateStudentCourses);
router.delete('/students/:id', deleteStudent);

// Enrollments
router.get('/enrollments', getAllEnrollments);

module.exports = router;
