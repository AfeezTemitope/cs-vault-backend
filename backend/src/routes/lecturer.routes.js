const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getMyCourses, getCourseDetails, registerStudent, gradeProject, getAllProjects } = require('../controllers/lecturerController');
const { approveProject, rejectProject } = require('../controllers/projectController');

router.use(authenticate, authorize('lecturer', 'admin'));

router.get('/courses', getMyCourses);
router.get('/courses/:courseId', getCourseDetails);
router.post('/students/register', registerStudent);
router.put('/projects/:projectId/grade', gradeProject);
router.put('/projects/:projectId/approve', approveProject);
router.put('/projects/:projectId/reject', rejectProject);
router.get('/projects', getAllProjects);

module.exports = router;
