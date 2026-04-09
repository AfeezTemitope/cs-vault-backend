const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadProject, getProject, getStudentProjects,
  searchProjects, getPublicProjects, trackDownload
} = require('../controllers/projectController');

// Public — no auth required
router.get('/public', getPublicProjects);

// Auth required
router.use(authenticate);
router.post('/', upload.array('files', 2), uploadProject);
router.get('/', getStudentProjects);
router.get('/search', searchProjects);
router.get('/:projectId', getProject);
router.post('/:projectId/download', trackDownload);

module.exports = router;
