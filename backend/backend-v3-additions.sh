#!/bin/bash
# Run from INSIDE cs-vault/backend/

echo "🔧 Adding backend endpoints for V3..."

# ── Add courses public endpoint to project routes ─────────────
cat > src/routes/project.routes.js << 'JSEOF'
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadProject, getProject, getStudentProjects,
  searchProjects, getApprovedProjects, trackDownload
} = require('../controllers/projectController');
const supabase = require('../config/supabase');

// Public courses endpoint — for lecturer register page
router.get('/courses', async (req, res) => {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, course_code, session')
    .order('course_code', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Auth required below
router.use(authenticate);

router.post('/', upload.array('files', 2), uploadProject);
router.get('/', getStudentProjects);
router.get('/search', searchProjects);
router.get('/approved', getApprovedProjects);
router.get('/:projectId', getProject);
router.post('/:projectId/download', trackDownload);

module.exports = router;
JSEOF

# ── Add getApprovedProjects to projectController ──────────────
# Check if it exists, if not append it
grep -q "getApprovedProjects" src/controllers/projectController.js || cat >> src/controllers/projectController.js << 'JSEOF'

const getApprovedProjects = async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*, users(full_name, matric_number), courses(title, course_code), grades(grade)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
JSEOF

# Fix the exports line to include getApprovedProjects
# Read current exports and update
node -e "
const fs = require('fs');
let content = fs.readFileSync('src/controllers/projectController.js', 'utf8');
if (!content.includes('getApprovedProjects')) {
  content = content.replace(
    'module.exports = {',
    'module.exports = { getApprovedProjects,'
  );
  fs.writeFileSync('src/controllers/projectController.js', content);
  console.log('Added getApprovedProjects to exports');
} else {
  // Make sure it's in exports
  if (!content.match(/module\.exports.*getApprovedProjects/s)) {
    content = content.replace(
      'module.exports = {',
      'module.exports = { getApprovedProjects,'
    );
    fs.writeFileSync('src/controllers/projectController.js', content);
  }
  console.log('getApprovedProjects already exists');
}
"

echo ""
echo "✅ Backend V3 additions done!"
echo ""
echo "Push backend:"
echo "  git add ."
echo "  git commit -m 'add approved projects + public courses endpoints'"
echo "  git push"
