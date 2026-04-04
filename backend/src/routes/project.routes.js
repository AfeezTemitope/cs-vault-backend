const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadProject, getProject, getStudentProjects, searchProjects } = require('../controllers/projectController');

router.use(authenticate);

router.post('/', upload.array('files', 2), uploadProject);
router.get('/', getStudentProjects);
router.get('/search', searchProjects);
router.get('/:projectId', getProject);

module.exports = router;
