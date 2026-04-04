const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createLecturer, getLecturers, createCourse,
  getCourses, assignLecturerToCourse, getAllStudents
} = require('../controllers/adminController');

router.use(authenticate, authorize('admin'));

router.post('/lecturers', createLecturer);
router.get('/lecturers', getLecturers);
router.post('/courses', createCourse);
router.get('/courses', getCourses);
router.put('/courses/assign', assignLecturerToCourse);
router.get('/students', getAllStudents);

module.exports = router;
