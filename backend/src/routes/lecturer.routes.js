const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getMyCourses, getCourseDetails, registerStudent,
  bulkRegisterStudents, gradeProject, getAllProjects
} = require('../controllers/lecturerController');

router.use(authenticate, authorize('lecturer', 'admin'));

router.get('/courses', getMyCourses);
router.get('/courses/:courseId', getCourseDetails);
router.post('/students/register', registerStudent);
router.post('/students/bulk', upload.single('file'), bulkRegisterStudents);
router.put('/projects/:projectId/grade', gradeProject);
router.get('/projects', getAllProjects);

module.exports = router;
