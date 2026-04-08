const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getMyCourses, getCourseDetails, registerStudent,
  gradeProject, getAllProjects
} = require('../controllers/lecturerController');

router.use(authenticate, authorize('lecturer', 'admin'));

router.get('/courses', getMyCourses);
router.get('/courses/:courseId', getCourseDetails);
router.post('/students/register', registerStudent);
router.put('/projects/:projectId/grade', gradeProject);
router.get('/projects', getAllProjects);

module.exports = router;