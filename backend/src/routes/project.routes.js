const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadProject,
  getProject,
  getStudentProjects,
  searchProjects,
  getApprovedProjects,
  trackDownload
} = require('../controllers/projectController');
const supabase = require('../config/supabase');

// Public — no auth needed
// Public — returns all lecturers for supervisor dropdown
router.get('/lecturers', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'lecturer')
    .order('full_name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
// Returns all courses for lecturer register page
router.get('/courses', async (req, res) => {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, course_code, session')
    .order('course_code', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// All routes below require authentication
router.use(authenticate);

router.post('/', upload.array('files', 2), uploadProject);
router.get('/', getStudentProjects);
router.get('/search', searchProjects);
router.get('/approved', getApprovedProjects);
router.get('/:projectId', getProject);
router.post('/:projectId/download', trackDownload);

module.exports = router;